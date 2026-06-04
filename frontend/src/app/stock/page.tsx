'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../components/AuthContext';
import { useToast } from '../../components/ToastContext';

interface StockItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  criticalThreshold: number;
  category: string;
  updatedAt: string;
}

export default function StockPage() {
  const { user, apiFetch, token } = useAuth();
  const { toast } = useToast();
  
  // Tabs management
  const [activeTab, setActiveTab] = useState<'inventory' | 'delivery'>('inventory');

  // Inventory states
  const [stock, setStock] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit stock level state
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [editQty, setEditQty] = useState('');
  const [editThreshold, setEditThreshold] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add stock item state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStockItem, setNewStockItem] = useState({
    name: '',
    quantity: '',
    unit: 'boîtes',
    criticalThreshold: '',
    category: 'Médicaments',
  });

  // Prescription delivery states
  const [rxCode, setRxCode] = useState('');
  const [searchedRx, setSearchedRx] = useState<any | null>(null);
  const [searchingRx, setSearchingRx] = useState(false);
  const [deliveringRx, setDeliveringRx] = useState(false);

  const fetchStock = useCallback(async () => {
    try {
      const res = await apiFetch('/stock');
      setStock(res);
    } catch (e: any) {
      console.error(e);
      setError('Impossible de charger l\'inventaire de la pharmacie.');
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    if (token) {
      fetchStock();
    }
  }, [token, fetchStock]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      await apiFetch('/stock', {
        method: 'POST',
        body: JSON.stringify({
          name: newStockItem.name,
          quantity: parseFloat(newStockItem.quantity),
          unit: newStockItem.unit,
          criticalThreshold: parseFloat(newStockItem.criticalThreshold),
          category: newStockItem.category,
        }),
      });
      setShowAddModal(false);
      setNewStockItem({
        name: '',
        quantity: '',
        unit: 'boîtes',
        criticalThreshold: '',
        category: 'Médicaments',
      });
      fetchStock();
      toast.success('Article de pharmacie ajouté avec succès.');
    } catch (e: any) {
      setError(e.message || 'Erreur lors de l\'ajout de l\'article.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (item: StockItem) => {
    setEditingItem(item);
    setEditQty(String(item.quantity));
    setEditThreshold(String(item.criticalThreshold));
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      setIsSubmitting(true);
      setError(null);

      await apiFetch(`/stock/update/${editingItem.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          quantity: parseFloat(editQty),
          criticalThreshold: parseFloat(editThreshold),
        }),
      });

      setEditingItem(null);
      fetchStock();
      toast.success('Stock mis à jour avec succès.');
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la mise à jour du stock');
      toast.error(e.message || 'Erreur lors de la mise à jour du stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearchRx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rxCode.trim()) return;
    try {
      setSearchingRx(true);
      setError(null);
      setSearchedRx(null);
      const res = await apiFetch(`/stock/prescription/${rxCode.trim()}`);
      setSearchedRx(res);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Impossible de trouver cette ordonnance.');
    } finally {
      setSearchingRx(false);
    }
  };

  const handleDeliverRx = async () => {
    if (!searchedRx) return;
    try {
      setDeliveringRx(true);
      setError(null);
      await apiFetch(`/stock/deliver/${searchedRx.id}`, {
        method: 'POST',
      });
      toast.success('Ordonnance délivrée avec succès ! Stocks mis à jour et facturation pharmacie générée.');
      fetchStock();
      // Re-load prescription
      const updated = await apiFetch(`/stock/prescription/${searchedRx.uniqueCode}`);
      setSearchedRx(updated);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Erreur lors de la délivrance.');
      toast.error(e.message || 'Erreur lors de la délivrance.');
    } finally {
      setDeliveringRx(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.spinnerWrapper}>
        <div className="spinner"></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Chargement de l'inventaire...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={styles.headerRow}>
        <div>
          <h1>Pharmacie Interne &amp; Consommables</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Suivi des niveaux de stock et délivrance sécurisée des ordonnances cliniques.
          </p>
        </div>

        {user?.role === 'ADMIN' && (
          <button
            onClick={() => {
              setShowAddModal(true);
              setError(null);
            }}
            className="btn btn-primary"
          >
            + Ajouter un Article
          </button>
        )}
      </div>

      {/* Tabs Selector */}
      <div style={styles.tabContainer}>
        <button
          onClick={() => {
            setActiveTab('inventory');
            setError(null);
          }}
          style={{
            ...styles.tabBtn,
            ...(activeTab === 'inventory' ? styles.activeTabBtn : {}),
          }}
        >
          Inventaire Pharmacie
        </button>
        <button
          onClick={() => {
            setActiveTab('delivery');
            setError(null);
          }}
          style={{
            ...styles.tabBtn,
            ...(activeTab === 'delivery' ? styles.activeTabBtn : {}),
          }}
        >
          Délivrance Ordonnances
        </button>
      </div>

      {error && (
        <div style={styles.errorAlert}>
          <strong>Alerte :</strong> {error}
        </div>
      )}

      {/* Tab Content 1: Inventory */}
      {activeTab === 'inventory' && (
        <div className="glass-card">
          <h3>État de l'Inventaire Clinique</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Les articles avec des quantités inférieures ou égales à leur seuil critique s'affichent avec une alerte de restockage.
          </p>

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>Article</th>
                  <th style={styles.th}>Catégorie</th>
                  <th style={styles.th}>Quantité en Stock</th>
                  <th style={styles.th}>Seuil d'Alerte</th>
                  <th style={styles.th}>Statut</th>
                  <th style={styles.th}>Dernière MàJ</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stock.map((item) => {
                  const isCritical = item.quantity <= item.criticalThreshold;
                  return (
                    <tr key={item.id} style={styles.trRow}>
                      <td style={styles.td}>
                        <strong>{item.name}</strong>
                      </td>
                      <td style={styles.td}>
                        <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }}>{item.category}</span>
                      </td>
                      <td style={{ ...styles.td, fontWeight: 'bold', color: isCritical ? 'var(--danger)' : 'var(--success)' }}>
                        {item.quantity} {item.unit}
                      </td>
                      <td style={styles.td}>
                        {item.criticalThreshold} {item.unit}
                      </td>
                      <td style={styles.td}>
                        {isCritical ? (
                          <span className="badge badge-unpaid" style={{ color: 'var(--danger)', borderColor: 'var(--danger)', background: 'var(--danger-glow)' }}>RESTOCK REQUIS</span>
                        ) : (
                          <span className="badge badge-paid" style={{ color: 'var(--success)', borderColor: 'var(--success)', background: 'var(--success-glow)' }}>OK</span>
                        )}
                      </td>
                      <td style={styles.td}>{new Date(item.updatedAt).toLocaleDateString('fr-FR')}</td>
                      <td style={styles.td}>
                        {user?.role === 'ADMIN' || user?.role === 'DOCTOR' || user?.role === 'NURSE' ? (
                          <button
                            onClick={() => handleEditClick(item)}
                            className="btn btn-secondary"
                            style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                          >
                            Ajuster
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Lecture seule</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content 2: Prescription Delivery */}
      {activeTab === 'delivery' && (
        <div className="glass-card animate-slide-up">
          <h3>Délivrance &amp; Déstockage d'Ordonnances</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Saisissez le code RX de l'ordonnance médicale pour vérifier les disponibilités de stock et valider la délivrance clinique.
          </p>

          <form onSubmit={handleSearchRx} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', maxWidth: '500px' }}>
            <input
              type="text"
              required
              placeholder="Code ordonnance (ex: RX-2026-XXXX)"
              value={rxCode}
              onChange={(e) => setRxCode(e.target.value)}
              className="form-input"
              style={{ flex: 1 }}
            />
            <button type="submit" disabled={searchingRx} className="btn btn-primary">
              {searchingRx ? 'Recherche...' : 'Rechercher'}
            </button>
          </form>

          {searchedRx && (
            <div style={styles.rxDetailsSheet}>
              <div style={styles.rxDetailsHeader}>
                <div>
                  <h4>Ordonnance : {searchedRx.uniqueCode}</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    Émise par : <strong>{searchedRx.consultation.doctor.name}</strong> ({searchedRx.consultation.specialty})
                  </p>
                </div>
                <div>
                  {searchedRx.isDelivered ? (
                    <span className="badge badge-paid" style={{ color: 'var(--success)', borderColor: 'var(--success)', background: 'var(--success-glow)' }}>DÉLIVRÉE</span>
                  ) : (
                    <span className="badge badge-unpaid" style={{ color: 'var(--danger)', borderColor: 'var(--danger)', background: 'var(--danger-glow)' }}>À LIVRER</span>
                  )}
                </div>
              </div>

              <div style={styles.rxPatientBlock}>
                <p>Patient : <strong>{searchedRx.consultation.patient.firstName} {searchedRx.consultation.patient.lastName} ({searchedRx.consultation.patient.code})</strong></p>
                {searchedRx.consultation.patient.mutuelleName && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Mutuelle : {searchedRx.consultation.patient.mutuelleName} (Couverture {searchedRx.consultation.patient.insuranceCoverageShare}%)
                  </p>
                )}
              </div>

              <h5 style={{ margin: '1.5rem 0 0.75rem 0', textTransform: 'uppercase', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Médicaments prescrits</h5>
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.thRow}>
                      <th style={styles.th}>Molécule</th>
                      <th style={styles.th}>Posologie</th>
                      <th style={styles.th}>Durée</th>
                      <th style={styles.th}>Statut Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(searchedRx.medicines as any[]).map((med, idx) => (
                      <tr key={idx} style={styles.trRow}>
                        <td style={styles.td}><strong>{med.name}</strong></td>
                        <td style={styles.td}>{med.dosage}</td>
                        <td style={styles.td}>{med.duration}</td>
                        <td style={styles.td}>
                          <span style={{ color: 'var(--success)', fontWeight: '600' }}>Disponible (Dépôt Clinique)</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!searchedRx.isDelivered && (
                <div style={styles.rxDeliverAction}>
                  <div style={styles.billingEstimate}>
                    <span>Estimation Facturation Pharmacie :</span>
                    <strong style={{ fontSize: '1.2rem', color: 'var(--primary-color)' }}>{searchedRx.medicines.length * 3000} FCFA</strong>
                    {searchedRx.consultation.patient.mutuelleName && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        (Reste à charge patient : {searchedRx.medicines.length * 3000 * (1 - searchedRx.consultation.patient.insuranceCoverageShare/100)} FCFA)
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleDeliverRx}
                    disabled={deliveringRx}
                    className="btn btn-success"
                    style={{ padding: '0.75rem 1.5rem' }}
                  >
                    {deliveringRx ? 'Délivrance...' : 'Valider & Délivrer les médicaments'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Adjust Stock Level Modal Overlay */}
      {editingItem && (
        <div style={styles.modalOverlay}>
          <div className="glass-card animate-slide-up" style={styles.modal}>
            <h3 style={{ marginBottom: '1.25rem', color: 'var(--primary-color)' }}>Ajuster Stock : {editingItem.name}</h3>

            <form onSubmit={handleUpdateSubmit}>
              <div className="form-group">
                <label className="form-label">Quantité en Stock ({editingItem.unit})</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={editQty}
                  onChange={(e) => setEditQty(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Seuil Critique d'Alerte ({editingItem.unit})</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={editThreshold}
                  onChange={(e) => setEditThreshold(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
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
                  {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Stock Item Modal */}
      {showAddModal && (
        <div style={styles.modalOverlay}>
          <div className="glass-card animate-slide-up" style={styles.modal}>
            <h3 style={{ marginBottom: '1.25rem', color: 'var(--primary-color)' }}>Ajouter un Article en Stock</h3>

            <form onSubmit={handleAddSubmit}>
              <div className="form-group">
                <label className="form-label">Nom de l'article *</label>
                <input
                  type="text"
                  required
                  value={newStockItem.name}
                  onChange={(e) => setNewStockItem({ ...newStockItem, name: e.target.value })}
                  placeholder="ex: Paracétamol 500mg, Seringues 10ml..."
                  className="form-input"
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Quantité Initiale *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newStockItem.quantity}
                    onChange={(e) => setNewStockItem({ ...newStockItem, quantity: e.target.value })}
                    placeholder="0"
                    className="form-input"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Unité de mesure *</label>
                  <input
                    type="text"
                    required
                    value={newStockItem.unit}
                    onChange={(e) => setNewStockItem({ ...newStockItem, unit: e.target.value })}
                    placeholder="ex: boîtes, flacons, seringues..."
                    className="form-input"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Seuil Critique d'Alerte *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newStockItem.criticalThreshold}
                    onChange={(e) => setNewStockItem({ ...newStockItem, criticalThreshold: e.target.value })}
                    placeholder="10"
                    className="form-input"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Catégorie *</label>
                  <select
                    value={newStockItem.category}
                    onChange={(e) => setNewStockItem({ ...newStockItem, category: e.target.value })}
                    className="form-select"
                    disabled={isSubmitting}
                  >
                    <option value="Médicaments">Médicaments</option>
                    <option value="Consommables">Consommables</option>
                    <option value="Équipement">Équipement</option>
                  </select>
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
                  {isSubmitting ? 'Ajout...' : 'Ajouter l\'article'}
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
  errorAlert: {
    backgroundColor: 'var(--danger-glow)',
    border: '1px solid var(--danger)',
    color: '#fff',
    padding: '1rem',
    borderRadius: '8px',
  },
  spinnerWrapper: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
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
    transition: 'background-color 0.2s',
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
    maxWidth: '450px',
    width: '90%',
    padding: '2rem',
    borderRadius: '16px',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem',
    marginTop: '1.5rem',
  },
  tabContainer: {
    display: 'flex',
    gap: '0.5rem',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '0.1rem',
  },
  tabBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    padding: '0.75rem 1.25rem',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    borderRadius: '8px 8px 0 0',
    transition: 'all 0.2s',
  },
  activeTabBtn: {
    color: 'var(--primary-color)',
    background: 'rgba(6, 182, 212, 0.08)',
    borderBottom: '2px solid var(--primary-color)',
  },
  rxDetailsSheet: {
    marginTop: '1.5rem',
    padding: '1.5rem',
    backgroundColor: 'rgba(255,255,255,0.01)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
  },
  rxDetailsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '1rem',
    marginBottom: '1rem',
  },
  rxPatientBlock: {
    padding: '1rem',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: '6px',
    fontSize: '0.95rem',
  },
  rxDeliverAction: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '2rem',
    paddingTop: '1.5rem',
    borderTop: '1px solid var(--border-color)',
    gap: '1rem',
  },
  billingEstimate: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
  },
};
