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

interface QueueEntry {
  id: string;
  patientId: string;
  patient: Patient;
  status: string;
  priority: string;
  department: string;
}

interface VitalRecord {
  id: string;
  temperature?: number;
  bloodPressure?: string;
  weight?: number;
  heartRate?: number;
  bloodSugar?: number;
  oxygenSaturation?: number;
  comments?: string;
  createdAt: string;
  nurse: { name: string };
}

export default function ConstantesPage() {
  const { user, apiFetch, token } = useAuth();
  const [vitalsQueue, setVitalsQueue] = useState<QueueEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<QueueEntry | null>(null);
  const [history, setHistory] = useState<VitalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    temperature: '',
    bloodPressure: '',
    weight: '',
    heartRate: '',
    bloodSugar: '',
    oxygenSaturation: '',
    comments: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchVitalsQueue = useCallback(async () => {
    try {
      const res = await apiFetch('/queue');
      const filtered = res.filter((entry: any) => entry.department === 'VITALS');
      setVitalsQueue(filtered);
    } catch (e: any) {
      console.error(e);
      setError('Erreur lors de la récupération de la file d\'attente infirmerie.');
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    if (token) {
      fetchVitalsQueue();
    }
  }, [token, fetchVitalsQueue]);

  // Load history when selected patient changes
  useEffect(() => {
    if (selectedEntry) {
      apiFetch(`/vitals/patient/${selectedEntry.patientId}`)
        .then((res) => setHistory(res))
        .catch((e) => console.error('Error fetching patient history:', e));
    } else {
      setHistory([]);
    }
  }, [selectedEntry, apiFetch]);

  const handlePatientSelect = (entry: QueueEntry) => {
    setSelectedEntry(entry);
    setFormData({
      temperature: '',
      bloodPressure: '',
      weight: '',
      heartRate: '',
      bloodSugar: '',
      oxygenSaturation: '',
      comments: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntry) return;

    try {
      setIsSubmitting(true);
      setError(null);

      await apiFetch('/vitals', {
        method: 'POST',
        body: JSON.stringify({
          patientId: selectedEntry.patientId,
          ...formData,
        }),
      });

      setSelectedEntry(null);
      fetchVitalsQueue();
    } catch (e: any) {
      setError(e.message || 'Erreur lors de l\'enregistrement des constantes');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.spinnerWrapper}>
        <div className="spinner"></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Chargement de l'infirmerie...</p>
      </div>
    );
  }

  // Permission check
  const hasAccess = user?.role === 'NURSE' || user?.role === 'ADMIN';
  if (!hasAccess) {
    return (
      <div className="glass-card" style={{ maxWidth: '500px', margin: '3rem auto', textAlign: 'center', padding: '2rem' }}>
        <h3 style={{ color: 'var(--danger)' }}>Accès restreint</h3>
        <p style={{ margin: '1rem 0', color: 'var(--text-muted)' }}>
          Ce module est réservé aux personnels infirmiers et administrateurs cliniques pour la saisie des constantes vitales.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1>Saisie des Constantes Vitales</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          Sélectionnez un patient en attente dans la file pour enregistrer ses données vitales avant sa consultation médicale.
        </p>
      </div>

      {error && (
        <div style={styles.errorAlert}>
          <strong>Alerte :</strong> {error}
        </div>
      )}

      <div className="grid-3">
        {/* Waiting Patients List */}
        <div className="glass-card" style={{ gridColumn: 'span 1', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3>File d'attente — Tri</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Patients en attente de prise de constantes vitales.</p>

          <div style={styles.list}>
            {vitalsQueue.length === 0 ? (
              <p style={styles.emptyText}>Aucun patient en attente.</p>
            ) : (
              vitalsQueue.map((entry) => {
                const isSelected = selectedEntry?.id === entry.id;
                return (
                  <div
                    key={entry.id}
                    onClick={() => handlePatientSelect(entry)}
                    style={{
                      ...styles.queueCard,
                      ...(isSelected ? styles.queueCardActive : {}),
                    }}
                  >
                    <div>
                      <strong>{entry.patient.firstName} {entry.patient.lastName}</strong>
                      <div style={{ fontSize: '0.75rem', color: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Code: {entry.patient.code} | Priorité: <strong style={{ color: entry.priority === 'NORMAL' ? 'var(--text-main)' : 'var(--warning)' }}>{entry.priority}</strong>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Input Form */}
        <div className="glass-card" style={{ gridColumn: 'span 2' }}>
          {selectedEntry ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={styles.selectedHeader}>
                <h3>Saisie Constantes : {selectedEntry.patient.firstName} {selectedEntry.patient.lastName}</h3>
                <span className="badge badge-paid">Code: {selectedEntry.patient.code}</span>
              </div>

              <form onSubmit={handleSubmit} style={styles.formGrid}>
                {/* Temperature */}
                <div className="form-group">
                  <label className="form-label">Température (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="34"
                    max="43"
                    placeholder="ex: 37.5"
                    value={formData.temperature}
                    onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                    className="form-input"
                  />
                  <span className="form-error">La température doit être comprise entre 34°C et 43°C.</span>
                </div>

                {/* Blood Pressure */}
                <div className="form-group">
                  <label className="form-label">Tension Artérielle</label>
                  <input
                    type="text"
                    pattern="\d{2,3}\/\d{2,3}"
                    placeholder="ex: 120/80"
                    value={formData.bloodPressure}
                    onChange={(e) => setFormData({ ...formData, bloodPressure: e.target.value })}
                    className="form-input"
                  />
                  <span className="form-error">Format requis: Systole/Diastole (ex: 120/80)</span>
                </div>

                {/* Weight */}
                <div className="form-group">
                  <label className="form-label">Poids (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="300"
                    placeholder="ex: 75.2"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="form-input"
                  />
                  <span className="form-error">Veuillez saisir un poids valide.</span>
                </div>

                {/* Heart Rate */}
                <div className="form-group">
                  <label className="form-label">Fréquence Cardiaque (bpm)</label>
                  <input
                    type="number"
                    min="30"
                    max="220"
                    placeholder="ex: 72"
                    value={formData.heartRate}
                    onChange={(e) => setFormData({ ...formData, heartRate: e.target.value })}
                    className="form-input"
                  />
                  <span className="form-error">Fréquence cardiaque comprise entre 30 et 220 bpm.</span>
                </div>

                {/* Blood Sugar */}
                <div className="form-group">
                  <label className="form-label">Glycémie (g/L)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    max="5.0"
                    placeholder="ex: 0.95"
                    value={formData.bloodSugar}
                    onChange={(e) => setFormData({ ...formData, bloodSugar: e.target.value })}
                    className="form-input"
                  />
                  <span className="form-error">Saisir une valeur de glycémie valide.</span>
                </div>

                {/* Oxygen Saturation */}
                <div className="form-group">
                  <label className="form-label">Saturation en Oxygène (SpO2 %)</label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    placeholder="ex: 98"
                    value={formData.oxygenSaturation}
                    onChange={(e) => setFormData({ ...formData, oxygenSaturation: e.target.value })}
                    className="form-input"
                  />
                  <span className="form-error">SpO2 doit être compris entre 50% et 100%.</span>
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Observations / Symptômes</label>
                  <textarea
                    rows={3}
                    placeholder="Symptômes décrits par le patient, antécédents immédiats..."
                    value={formData.comments}
                    onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                    className="form-textarea"
                  />
                </div>

                <div style={styles.formActions}>
                  <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                    {isSubmitting ? 'Enregistrement...' : 'Valider et envoyer en Consultation'}
                  </button>
                </div>
              </form>

              {/* Patient History Timeline */}
              <div style={styles.historyBlock}>
                <h4>Historique des Constantes</h4>
                {history.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Aucun enregistrement antérieur pour ce patient.</p>
                ) : (
                  <div style={styles.timeline}>
                    {history.map((record) => (
                      <div key={record.id} style={styles.timelineCard} className="glass-card">
                        <div style={styles.timelineHeader}>
                          <span>{new Date(record.createdAt).toLocaleDateString('fr-FR')} à {new Date(record.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Par: {record.nurse.name}</span>
                        </div>
                        <div style={styles.timelineGrid}>
                          {record.temperature && <div>Temp: <strong>{record.temperature}°C</strong></div>}
                          {record.bloodPressure && <div>Tension: <strong>{record.bloodPressure}</strong></div>}
                          {record.weight && <div>Poids: <strong>{record.weight}kg</strong></div>}
                          {record.heartRate && <div>Pouls: <strong>{record.heartRate} bpm</strong></div>}
                          {record.bloodSugar && <div>Glycémie: <strong>{record.bloodSugar} g/L</strong></div>}
                          {record.oxygenSaturation && <div>SpO2: <strong>{record.oxygenSaturation}%</strong></div>}
                        </div>
                        {record.comments && (
                          <p style={styles.timelineComment}>
                            <strong>Note :</strong> {record.comments}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={styles.noSelection}>
              <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
                Sélectionnez un patient dans la file d'attente à gauche pour saisir ses constantes.
              </p>
            </div>
          )}
        </div>
      </div>
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
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1.25rem',
  },
  formActions: {
    gridColumn: 'span 2',
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '0.5rem',
  },
  noSelection: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '350px',
  },
  historyBlock: {
    marginTop: '1rem',
    borderTop: '1px solid var(--border-color)',
    paddingTop: '1.5rem',
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginTop: '1rem',
  },
  timelineCard: {
    padding: '1rem 1.25rem',
    borderRadius: '8px',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  timelineHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    paddingBottom: '0.4rem',
    marginBottom: '0.5rem',
  },
  timelineGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '0.75rem',
    fontSize: '0.85rem',
  },
  timelineComment: {
    fontSize: '0.85rem',
    marginTop: '0.6rem',
    color: 'var(--text-muted)',
    borderLeft: '2px solid var(--primary-color)',
    paddingLeft: '0.5rem',
  },
};
