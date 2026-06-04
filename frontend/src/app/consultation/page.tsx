'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth, API_URL } from '../../components/AuthContext';

// Préfixe REST pour les appels HTTP directs (les URLs /uploads utilisent API_URL)
const API_REST_URL = `${API_URL}/api`;
import { useToast } from '../../components/ToastContext';
import { Logo } from '../../components/Logo';
import { generatePrescriptionPDF } from '../../utils/pdfGenerator';

interface Patient {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  gender: string;
  phoneNumber: string;
  mutuelleName?: string;
  insuranceCoverageShare: number;
}

interface Vitals {
  id: string;
  temperature?: number;
  bloodPressure?: string;
  weight?: number;
  heartRate?: number;
  bloodSugar?: number;
  oxygenSaturation?: number;
  comments?: string;
}

interface Bill {
  id: string;
  status: 'UNPAID' | 'PAID';
}

interface Prescription {
  id: string;
  uniqueCode: string;
  medicines: Array<{ name: string; dosage: string; duration: string }>;
  instructions?: string;
  createdAt: string;
}

interface Consultation {
  id: string;
  patientId: string;
  patient: Patient;
  specialty: string;
  status: 'PENDING' | 'PAID' | 'IN_PROGRESS' | 'COMPLETED';
  vitalsId?: string;
  vitals?: Vitals;
  billingId?: string;
  billing?: Bill;
  diagnosis?: string;
  notes?: string;
  prescriptions?: Prescription[];
  doctor: { name: string };
  createdAt: string;
}

export default function ConsultationPage() {
  const { user, apiFetch, token } = useAuth();
  const { toast } = useToast();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [selectedConsult, setSelectedConsult] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blockingError, setBlockingError] = useState<string | null>(null);

  // Files module states
  const [patientFiles, setPatientFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [fileCustomName, setFileCustomName] = useState('');
  const [selectedFile, setSelectedFile] = useState<any>(null);

  // Form states
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [specialtyTemplate, setSpecialtyTemplate] = useState('General');
  
  // Prescription Builder
  const [medicines, setMedicines] = useState<Array<{ name: string; dosage: string; duration: string }>>([]);
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medDuration, setMedDuration] = useState('');
  const [instructions, setInstructions] = useState('');
  const [activePrescription, setActivePrescription] = useState<Prescription | null>(null);

  const fetchConsultations = useCallback(async () => {
    try {
      const res = await apiFetch('/consultations');
      setConsultations(res);
    } catch (e: any) {
      console.error(e);
      setError('Impossible de récupérer la liste des consultations.');
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    if (token) {
      fetchConsultations();
    }
  }, [token, fetchConsultations]);

  // Handle specialty template pre-fills
  const applyTemplate = (type: string) => {
    setSpecialtyTemplate(type);
    if (type === 'Pediatrics') {
      setDiagnosis('Angine rouge virale / Rhinopharyngite aiguë');
      setNotes('Enfant présente une fièvre modérée avec encombrement nasal. Poumons libres. Hydratation à surveiller. Pas d\'antibiothérapie requise à ce stade.');
    } else if (type === 'Gynecology') {
      setDiagnosis('Suivi de grossesse (2ème trimestre)');
      setNotes('Hauteur utérine normale. Mouvements fœtaux actifs perçus. Bruits du cœur réguliers. Constantes maternelles satisfaisantes. Bilan sanguin prescrit.');
    } else {
      setDiagnosis('');
      setNotes('');
    }
  };

  const handleConsultSelect = async (consult: Consultation) => {
    setError(null);
    setBlockingError(null);
    setSelectedConsult(null);
    setActivePrescription(null);
    setPatientFiles([]);

    try {
      const details = await apiFetch(`/consultations/${consult.id}`);
      setSelectedConsult(details);
      setDiagnosis(details.diagnosis || '');
      setNotes(details.notes || '');
      setMedicines([]);
      
      if (details.prescriptions && details.prescriptions.length > 0) {
        setActivePrescription(details.prescriptions[0]);
      }

      // Fetch patient files
      const files = await apiFetch(`/files/patient/${consult.patientId}`);
      setPatientFiles(files);

      if (details.status === 'PAID') {
        await apiFetch(`/consultations/start/${consult.id}`, { method: 'POST' });
        fetchConsultations();
      }
    } catch (e: any) {
      console.error(e);
      if (e.status === 403) {
        setBlockingError(
          `Dossier verrouillé — Contrôle Anti-Fraude : Le dossier de ${consult.patient.firstName} ${consult.patient.lastName} n'est pas accessible car la consultation n'a pas été réglée à la caisse.`
        );
        setSelectedConsult(consult);
      } else {
        setError(e.message || 'Erreur lors du chargement du dossier médical');
      }
    }
  };

  const handleFileUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedConsult) return;
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem('file') as HTMLInputElement;
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      toast.warning('Veuillez sélectionner un fichier.');
      return;
    }
    
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', fileCustomName || file.name);
    formData.append('consultationId', selectedConsult.id);

    try {
      setUploading(true);
      const response = await fetch(`${API_REST_URL}/files/patient/${selectedConsult.patientId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erreur lors du téléversement du fichier.');
      }

      const newFile = await response.json();
      setPatientFiles((prev) => [newFile, ...prev]);
      setFileCustomName('');
      form.reset();
      toast.success('Fichier médical téléversé avec succès dans le DMP.');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Impossible de téléverser le fichier.');
    } finally {
      setUploading(false);
    }
  };


  // Prescription builder helpers
  const addMedicine = () => {
    if (!medName || !medDosage || !medDuration) return;
    setMedicines([...medicines, { name: medName, dosage: medDosage, duration: medDuration }]);
    setMedName('');
    setMedDosage('');
    setMedDuration('');
  };

  const removeMedicine = (idx: number) => {
    setMedicines(medicines.filter((_, i) => i !== idx));
  };

  const handleCreatePrescription = async () => {
    if (!selectedConsult || medicines.length === 0) return;
    try {
      setError(null);
      const rx = await apiFetch(`/consultations/prescription/${selectedConsult.id}`, {
        method: 'POST',
        body: JSON.stringify({ medicines, instructions }),
      });
      setActivePrescription(rx);
      toast.success('Ordonnance numérique signée avec succès.');
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la signature de l\'ordonnance');
      toast.error(e.message || 'Erreur lors de la signature de l\'ordonnance');
    }
  };

  const handleCompleteConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConsult) return;

    try {
      setError(null);
      await apiFetch(`/consultations/complete/${selectedConsult.id}`, {
        method: 'POST',
        body: JSON.stringify({ diagnosis, notes }),
      });
      setSelectedConsult(null);
      fetchConsultations();
      toast.success('Consultation médicale terminée et archivée dans le DMP.');
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la validation clinique');
      toast.error(e.message || 'Erreur lors de la validation clinique');
    }
  };

  if (loading) {
    return (
      <div style={styles.spinnerWrapper}>
        <div className="spinner"></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Chargement des dossiers médicaux...</p>
      </div>
    );
  }

  const hasAccess = user?.role === 'DOCTOR' || user?.role === 'ADMIN';
  if (!hasAccess) {
    return (
      <div className="glass-card" style={{ maxWidth: '500px', margin: '3rem auto', textAlign: 'center', padding: '2rem' }}>
        <h3 style={{ color: 'var(--danger)' }}>Accès restreint</h3>
        <p style={{ margin: '1rem 0', color: 'var(--text-muted)' }}>
          Ce module est strictement réservé aux médecins agrégés pour l'examen clinique des patients et l'édition d'ordonnances.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <style jsx global>{`
        @media print {
          body, html {
            background: #ffffff !important;
            color: #000000 !important;
          }
          header, .navbar, .btn, .no-print, .main-content > *:not(.print-prescription-only), .glass-card:not(.print-prescription-only) {
            display: none !important;
          }
          .main-content {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
          }
          .app-container {
            display: block !important;
          }
          .print-prescription-only {
            display: block !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: #ffffff !important;
            color: #000000 !important;
            padding: 1.5cm !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            font-family: 'SF Pro Display', -apple-system, sans-serif !important;
          }
          .print-prescription-only * {
            color: #000000 !important;
          }
        }
      `}</style>
      <div>
        <h1>Dossier Médical Partagé (DMP) &amp; Consultations</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          Consultez la file d'attente des patients, examinez les constantes triées, et saisissez le diagnostic.
        </p>
      </div>

      {error && (
        <div style={styles.errorAlert}>
          <strong>Alerte :</strong> {error}
        </div>
      )}

      {/* Blocking anti-fraud notice */}
      {blockingError && (
        <div style={styles.fraudAlert} className="glass-card">
          <h4 style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>Accès au Dossier Bloqué</h4>
          <p style={{ color: 'var(--text-muted)', margin: '0.75rem 0', fontSize: '0.9rem' }}>
            {blockingError}
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            MedClinik bloque l'ouverture du dossier tant que la caisse n'a pas validé l'encaissement correspondant. Ce mécanisme prévient les consultations non déclarées et les fuites financières.
          </p>

        </div>
      )}

      <div className="grid-3">
        {/* Waiting List */}
        <div className="glass-card" style={{ gridColumn: 'span 1', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3>File d'attente Médecin</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Patients triés en attente d'avis médical.</p>

          <div style={styles.list}>
            {consultations.filter(c => c.status !== 'COMPLETED').length === 0 ? (
              <p style={styles.emptyText}>Aucun patient en attente.</p>
            ) : (
              consultations.filter(c => c.status !== 'COMPLETED').map((c) => {
                const isSelected = selectedConsult?.id === c.id;
                const isUnpaid = c.status === 'PENDING';
                return (
                  <div
                    key={c.id}
                    onClick={() => handleConsultSelect(c)}
                    style={{
                      ...styles.queueCard,
                      ...(isSelected ? styles.queueCardActive : {}),
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>{c.patient.firstName} {c.patient.lastName}</strong>
                      <span className={`badge ${isUnpaid ? 'badge-unpaid' : 'badge-paid'}`} style={{ fontSize: '0.65rem' }}>
                        {isUnpaid ? 'Impayé' : 'Payé'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                      Code: {c.patient.code} | Service: {c.specialty}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Clinical Exam & Prescription Editor */}
        <div className="glass-card" style={{ gridColumn: 'span 2' }}>
          {selectedConsult && !blockingError ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={styles.selectedHeader}>
                <div>
                  <h3>Examen médical : {selectedConsult.patient.firstName} {selectedConsult.patient.lastName}</h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Code unique DMP : {selectedConsult.patient.code}</span>
                </div>
                <div style={styles.templateSwitcher}>
                  <button onClick={() => applyTemplate('General')} className={`btn ${specialtyTemplate === 'General' ? 'btn-primary' : 'btn-secondary'}`} style={styles.smallBtn}>Général</button>
                  <button onClick={() => applyTemplate('Pediatrics')} className={`btn ${specialtyTemplate === 'Pediatrics' ? 'btn-primary' : 'btn-secondary'}`} style={styles.smallBtn}>Pédiatrie</button>
                  <button onClick={() => applyTemplate('Gynecology')} className={`btn ${specialtyTemplate === 'Gynecology' ? 'btn-primary' : 'btn-secondary'}`} style={styles.smallBtn}>Gynécologie</button>
                </div>
              </div>

              {/* Vitals summary */}
              {selectedConsult.vitals ? (
                <div style={styles.vitalsSummary}>
                  <h4 style={{ marginBottom: '0.75rem' }}>Données Vitales — Triage Infirmerie</h4>
                  <div style={styles.vitalsGrid}>
                    <div>Température: <strong>{selectedConsult.vitals.temperature || 'N/A'} °C</strong></div>
                    <div>Tension: <strong>{selectedConsult.vitals.bloodPressure || 'N/A'}</strong></div>
                    <div>Poids: <strong>{selectedConsult.vitals.weight || 'N/A'} kg</strong></div>
                    <div>Pouls: <strong>{selectedConsult.vitals.heartRate || 'N/A'} bpm</strong></div>
                    <div>Glycémie: <strong>{selectedConsult.vitals.bloodSugar || 'N/A'} g/L</strong></div>
                    <div>SpO2: <strong>{selectedConsult.vitals.oxygenSaturation || 'N/A'} %</strong></div>
                  </div>
                  {selectedConsult.vitals.comments && (
                    <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      * Note infirmière : {selectedConsult.vitals.comments}
                    </p>
                  )}
                </div>
              ) : (
                <div style={styles.warningBanner}>
                  Attention : Aucune constante vitale enregistrée pour cette consultation par l'infirmerie.
                </div>
              )}

              {/* Prescription builder */}
              <div style={styles.prescriptionBuilder} className="glass-card">
                <h4>Éditer une Ordonnance Numérique</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                  Ajoutez les médicaments prescrits. L'ordonnance génèrera un identifiant cryptographique de sécurité.
                </p>

                {!activePrescription ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="grid-3">
                      <div className="form-group">
                        <label className="form-label">Médicament</label>
                        <input type="text" placeholder="ex: Doliprane 1g" value={medName} onChange={(e) => setMedName(e.target.value)} className="form-input" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Posologie</label>
                        <input type="text" placeholder="ex: 1 comp. 3 fois/jour" value={medDosage} onChange={(e) => setMedDosage(e.target.value)} className="form-input" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Durée</label>
                        <input type="text" placeholder="ex: 5 jours" value={medDuration} onChange={(e) => setMedDuration(e.target.value)} className="form-input" />
                      </div>
                    </div>

                    <button type="button" onClick={addMedicine} className="btn btn-secondary" style={{ alignSelf: 'flex-start' }}>
                      + Ajouter le médicament
                    </button>

                    {/* Temporary Medicines table */}
                    {medicines.length > 0 && (
                      <table style={styles.rxTable}>
                        <thead>
                          <tr>
                            <th>Molécule</th>
                            <th>Posologie</th>
                            <th>Durée</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {medicines.map((med, idx) => (
                            <tr key={idx}>
                              <td>{med.name}</td>
                              <td>{med.dosage}</td>
                              <td>{med.duration}</td>
                              <td>
                                <button type="button" onClick={() => removeMedicine(idx)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}>
                                  Supprimer
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    <div className="form-group">
                      <label className="form-label">Recommandations particulières (Facultatif)</label>
                      <input type="text" placeholder="ex: Prendre pendant les repas..." value={instructions} onChange={(e) => setInstructions(e.target.value)} className="form-input" />
                    </div>

                    <button
                      type="button"
                      onClick={handleCreatePrescription}
                      disabled={medicines.length === 0}
                      className="btn btn-success"
                      style={{ alignSelf: 'flex-end' }}
                    >
                      Signer et Générer l'Ordonnance
                    </button>
                  </div>
                ) : (
                  <div style={styles.activeRxSheet} className="print-prescription-only">
                    {/* Screen-only header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }} className="no-print">
                      <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>Ordonnance Signée Numériquement</span>
                      <span style={{ fontFamily: 'monospace', color: 'var(--primary-color)' }}>ID: {activePrescription.uniqueCode}</span>
                    </div>

                    {/* Official Prescription Sheet */}
                    <div style={styles.rxContentPrint}>
                      {/* Clinic Letterhead Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #000', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                          <Logo size={42} mode="print" />
                          <div style={{ textAlign: 'left' }}>
                            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#000' }}>MedClinik</h3>
                            <p style={{ margin: 0, fontSize: '0.72rem', color: '#555', fontWeight: 600 }}>SÉCURITÉ & EXCELLENCE HOSPITALIÈRE</p>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#333', lineHeight: 1.4 }}>
                          <p><strong>Clinique MedClinik Cocody</strong></p>
                          <p>Abidjan, Mermoz — BP 221</p>
                          <p>Tél: +225 07 00 00 00</p>
                          <p>contact@medclinik.com</p>
                        </div>
                      </div>

                      {/* Doctor & Patient Metadata Info */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem', marginBottom: '2rem', fontSize: '0.85rem', color: '#000' }}>
                        <div style={{ borderRight: '1px solid #ddd', paddingRight: '1rem', textAlign: 'left' }}>
                          <p style={{ margin: '0.2rem 0', color: '#666', fontWeight: 600 }}>PRATICIEN PRECRIPTEUR :</p>
                          <p style={{ fontSize: '1.05rem', fontWeight: 'bold', margin: '0.1rem 0' }}>Dr. {selectedConsult.doctor.name}</p>
                          <p style={{ color: '#555', fontSize: '0.8rem' }}>Spécialité : {selectedConsult.specialty}</p>
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <p style={{ margin: '0.2rem 0', color: '#666', fontWeight: 600 }}>PATIENT :</p>
                          <p style={{ fontSize: '1.05rem', fontWeight: 'bold', margin: '0.1rem 0' }}>{selectedConsult.patient.firstName} {selectedConsult.patient.lastName}</p>
                          <p style={{ color: '#555', fontSize: '0.8rem' }}>Code DMP : {selectedConsult.patient.code} | Sexe : {selectedConsult.patient.gender}</p>
                          <p style={{ color: '#555', fontSize: '0.8rem', marginTop: '0.4rem' }}><strong>Date :</strong> {new Date(activePrescription.createdAt).toLocaleDateString('fr-FR')}</p>
                        </div>
                      </div>

                      {/* Prescription Body Logo/Watermark (Optional Rx Symbol) */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.2rem' }}>
                        <span style={{ fontSize: '1.4rem', fontWeight: 'bold', fontFamily: 'serif', color: '#000' }}>Rx :</span>
                        <div style={{ flex: 1, borderBottom: '1px dashed #aaa' }}></div>
                      </div>

                      {/* Medicines Table */}
                      <table className="rx-print-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #000' }}>
                            <th style={{ padding: '0.5rem', fontSize: '0.82rem', fontWeight: 'bold', color: '#000', textTransform: 'uppercase' }}>Médicament / Traitement</th>
                            <th style={{ padding: '0.5rem', fontSize: '0.82rem', fontWeight: 'bold', color: '#000', textTransform: 'uppercase' }}>Posologie / Fréquence</th>
                            <th style={{ padding: '0.5rem', fontSize: '0.82rem', fontWeight: 'bold', color: '#000', textTransform: 'uppercase', textAlign: 'right' }}>Durée</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activePrescription.medicines.map((med, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                              <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.9rem', color: '#000', fontWeight: 'bold' }}>{med.name}</td>
                              <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.9rem', color: '#333' }}>{med.dosage}</td>
                              <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.9rem', color: '#333', textAlign: 'right' }}>{med.duration}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {activePrescription.instructions && (
                        <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '8px', borderLeft: '3px solid #000', fontSize: '0.85rem', color: '#333', textAlign: 'left' }}>
                          <strong>Recommandations cliniques :</strong>
                          <p style={{ margin: '0.35rem 0 0 0', lineHeight: 1.45 }}>{activePrescription.instructions}</p>
                        </div>
                      )}

                      {/* Prescription Signature / Seal Area */}
                      <div style={{ marginTop: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div style={{ fontSize: '0.7rem', color: '#666', maxWidth: '380px', lineHeight: 1.4, textAlign: 'left' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--success)', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.85rem' }}>✓</span> Certifié et signé électroniquement
                          </div>
                          Réf DMP : <code>{activePrescription.uniqueCode}</code>
                          <p style={{ marginTop: '0.2rem' }}>Ce document médical est conforme à la législation sur la signature électronique des actes de soins de santé.</p>
                        </div>
                        <div style={{ textAlign: 'center', border: '1px solid #ddd', padding: '0.5rem', borderRadius: '4px', background: '#fafafa', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', minWidth: '100px' }}>
                          <span style={{ fontSize: '0.5rem', fontWeight: 800, color: '#333' }}>SECURE QR DMP</span>
                          <div style={{ width: '42px', height: '42px', border: '1.5px solid #000', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem', fontWeight: 'bold', color: '#000', background: '#fff' }}>QR</div>
                          <span style={{ fontSize: '0.45rem', color: '#777' }}>MedClinik v1.0</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', alignSelf: 'flex-end', marginTop: '1rem' }} className="no-print">
                      <button
                        onClick={() => {
                          generatePrescriptionPDF(
                            activePrescription,
                            selectedConsult.doctor.name,
                            selectedConsult.specialty,
                            {
                              firstName: selectedConsult.patient.firstName,
                              lastName: selectedConsult.patient.lastName,
                              code: selectedConsult.patient.code,
                              gender: selectedConsult.patient.gender
                            }
                          ).catch(console.error);
                        }}
                        className="btn btn-primary"
                        style={{ fontSize: '0.8rem' }}
                      >
                        📥 Télécharger PDF
                      </button>
                      <button onClick={() => window.print()} className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>
                        🖨️ Imprimer
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Documents Médicaux & Radiographie Section */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4>Documents Médicaux &amp; Imagerie</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  Historique des radiographies (DICOM, JPEG) ou bilans d'analyses (PDF).
                </p>

                {/* Upload Form */}
                <form onSubmit={handleFileUpload} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', backgroundColor: 'rgba(255,255,255,0.01)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div className="form-group" style={{ marginBottom: 0, flex: 2 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Nom de description</label>
                    <input 
                      type="text" 
                      placeholder="ex: Radio Thorax Face" 
                      value={fileCustomName} 
                      onChange={(e) => setFileCustomName(e.target.value)} 
                      className="form-input" 
                      style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0, flex: 2 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Fichier (Max 20Mo)</label>
                    <input 
                      type="file" 
                      name="file" 
                      required 
                      accept=".dcm,.jpg,.jpeg,.png,.pdf" 
                      className="form-input" 
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }} 
                    />
                  </div>
                  <button type="submit" disabled={uploading} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                    {uploading ? 'Téléversement...' : 'Téléverser'}
                  </button>
                </form>

                {/* Files List */}
                {patientFiles.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>
                    Aucun document téléversé pour ce patient.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                    {patientFiles.map((file) => (
                      <div key={file.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 1rem', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                        <div>
                          <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>{file.name}</span> <br />
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Type: <strong>{file.type}</strong> | Taille: {Math.round(file.size / 1024)} Ko | Ajouté le: {new Date(file.uploadedAt).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {file.type === 'JPEG' && (
                            <button 
                              type="button" 
                              onClick={() => setSelectedFile(file)}
                              className="btn btn-secondary" 
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            >
                              Visualiser
                            </button>
                          )}
                          <a 
                            href={`${API_URL}${file.url}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="btn btn-primary" 
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          >
                            Télécharger
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Consultation details form */}
              <form onSubmit={handleCompleteConsultation} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label">Diagnostic Médical Clinique *</label>
                  <input
                    type="text"
                    required
                    placeholder="Saisir le diagnostic..."
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Observations cliniques &amp; Antécédents *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Compte rendu clinique de la consultation..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="form-textarea"
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setSelectedConsult(null)} className="btn btn-secondary">
                    Fermer sans enregistrer
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Clôturer et Archiver au Dossier Patient
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div style={styles.noSelection}>
              <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
                Sélectionnez un patient dans la file d'attente à gauche pour ouvrir son dossier médical partagé.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* File Preview Modal */}
      {selectedFile && (
        <div style={styles.modalOverlay}>
          <div className="glass-card animate-slide-up" style={{ ...styles.modal, maxWidth: '650px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h4>Aperçu : {selectedFile.name}</h4>
              <button type="button" onClick={() => setSelectedFile(null)} style={styles.removeBtn}>Fermer</button>
            </div>
            <div style={{ textAlign: 'center' }}>
              <img 
                src={`${API_URL}${selectedFile.url}`} 
                alt={selectedFile.name} 
                style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px', border: '1px solid var(--border-color)' }} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  spinnerWrapper: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
  },
  errorAlert: {
    backgroundColor: 'var(--danger-glow)',
    border: '1px solid var(--danger)',
    color: '#fff',
    padding: '1rem',
    borderRadius: '8px',
  },
  fraudAlert: {
    border: '1px solid var(--danger)',
    backgroundColor: 'var(--danger-glow)',
    padding: '1.5rem',
    borderRadius: '12px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    maxHeight: '450px',
    overflowY: 'auto',
  },
  emptyText: {
    textAlign: 'center',
    color: 'var(--text-muted)',
    padding: '2rem',
    fontSize: '0.85rem',
  },
  queueCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    padding: '0.85rem 1rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  queueCardActive: {
    background: 'var(--primary-glow)',
    border: '1px solid var(--primary-color)',
  },
  selectedHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '1rem',
  },
  templateSwitcher: {
    display: 'flex',
    gap: '0.5rem',
  },
  smallBtn: {
    fontSize: '0.75rem',
    padding: '0.35rem 0.75rem',
  },
  vitalsSummary: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border-color)',
    padding: '1.25rem',
    borderRadius: '10px',
  },
  vitalsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '0.75rem',
    fontSize: '0.9rem',
    marginTop: '0.75rem',
  },
  warningBanner: {
    backgroundColor: 'var(--warning-glow)',
    border: '1px solid var(--warning)',
    color: '#fff',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    fontSize: '0.9rem',
  },
  prescriptionBuilder: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  rxTable: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '0.85rem',
    margin: '0.5rem 0',
  },
  activeRxSheet: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px dashed var(--success)',
    padding: '1.25rem',
    borderRadius: '8px',
  },
  rxContentPrint: {
    backgroundColor: '#fff',
    color: '#000',
    padding: '1.5rem',
    borderRadius: '6px',
    fontFamily: 'monospace',
    fontSize: '0.85rem',
  },
  divider: {
    borderTop: '1px dashed #000',
    margin: '0.5rem 0',
  },
  noSelection: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '350px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 8, 16, 0.85)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
  },
  modal: {
    maxWidth: '500px',
    width: '90%',
    padding: '2rem',
    borderRadius: '16px',
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--danger)',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
};
