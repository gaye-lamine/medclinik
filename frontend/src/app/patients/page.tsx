'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../components/AuthContext';
import { useToast } from '../../components/ToastContext';

interface Patient {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phoneNumber: string;
  address?: string;
  mutuelleName?: string;
  insuranceCoverageShare: number;
  createdAt: string;
}

export default function PatientsPage() {
  const { apiFetch, token } = useAuth();
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Patient Creation Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const fetchPatients = useCallback(async (query: string = '') => {
    try {
      setError(null);
      let path = '/patients';
      if (query.trim().length >= 2) {
        path = `/patients/search?q=${encodeURIComponent(query)}`;
      }
      const data = await apiFetch(path);
      setPatients(data);
    } catch (e: any) {
      console.error(e);
      setError('Impossible de charger le registre des patients.');
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    if (token) {
      fetchPatients(searchQuery);
    }
  }, [token, searchQuery, fetchPatients]);

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);

      await apiFetch('/patients', {
        method: 'POST',
        body: JSON.stringify({
          ...newPatient,
          insuranceCoverageShare: parseFloat(newPatient.insuranceCoverageShare || '0'),
        }),
      });

      setShowAddModal(false);
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
      fetchPatients(searchQuery);
      toast.success('Dossier médical patient créé avec succès.');
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la création du dossier patient.');
      toast.error(e.message || 'Erreur lors de la création du dossier patient.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && patients.length === 0) {
    return (
      <div style={styles.spinnerWrapper}>
        <div className="spinner"></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Chargement du registre patient...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={styles.headerRow}>
        <div>
          <h1>Annuaire des Dossiers Patients (DMP)</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Consultez les informations administratives et d'assurances des patients enregistrés dans la clinique.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
        >
          + Créer une Fiche Patient
        </button>
      </div>

      {error && (
        <div style={styles.errorAlert}>
          <strong>Erreur système :</strong> {error}
        </div>
      )}

      {/* Directory Content */}
      <div className="glass-card">
        <div style={styles.filterRow}>
          <input
            type="text"
            placeholder="Rechercher par nom, prénom ou code patient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ maxWidth: '400px' }}
          />
        </div>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Code</th>
                <th style={styles.th}>Patient</th>
                <th style={styles.th}>Âge / Genre</th>
                <th style={styles.th}>Téléphone</th>
                <th style={styles.th}>Assurance / Mutuelle</th>
                <th style={styles.th}>Créé Le</th>
              </tr>
            </thead>
            <tbody>
              {patients.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Aucun dossier patient correspondant trouvé.
                  </td>
                </tr>
              ) : (
                patients.map((pat) => {
                  const birthDate = new Date(pat.dateOfBirth);
                  const age = new Date().getFullYear() - birthDate.getFullYear();
                  return (
                    <tr key={pat.id} style={styles.trRow}>
                      <td style={styles.td}>
                        <span className="badge" style={{ background: 'var(--primary-glow)', color: 'var(--primary-color)', borderColor: 'var(--primary-color)' }}>
                          {pat.code}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <strong>{pat.lastName.toUpperCase()} {pat.firstName}</strong>
                      </td>
                      <td style={styles.td}>
                        {age} ans ({pat.gender})
                      </td>
                      <td style={styles.td}>{pat.phoneNumber}</td>
                      <td style={styles.td}>
                        {pat.mutuelleName ? (
                          <span>
                            {pat.mutuelleName} ({pat.insuranceCoverageShare}%)
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Aucune (100% Patient)</span>
                        )}
                      </td>
                      <td style={styles.td}>{new Date(pat.createdAt).toLocaleDateString('fr-FR')}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Creation Modal */}
      {showAddModal && (
        <div style={styles.modalOverlay}>
          <div className="glass-card animate-slide-up" style={styles.modal}>
            <h3 style={{ marginBottom: '1.25rem', color: 'var(--primary-color)' }}>Nouveau Dossier Médical Partagé (DMP)</h3>

            <form onSubmit={handleCreatePatient}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={newPatient.firstName}
                    onChange={(e) => setNewPatient({ ...newPatient, firstName: e.target.value })}
                    placeholder="ex: Moussa"
                    className="form-input"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nom de famille *</label>
                  <input
                    type="text"
                    required
                    value={newPatient.lastName}
                    onChange={(e) => setNewPatient({ ...newPatient, lastName: e.target.value })}
                    placeholder="ex: Traoré"
                    className="form-input"
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Genre *</label>
                  <select
                    value={newPatient.gender}
                    onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                    className="form-select"
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Adresse de résidence</label>
                <input
                  type="text"
                  placeholder="ex: Dakar, Plateau"
                  value={newPatient.address}
                  onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
                  className="form-input"
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Nom Assurance / Mutuelle</label>
                  <input
                    type="text"
                    placeholder="ex: IPM Senelec, Gras Savoye..."
                    value={newPatient.mutuelleName}
                    onChange={(e) => setNewPatient({ ...newPatient, mutuelleName: e.target.value })}
                    className="form-input"
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                  disabled={isSubmitting}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Création...' : 'Créer le Dossier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
  filterRow: {
    marginBottom: '1.5rem',
  },
  tableWrapper: {
    width: '100%',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  thRow: {
    borderBottom: '2px solid var(--border-color)',
  },
  th: {
    padding: '0.85rem 1rem',
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  trRow: {
    borderBottom: '1px solid var(--border-color)',
  },
  td: {
    padding: '1rem',
    fontSize: '0.95rem',
    verticalAlign: 'middle',
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
