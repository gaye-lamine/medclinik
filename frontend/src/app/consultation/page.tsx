'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../components/AuthContext';

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
      alert('Veuillez sélectionner un fichier.');
      return;
    }
    
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', fileCustomName || file.name);
    formData.append('consultationId', selectedConsult.id);

    try {
      setUploading(true);
      const response = await fetch(`http://localhost:3006/files/patient/${selectedConsult.patientId}`, {
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
      alert('Fichier médical téléversé avec succès dans le DMP.');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Impossible de téléverser le fichier.');
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
      alert('Ordonnance numérique signée avec succès.');
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la signature de l\'ordonnance');
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
      alert('Consultation médicale terminée et archivée dans le DMP.');
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la validation clinique');
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
                  <div style={styles.activeRxSheet}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>Ordonnance Signée Numériquement</span>
                      <span style={{ fontFamily: 'monospace', color: 'var(--primary-color)' }}>ID: {activePrescription.uniqueCode}</span>
                    </div>

                    <div style={styles.rxContentPrint}>
                      <p><strong>Clinique MedClinik</strong> | Service Médical</p>
                      <p>Prescrit par : {selectedConsult.doctor.name}</p>
                      <div style={styles.divider}></div>
                      <ul>
                        {activePrescription.medicines.map((med, idx) => (
                          <li key={idx} style={{ margin: '0.4rem 0' }}>
                            — <strong>{med.name}</strong> : {med.dosage} ({med.duration})
                          </li>
                        ))}
                      </ul>
                      {activePrescription.instructions && (
                        <p style={{ marginTop: '0.8rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          * Recommandations : {activePrescription.instructions}
                        </p>
                      )}
                    </div>

                    <button onClick={() => window.print()} className="btn btn-secondary" style={{ alignSelf: 'flex-end', fontSize: '0.8rem' }}>
                      Imprimer / Partager
                    </button>
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
                            href={`http://localhost:3006${file.url}`} 
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
                src={`http://localhost:3006${selectedFile.url}`} 
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
    borderColor: 'var(--primary-color)',
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
