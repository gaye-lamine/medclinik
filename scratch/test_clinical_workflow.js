const backendUrl = 'http://localhost:3006';

async function apiCall(path, method = 'GET', body = null, token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${backendUrl}${path}`, options);
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`API error at ${method} ${path}: Status ${res.status} - ${errText}`);
  }
  return res.json();
}

async function getToken(email, password) {
  console.log(`Authenticating ${email}...`);
  const loginRes = await apiCall('/auth/login', 'POST', { email, password });
  if (!loginRes.requires2fa) {
    throw new Error('Expected 2FA flow');
  }
  const verifyRes = await apiCall('/auth/verify-2fa', 'POST', {
    tempToken: loginRes.tempToken,
    code: '123456',
  });
  console.log(`Success: Authenticated ${email}.`);
  return verifyRes.accessToken;
}

async function run() {
  try {
    // 1. Authenticate users
    const adminToken = await getToken('admin@medclinik.com', 'admin123');
    const cashierToken = await getToken('cashier@medclinik.com', 'cashier123');
    const nurseToken = await getToken('nurse@medclinik.com', 'nurse123');
    const doctorToken = await getToken('doctor@medclinik.com', 'doctor123');

    console.log('\n--- 1. Registering a Patient ---');
    const patient = await apiCall('/patients', 'POST', {
      firstName: 'Koffi',
      lastName: 'Yao',
      dateOfBirth: '1990-04-12',
      gender: 'M',
      phoneNumber: '+2250505123456',
      address: 'Abidjan, Zone 4',
      mutuelleName: 'IPM Senelec',
      insuranceCoverageShare: 70
    }, adminToken);
    console.log(`Registered patient Koffi Yao. Code: ${patient.code}, ID: ${patient.id}`);

    // Fetch doctors to find a valid doctor id
    const doctors = await apiCall('/doctors', 'GET', null, adminToken);
    const doctorObj = doctors.find(d => d.email === 'doctor@medclinik.com');
    if (!doctorObj) throw new Error('Doctor not found in DB');

    console.log('\n--- 2. Booking a Consultation Appointment ---');
    const appointment = await apiCall('/appointments', 'POST', {
      patientId: patient.id,
      doctorId: doctorObj.id,
      dateTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      specialty: 'Général',
      notes: 'Consultation annuelle'
    }, adminToken);
    console.log(`Appointment created with ID: ${appointment.id}`);

    console.log('\n--- 3. Admitting the Patient ---');
    const admission = await apiCall(`/appointments/admit/${appointment.id}`, 'POST', null, adminToken);
    console.log(`Patient admitted.`);
    console.log(`Appointment Status updated to: ${admission.appointment.status}`);
    console.log(`Billing Record (Unpaid) created with ID: ${admission.bill.id}`);
    console.log(`Consultation Record (Pending) created with ID: ${admission.consultation.id}`);

    console.log('\n--- 4. Cashier payment of consultation fee ---');
    const payment = await apiCall(`/billing/pay/${admission.bill.id}`, 'POST', {
      paymentMethod: 'WAVE',
      transactionId: 'TX-TEST-MOBI-987'
    }, cashierToken);
    console.log(`Billing Status updated to: ${payment.status}`);

    // Verify consultation is PENDING/PAID
    let consult = await apiCall(`/consultations/${admission.consultation.id}`, 'GET', null, doctorToken);
    console.log(`Initial Consultation Status: ${consult.status}`);

    // Verify queue entries
    const queueBeforeVitals = await apiCall('/queue', 'GET', null, nurseToken);
    const patientQueueEntry = queueBeforeVitals.find(q => q.patientId === patient.id);
    if (!patientQueueEntry) {
      throw new Error('Patient was not added to the queue after bill payment!');
    }
    console.log(`Patient is in queue: Department=${patientQueueEntry.department}, Status=${patientQueueEntry.status}`);

    console.log('\n--- 5. Nurse records patient vitals ---');
    const vitals = await apiCall('/vitals', 'POST', {
      patientId: patient.id,
      temperature: '38.2',
      bloodPressure: '120/80',
      weight: '75',
      heartRate: '82',
      bloodSugar: '1.05',
      oxygenSaturation: '99',
      comments: 'Patient conscient, fièvre modérée'
    }, nurseToken);
    console.log(`Vitals recorded successfully. Vitals ID: ${vitals.id}`);

    // Verify queue updated to CONSULTATION
    const queueAfterVitals = await apiCall('/queue', 'GET', null, doctorToken);
    const updatedQueueEntry = queueAfterVitals.find(q => q.patientId === patient.id);
    if (!updatedQueueEntry || updatedQueueEntry.department !== 'CONSULTATION') {
      throw new Error(`Queue did not transition to CONSULTATION. Actual: ${JSON.stringify(updatedQueueEntry)}`);
    }
    console.log(`Patient queue updated: Department=${updatedQueueEntry.department}, Status=${updatedQueueEntry.status}`);

    console.log('\n--- 6. Doctor starts consultation ---');
    consult = await apiCall(`/consultations/start/${admission.consultation.id}`, 'POST', null, doctorToken);
    console.log(`Consultation updated. Status: ${consult.status}`);

    console.log('\n--- 7. Doctor creates prescription ---');
    const prescription = await apiCall(`/consultations/prescription/${admission.consultation.id}`, 'POST', {
      medicines: [
        { name: 'Paracétamol 500mg', dosage: '1 comprimé 3x par jour', duration: '5 jours' },
        { name: 'Amoxicilline 500mg', dosage: '1 gélule 2x par jour', duration: '7 jours' }
      ],
      instructions: 'Prendre avec beaucoup d\'eau.'
    }, doctorToken);
    console.log(`Prescription created. RX Code: ${prescription.uniqueCode}`);

    console.log('\n--- 8. Doctor completes consultation ---');
    consult = await apiCall(`/consultations/complete/${admission.consultation.id}`, 'POST', {
      diagnosis: 'Fièvre légère d\'origine virale',
      notes: 'Suivi dans 3 jours si pas d\'amélioration.'
    }, doctorToken);
    console.log(`Consultation completed. Status: ${consult.status}`);

    // Check if patient is removed from queue
    const queueAfterConsult = await apiCall('/queue', 'GET', null, adminToken);
    const patientQueueAfter = queueAfterConsult.find(q => q.patientId === patient.id);
    if (patientQueueAfter) {
      throw new Error('Patient is still in queue after consultation was completed!');
    }
    console.log('Patient successfully removed from waiting queue.');

    console.log('\n--- 9. Pharmacy: Look up prescription by RX code ---');
    const rxLookup = await apiCall(`/stock/prescription/${prescription.uniqueCode}`, 'GET', null, adminToken);
    console.log(`Prescription found. Code: ${rxLookup.uniqueCode}, Delivered: ${rxLookup.isDelivered}`);

    // Get current stock levels
    const stockItemsBefore = await apiCall('/stock', 'GET', null, adminToken);
    const paracetamolsBefore = stockItemsBefore.find(s => s.name.startsWith('Paracétamol'));
    console.log(`Stock level of Paracétamol before delivery: ${paracetamolsBefore ? paracetamolsBefore.quantity : 'N/A'}`);

    console.log('\n--- 10. Pharmacy: Deliver prescription and deduct stock ---');
    const delivery = await apiCall(`/stock/deliver/${prescription.id}`, 'POST', null, adminToken);
    console.log(`Prescription delivered. Success: ${delivery.success}`);
    console.log(`Items Deducted count: ${delivery.stockItemsDeducted}, Pharmacy Billing Amount: ${delivery.totalBilling} FCFA`);

    // Verify stock deduction
    const stockItemsAfter = await apiCall('/stock', 'GET', null, adminToken);
    const paracetamolsAfter = stockItemsAfter.find(s => s.name.startsWith('Paracétamol'));
    console.log(`Stock level of Paracétamol after delivery: ${paracetamolsAfter ? paracetamolsAfter.quantity : 'N/A'}`);

    if (paracetamolsBefore && paracetamolsAfter) {
      const diff = paracetamolsBefore.quantity - paracetamolsAfter.quantity;
      if (diff === 1) {
        console.log('\n✅ SUCCESS: Stock decreased by exactly 1 box of Paracétamol!');
      } else {
        console.error(`\n❌ FAILED: Expected stock decrease of 1, got decrease of ${diff}`);
        process.exit(1);
      }
    } else {
      console.error('\n❌ FAILED: Could not retrieve stock details before/after.');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Integration Workflow Test FAILED:', error.message);
    process.exit(1);
  }
}

run();
