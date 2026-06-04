'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth, ROLE_LABELS } from '../../components/AuthContext';
import { useToast } from '../../components/ToastContext';

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'DOCTOR' | 'NURSE' | 'CASHIER';
  phone?: string;
  createdAt: string;
  isActive: boolean;
}

export default function PersonnelPage() {
  const { user, apiFetch, token } = useAuth();
  const { toast } = useToast();
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Creation modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'DOCTOR',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStaff = useCallback(async () => {
    try {
      setError(null);
      const res = await apiFetch('/auth/users');
      setStaff(res);
    } catch (e: any) {
      console.error(e);
      setError('Impossible de charger la liste du personnel.');
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    if (token && user?.role === 'ADMIN') {
      fetchStaff();
    } else {
      setLoading(false);
    }
  }, [token, user, fetchStaff]);

  const handleDelete = async (id: string, name: string) => {
    if (id === user?.id) {
      toast.error('Erreur : Vous ne pouvez pas supprimer votre propre compte.');
      return;
    }
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le compte de ${name} ?`)) {
      return;
    }

    try {
      setError(null);
      await apiFetch(`/auth/users/${id}`, { method: 'DELETE' });
      fetchStaff();
      toast.success('Collaborateur supprimé avec succès.');
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la suppression du collaborateur.');
      toast.error(e.message || 'Erreur lors de la suppression du collaborateur.');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);

      await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      setShowAddModal(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'DOCTOR',
        phone: '',
      });
      fetchStaff();
      toast.success('Collaborateur enregistré avec succès.');
    } catch (e: any) {
      setError(e.message || 'Erreur lors de l\'enregistrement.');
      toast.error(e.message || 'Erreur lors de l\'enregistrement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div style={styles.errorAlert}>
        <h3>Accès Refusé</h3>
        <p>Cette page est strictement réservée à la direction et aux administrateurs du système MedClinik.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={styles.spinnerWrapper}>
        <div className="spinner"></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Chargement de l'équipe médicale...</p>
      </div>
    );
  }

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'ADMIN': return { color: 'var(--danger)', borderColor: 'var(--danger)', background: 'var(--danger-glow)' };
      case 'DOCTOR': return { color: 'var(--primary-color)', borderColor: 'var(--primary-color)', background: 'var(--primary-glow)' };
      case 'NURSE': return { color: 'var(--success)', borderColor: 'var(--success)', background: 'var(--success-glow)' };
      case 'CASHIER': return { color: 'var(--warning)', borderColor: 'var(--warning)', background: 'rgba(234, 179, 8, 0.08)' };
      default: return {};
    }
  };

  const getRoleLabel = (role: string) => {
    return ROLE_LABELS[role] || role;
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={styles.headerRow}>
        <div>
          <h1>Gestion du Personnel Hospitalier</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Enregistrement et contrôle des accès des praticiens, infirmiers et agents financiers de la clinique.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
        >
          + Enregistrer un Collaborateur
        </button>
      </div>

      {error && (
        <div style={styles.errorAlert}>
          <strong>Erreur système :</strong> {error}
        </div>
      )}

      {/* Staff Table */}
      <div className="glass-card">
        <h3>Membres de l'Équipe</h3>
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Nom Complet</th>
                <th style={styles.th}>Adresse E-mail</th>
                <th style={styles.th}>Rôle</th>
                <th style={styles.th}>Téléphone</th>
                <th style={styles.th}>Créé Le</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((member) => (
                <tr key={member.id} style={styles.trRow}>
                  <td style={styles.td}>
                    <strong>{member.name}</strong>
                    {member.id === user?.id && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', opacity: 0.6 }}>(Vous)</span>}
                  </td>
                  <td style={styles.td}>{member.email}</td>
                  <td style={styles.td}>
                    <span className="badge" style={getRoleBadgeStyle(member.role)}>
                      {getRoleLabel(member.role)}
                    </span>
                  </td>
                  <td style={styles.td}>{member.phone || 'N/A'}</td>
                  <td style={styles.td}>{new Date(member.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td style={styles.td}>
                    {member.id !== user?.id ? (
                      <button
                        onClick={() => handleDelete(member.id, member.name)}
                        className="btn btn-secondary"
                        style={{ color: 'var(--danger)', borderColor: 'var(--danger)', fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                      >
                        Retirer
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Actif</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Creation Modal */}
      {showAddModal && (
        <div style={styles.modalOverlay}>
          <div className="glass-card animate-slide-up" style={styles.modal}>
            <h3 style={{ marginBottom: '1.25rem', color: 'var(--primary-color)' }}>Nouveau Collaborateur Clinique</h3>

            <form onSubmit={handleCreateSubmit}>
              <div className="form-group">
                <label className="form-label">Nom Complet *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ex: Dr. Amadou Sow"
                  className="form-input"
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Adresse E-mail Professionnelle *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="nom.prenom@medclinik.com"
                  className="form-input"
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Mot de Passe Provisoire *</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Minimum 6 caractères"
                    className="form-input"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Téléphone *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+221770000000"
                    className="form-input"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Rôle Médical / Fonction</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="form-select"
                  disabled={isSubmitting}
                >
                  <option value="DOCTOR">Médecin (Praticien)</option>
                  <option value="NURSE">Infirmier (Vitals &amp; Soins)</option>
                  <option value="CASHIER">Caissier (Finances)</option>
                  <option value="ADMIN">Administrateur (Gestion &amp; IT)</option>
                </select>
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
                  {isSubmitting ? 'Création...' : 'Enregistrer le compte'}
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
    padding: '1.5rem',
    borderRadius: '12px',
  },
  tableWrapper: {
    width: '100%',
    overflowX: 'auto',
    marginTop: '1rem',
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
    maxWidth: '550px',
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
