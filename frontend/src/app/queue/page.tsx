'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../components/AuthContext';
import { io } from 'socket.io-client';
import Link from 'next/link';

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
  status: 'IN_QUEUE' | 'CALLING' | 'IN_CONSULTATION' | 'FINISHED';
  priority: 'NORMAL' | 'URGENT' | 'EMERGENCY';
  department: 'VITALS' | 'CONSULTATION';
  assignedDoctor?: { id: string; name: string };
  createdAt: string;
}

export default function QueuePage() {
  const { user, apiFetch, token } = useAuth();
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Registration Form State
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [department, setDepartment] = useState<'VITALS' | 'CONSULTATION'>('VITALS');
  const [priority, setPriority] = useState<'NORMAL' | 'URGENT' | 'EMERGENCY'>('NORMAL');

  // New Patient Modal state
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [newPatient, setNewPatient] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'M',
    phoneNumber: '',
    address: '',
    mutuelleName: '',
    insuranceCoverageShare: '0',
  });

  const fetchQueue = useCallback(async () => {
    try {
      const res = await apiFetch('/queue');
      setQueue(res);
    } catch (e) {
      console.error('Error fetching queue:', e);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  // WebSocket Live Sync
  useEffect(() => {
    if (!token) return;
    
    fetchQueue();

    const socket = io('http://localhost:3006');
    socket.on('connect', () => {
      console.log('Connected to Queue WebSockets Gateway');
    });

    socket.on('queue_updated', () => {
      console.log('Queue updated broadcast received, reloading...');
      fetchQueue();
    });

    return () => {
      socket.disconnect();
    };
  }, [token, fetchQueue]);

  // Search patients
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const results = await apiFetch(`/patients/search?q=${query}`);
      setSearchResults(results);
    } catch (e) {
      console.error(e);
    }
  };

  // Register in queue
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    try {
      setError(null);
      await apiFetch('/queue/register', {
        method: 'POST',
        body: JSON.stringify({
          patientId: selectedPatient.id,
          department,
          priority,
        }),
      });
      setSelectedPatient(null);
      setSearchQuery('');
      setSearchResults([]);
      setShowRegisterForm(false);
    } catch (e: any) {
      setError(e.message || 'Impossible d\'ajouter à la file d\'attente');
    }
  };

  // Create new patient
  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      const created = await apiFetch('/patients', {
        method: 'POST',
        body: JSON.stringify({
          ...newPatient,
          insuranceCoverageShare: parseFloat(newPatient.insuranceCoverageShare || '0'),
        }),
      });
      setSelectedPatient(created);
      setShowNewPatientForm(false);
      setNewPatient({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: 'M',
        phoneNumber: '',
        address: '',
        mutuelleName: '',
        insuranceCoverageShare: '0',
      });
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la création du dossier patient');
    }
  };

  // Queue actions
  const handleCall = async (id: string) => {
    try {
      setError(null);
      await apiFetch(`/queue/call/${id}`, { method: 'POST' });
    } catch (e: any) {
      setError(e.message || 'Action échouée');
    }
  };

  const handleStart = async (id: string) => {
    try {
      setError(null);
      await apiFetch(`/queue/start/${id}`, { method: 'POST' });
    } catch (e: any) {
      setError(e.message || 'Action échouée');
    }
  };

  const handleFinish = async (id: string) => {
    try {
      setError(null);
      await apiFetch(`/queue/finish/${id}`, { method: 'POST' });
    } catch (e: any) {
      setError(e.message || 'Action échouée');
    }
  };

  // Split queue by department
  const vitalsQueue = queue.filter((entry) => entry.department === 'VITALS');
  const consultationQueue = queue.filter((entry) => entry.department === 'CONSULTATION');

  const getPriorityStyle = (priority: string) => {
    if (priority === 'EMERGENCY') return { color: 'var(--danger)', fontWeight: 'bold' };
    if (priority === 'URGENT') return { color: 'var(--warning)', fontWeight: 'bold' };
    return { color: 'var(--text-muted)' };
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={styles.headerRow}>
        <div>
          <h1>File d'attente en temps réel</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Synchronisation en temps réel via WebSockets pour l'accueil, les constantes et les consultations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link
            href="/queue/display"
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            Ouvrir l'Écran TV
          </Link>
          {(user?.role === 'ADMIN' || user?.role === 'NURSE' || user?.role === 'CASHIER') && (
            <button
              onClick={() => {
                setShowRegisterForm(!showRegisterForm);
                setError(null);
              }}
              className="btn btn-primary"
            >
              {showRegisterForm ? 'Fermer l\'enregistrement' : '+ Enregistrer un Patient'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={styles.errorAlert}>
          <strong>Alerte système :</strong> {error}
        </div>
      )}

      {/* Registration Section */}
      {showRegisterForm && (
        <div className="glass-card animate-slide-up" style={{ padding: '2rem' }}>
          <h3>Enregistrement en File d'attente</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Recherchez un dossier patient existant ou créez-en un nouveau pour le diriger vers les soins.
          </p>

          {!selectedPatient ? (
            <div style={styles.searchBlock}>
              <div className="form-group">
                <label className="form-label">Nom ou Code Patient</label>
                <input
                  type="text"
                  placeholder="Rechercher (ex: Traoré ou PAT-0001)..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="form-input"
                />
              </div>

              {searchResults.length > 0 && (
                <div style={styles.searchResults}>
                  {searchResults.map((pat) => (
                    <div
                      key={pat.id}
                      onClick={() => setSelectedPatient(pat)}
                      style={styles.searchResultItem}
                    >
                      <span><strong>{pat.firstName} {pat.lastName}</strong> ({pat.code})</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{pat.phoneNumber}</span>
                    </div>
                  ))}
                </div>
              )}

              {searchQuery.trim().length >= 2 && searchResults.length === 0 && (
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Aucun patient trouvé avec ce nom.</p>
                  <button
                    onClick={() => setShowNewPatientForm(true)}
                    className="btn btn-secondary"
                  >
                    Créer un nouveau Dossier Patient
                  </button>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={styles.selectedPatientBadge}>
                <span>Patient sélectionné : <strong>{selectedPatient.firstName} {selectedPatient.lastName} ({selectedPatient.code})</strong></span>
                <button
                  type="button"
                  onClick={() => setSelectedPatient(null)}
                  style={styles.removeBtn}
                >
                  Retirer
                </button>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Service de destination</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value as any)}
                    className="form-select"
                  >
                    <option value="VITALS">Constantes / Infirmerie</option>
                    <option value="CONSULTATION">Consultation Médicale</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Niveau de Priorité</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="form-select"
                  >
                    <option value="NORMAL">NORMAL</option>
                    <option value="URGENT">URGENT</option>
                    <option value="EMERGENCY">URGENCE VITALE</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setSelectedPatient(null)}
                  className="btn btn-secondary"
                >
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  Valider l'enregistrement
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* New Patient Form Modal Overlay */}
      {showNewPatientForm && (
        <div style={styles.modalOverlay}>
          <div className="glass-card animate-slide-up" style={styles.modal}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--primary-color)' }}>Nouveau Dossier Médical Partagé (DMP)</h3>
            
            <form onSubmit={handleCreatePatient}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={newPatient.firstName}
                    onChange={(e) => setNewPatient({ ...newPatient, firstName: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nom de famille *</label>
                  <input
                    type="text"
                    required
                    value={newPatient.lastName}
                    onChange={(e) => setNewPatient({ ...newPatient, lastName: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="grid-3">
                <div className="form-group">
                  <label className="form-label">Date de Naissance *</label>
                  <input
                    type="date"
                    required
                    value={newPatient.dateOfBirth}
                    onChange={(e) => setNewPatient({ ...newPatient, dateOfBirth: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Genre *</label>
                  <select
                    value={newPatient.gender}
                    onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                    className="form-select"
                  >
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Téléphone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+221770000000"
                    value={newPatient.phoneNumber}
                    onChange={(e) => setNewPatient({ ...newPatient, phoneNumber: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Adresse de résidence</label>
                <input
                  type="text"
                  value={newPatient.address}
                  onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Nom Assurance / Mutuelle</label>
                  <input
                    type="text"
                    placeholder="ex: Gras Savoye, IPM..."
                    value={newPatient.mutuelleName}
                    onChange={(e) => setNewPatient({ ...newPatient, mutuelleName: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Taux de couverture (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={newPatient.insuranceCoverageShare}
                    onChange={(e) => setNewPatient({ ...newPatient, insuranceCoverageShare: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setShowNewPatientForm(false)}
                  className="btn btn-secondary"
                >
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  Créer le Dossier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Queue View Grid */}
      <div className="grid-2">
        {/* Department 1: Vitals */}
        <div className="glass-card" style={styles.departmentBlock}>
          <div style={styles.deptHeader}>
            <h3>1. Constantes &amp; Tri — Infirmerie</h3>
            <span className="badge badge-paid">{vitalsQueue.length} Patients</span>
          </div>

          <div style={styles.list}>
            {vitalsQueue.length === 0 ? (
              <p style={styles.emptyText}>Aucun patient en attente de constantes.</p>
            ) : (
              vitalsQueue.map((entry) => (
                <div key={entry.id} style={styles.queueItem} className="glass-card">
                  <div style={styles.itemMain}>
                    <div style={styles.itemTitle}>
                      <strong>{entry.patient.firstName} {entry.patient.lastName}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}> ({entry.patient.code})</span>
                    </div>
                    <div style={styles.itemMeta}>
                      <span style={getPriorityStyle(entry.priority)}>Priorité: {entry.priority}</span>
                      <span>Enregistré à: {new Date(entry.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  {/* Actions for Nurse / Admin */}
                  <div style={styles.itemActions}>
                    {entry.status === 'IN_QUEUE' ? (
                      <button
                        onClick={() => handleCall(entry.id)}
                        disabled={user?.role !== 'NURSE' && user?.role !== 'ADMIN'}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                      >
                        Appeler
                      </button>
                    ) : entry.status === 'CALLING' ? (
                      <button
                        onClick={() => handleStart(entry.id)}
                        disabled={user?.role !== 'NURSE' && user?.role !== 'ADMIN'}
                        className="btn btn-success"
                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                      >
                        Commencer
                      </button>
                    ) : (
                      <Link
                        href="/constantes"
                        className="btn btn-primary"
                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                      >
                        Saisir Constantes
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Department 2: Consultation */}
        <div className="glass-card" style={styles.departmentBlock}>
          <div style={styles.deptHeader}>
            <h3>2. Salle d'Attente Consultations</h3>
            <span className="badge badge-paid" style={{ background: 'var(--primary-glow)', color: 'var(--primary-color)', border: '1px solid var(--primary-color)' }}>
              {consultationQueue.length} Patients
            </span>
          </div>

          <div style={styles.list}>
            {consultationQueue.length === 0 ? (
              <p style={styles.emptyText}>Aucun patient en attente de consultation.</p>
            ) : (
              consultationQueue.map((entry) => (
                <div key={entry.id} style={styles.queueItem} className="glass-card">
                  <div style={styles.itemMain}>
                    <div style={styles.itemTitle}>
                      <strong>{entry.patient.firstName} {entry.patient.lastName}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}> ({entry.patient.code})</span>
                    </div>
                    <div style={styles.itemMeta}>
                      <span style={getPriorityStyle(entry.priority)}>Priorité: {entry.priority}</span>
                      <span>Tri effectué</span>
                    </div>
                  </div>

                  {/* Actions for Doctor / Admin */}
                  <div style={styles.itemActions}>
                    {entry.status === 'IN_QUEUE' ? (
                      <button
                        onClick={() => handleCall(entry.id)}
                        disabled={user?.role !== 'DOCTOR' && user?.role !== 'ADMIN'}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                      >
                        Appeler
                      </button>
                    ) : entry.status === 'CALLING' ? (
                      <button
                        onClick={() => handleStart(entry.id)}
                        disabled={user?.role !== 'DOCTOR' && user?.role !== 'ADMIN'}
                        className="btn btn-success"
                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                      >
                        Commencer
                      </button>
                    ) : (
                      <Link
                        href="/consultation"
                        className="btn btn-primary"
                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                      >
                        Ouvrir Consultation
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
  },
  errorAlert: {
    backgroundColor: 'var(--danger-glow)',
    border: '1px solid var(--danger)',
    color: '#fff',
    padding: '1rem',
    borderRadius: '8px',
  },
  searchBlock: {
    position: 'relative',
  },
  searchResults: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'hsl(222, 40%, 15%)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    boxShadow: 'var(--shadow-lg)',
    zIndex: 50,
    maxHeight: '200px',
    overflowY: 'auto',
  },
  searchResultItem: {
    padding: '0.75rem 1rem',
    borderBottom: '1px solid var(--border-color)',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    transition: 'background-color 0.2s',
  },
  selectedPatientBadge: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'var(--primary-glow)',
    border: '1px solid var(--primary-color)',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--danger)',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  departmentBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    minHeight: '400px',
  },
  deptHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '0.75rem',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  emptyText: {
    textAlign: 'center',
    color: 'var(--text-muted)',
    padding: '3rem',
    fontSize: '0.9rem',
  },
  queueItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    borderRadius: '10px',
  },
  itemMain: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
  },
  itemTitle: {
    fontSize: '1rem',
  },
  itemMeta: {
    display: 'flex',
    gap: '1rem',
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
  },
  itemActions: {
    display: 'flex',
    gap: '0.5rem',
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
    maxWidth: '650px',
    width: '90%',
    padding: '2.5rem',
    borderRadius: '16px',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem',
    marginTop: '1.5rem',
  },
};
