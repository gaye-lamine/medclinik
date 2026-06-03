'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth, ROLE_LABELS } from '../../components/AuthContext';
import io from 'socket.io-client';

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

interface Bill {
  id: string;
  patientId: string;
  patient: Patient;
  amount: number;
  status: 'UNPAID' | 'PAID';
  paymentMethod?: string;
  mutuelleName?: string;
  insuranceCoverageShare: number;
  patientShare: number;
  insuranceShare: number;
  transactionId?: string;
  createdAt: string;
  cashier?: { name: string };
  insuranceValidated?: boolean;
  insuranceAuthCode?: string;
}

export default function CaissePage() {
  const { user, apiFetch, token } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Checkout modal state
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('WAVE');
  const [mobileOperator, setMobileOperator] = useState('Wave');
  const [momoPhone, setMomoPhone] = useState('');
  const [waveUrl, setWaveUrl] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState('');

  // Insurance validation loading state
  const [validatingId, setValidatingId] = useState<string | null>(null);

  // Invoice display state (for printing)
  const [invoiceToPrint, setInvoiceToPrint] = useState<Bill | null>(null);

  const handleValidateInsurance = async (billId: string, mutuelleName: string) => {
    try {
      setValidatingId(billId);
      const updatedBill = await apiFetch(`/billing/validate-insurance/${billId}`, {
        method: 'POST',
        body: JSON.stringify({
          mutuelleName,
          policyNumber: `POL-${mutuelleName.substring(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`,
        }),
      });

      setBills((prev) => prev.map((b) => (b.id === billId ? { ...b, ...updatedBill } : b)));
      alert(`Prise en charge validée en ligne avec succès ! Code d'autorisation : ${updatedBill.insuranceAuthCode}`);
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Erreur de communication avec le serveur mutuelle.');
    } finally {
      setValidatingId(null);
    }
  };

  // New billing generation state
  const [showCreateBillForm, setShowCreateBillForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [billAmount, setBillAmount] = useState('15000');
  const [specialty, setSpecialty] = useState('Général');

  const fetchBills = useCallback(async () => {
    try {
      const res = await apiFetch('/billing');
      setBills(res);
    } catch (e: any) {
      console.error(e);
      setError('Erreur d\'accès au module de caisse. Vérifiez vos permissions (réservé aux caissiers et administrateurs).');
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    if (token && (user?.role === 'CASHIER' || user?.role === 'ADMIN')) {
      fetchBills();
    } else if (token) {
      setLoading(false);
      setError('Accès restreint. Seuls les caissiers ou administrateurs peuvent consulter la caisse financière.');
    }
  }, [token, user?.role, fetchBills]);

  // Socket listener for real-time payment validation (Wave)
  useEffect(() => {
    const socket = io('http://localhost:3006');
    socket.on('queue_updated', () => {
      fetchBills();
    });
    return () => {
      socket.disconnect();
    };
  }, [fetchBills]);

  // Check if current wave payment was processed via Webhook
  useEffect(() => {
    if (waveUrl && selectedBill) {
      const updatedBill = bills.find(b => b.id === selectedBill.id);
      if (updatedBill && updatedBill.status === 'PAID') {
        alert('✅ Le paiement Wave a été confirmé avec succès par le patient !');
        setWaveUrl(null);
        setSelectedBill(null);
        setInvoiceToPrint(updatedBill);
      }
    }
  }, [bills, waveUrl, selectedBill]);

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

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    try {
      setError(null);
      await apiFetch('/billing', {
        method: 'POST',
        body: JSON.stringify({
          patientId: selectedPatient.id,
          amount: parseFloat(billAmount),
          specialty,
        }),
      });
      setSelectedPatient(null);
      setSearchQuery('');
      setSearchResults([]);
      setShowCreateBillForm(false);
      fetchBills();
    } catch (e: any) {
      setError(e.message || 'Impossible de créer la ligne de facturation');
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill) return;

    try {
      setError(null);

      if (paymentMethod === 'WAVE') {
        // Appeler le backend pour générer la session Wave
        const response = await apiFetch(`/billing/wave/checkout/${selectedBill.id}`, {
          method: 'POST',
        });
        setWaveUrl(response.waveUrl);
        return; // Wait for socket to confirm payment
      }

      // Paiement CASH classique
      const txId = transactionId || `TX-${paymentMethod}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const paidBill = await apiFetch(`/billing/pay/${selectedBill.id}`, {
        method: 'POST',
        body: JSON.stringify({
          paymentMethod,
          transactionId: txId,
        }),
      });

      setSelectedBill(null);
      setTransactionId('');
      setMomoPhone('');
      fetchBills();

      setInvoiceToPrint({ ...selectedBill, ...paidBill });
    } catch (e: any) {
      setError(e.message || 'Erreur lors du règlement de la facture');
    }
  };

  const formatFCFA = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(amount);
  };

  if (loading) {
    return (
      <div style={styles.spinnerWrapper}>
        <div className="spinner"></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Chargement des données de facturation...</p>
      </div>
    );
  }

  if (error && bills.length === 0) {
    return (
      <div className="glass-card" style={{ maxWidth: '500px', margin: '3rem auto', textAlign: 'center', padding: '2rem' }}>
        <h3 style={{ color: 'var(--danger)' }}>Accès Interdit</h3>
        <p style={{ margin: '1rem 0', color: 'var(--text-muted)' }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={styles.headerRow}>
        <div>
          <h1>Caisse &amp; Facturation — Contrôle Anti-Fraude</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Règlement des consultations, calcul des quote-parts mutuelles et déblocage instantané des dossiers médicaux.
          </p>
        </div>

        <button onClick={() => setShowCreateBillForm(!showCreateBillForm)} className="btn btn-primary">
          {showCreateBillForm ? 'Fermer la saisie' : '+ Saisir un Encaissement'}
        </button>
      </div>

      {error && (
        <div style={styles.errorAlert}>
          <strong>Alerte :</strong> {error}
        </div>
      )}

      {/* Saisie Facturation Section */}
      {showCreateBillForm && (
        <div className="glass-card animate-slide-up" style={{ padding: '2rem' }}>
          <h3>Saisir une nouvelle Facture</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Créez une facture pour un patient. Cela générera automatiquement un dossier d'examen en attente de paiement.
          </p>

          {!selectedPatient ? (
            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label">Nom du Patient</label>
              <input
                type="text"
                placeholder="Rechercher le patient..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="form-input"
              />

              {searchResults.length > 0 && (
                <div style={styles.searchResults}>
                  {searchResults.map((pat) => (
                    <div
                      key={pat.id}
                      onClick={() => setSelectedPatient(pat)}
                      style={styles.searchResultItem}
                    >
                      <span><strong>{pat.firstName} {pat.lastName}</strong> ({pat.code})</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {pat.mutuelleName ? `Assurance: ${pat.mutuelleName} (${pat.insuranceCoverageShare}%)` : 'Pas d\'assurance'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleCreateBill} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={styles.selectedPatientBadge}>
                <span>Patient : <strong>{selectedPatient.firstName} {selectedPatient.lastName} ({selectedPatient.code})</strong></span>
                <button type="button" onClick={() => setSelectedPatient(null)} style={styles.removeBtn}>Annuler</button>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Type d'examen / Consultation</label>
                  <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="form-select">
                    <option value="Général">Consultation Médecine Générale (15 000 FCFA)</option>
                    <option value="Pédiatrie">Consultation Pédiatrie (20 000 FCFA)</option>
                    <option value="Gynécologie">Consultation Gynécologie (25 000 FCFA)</option>
                    <option value="Ophtalmologie">Consultation Ophtalmologie (18 000 FCFA)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Montant Total (FCFA)</label>
                  <input
                    type="number"
                    value={billAmount}
                    onChange={(e) => setBillAmount(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ ...styles.selectedPatientBadge, backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '1rem' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  Configuration assurance patient : <br />
                  — Mutuelle : <strong>{selectedPatient.mutuelleName || 'Aucune'}</strong> <br />
                  — Couverture : <strong>{selectedPatient.insuranceCoverageShare}%</strong> <br />
                  — Part Assureur : <strong>{formatFCFA((parseFloat(billAmount) * selectedPatient.insuranceCoverageShare) / 100)}</strong> <br />
                  — Part patient à régler : <strong style={{ color: 'var(--warning)', fontSize: '1.1rem' }}>{formatFCFA(parseFloat(billAmount) - (parseFloat(billAmount) * selectedPatient.insuranceCoverageShare) / 100)}</strong>
                </span>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setSelectedPatient(null)} className="btn btn-secondary">Annuler</button>
                <button type="submit" className="btn btn-primary">Générer la facture</button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Bill List Table */}
      <div className="glass-card">
        <h3>Grand Livre des Transactions Caisse</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          La liste complète des factures en attente et réglées. Les dossiers sont débloqués en temps réel.
        </p>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Patient</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Assurance / Mutuelle</th>
                <th style={styles.th}>Total</th>
                <th style={styles.th}>Part Patient</th>
                <th style={styles.th}>Part Assureur</th>
                <th style={styles.th}>Statut</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((bill) => (
                <tr key={bill.id} style={styles.trRow}>
                  <td style={styles.td}>
                    <strong>{bill.patient.firstName} {bill.patient.lastName}</strong> <br />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{bill.patient.code}</span>
                  </td>
                  <td style={styles.td}>{new Date(bill.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td style={styles.td}>
                    {bill.mutuelleName ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <span>{bill.mutuelleName} ({bill.insuranceCoverageShare}%)</span>
                        {bill.insuranceValidated ? (
                          <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: '600' }}>
                            Validé ✓ ({bill.insuranceAuthCode})
                          </span>
                        ) : (
                          <button
                            onClick={() => handleValidateInsurance(bill.id, bill.mutuelleName || '')}
                            disabled={validatingId === bill.id}
                            className="btn btn-secondary"
                            style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', width: 'fit-content' }}
                          >
                            {validatingId === bill.id ? 'Connexion API...' : 'Valider via API'}
                          </button>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>Aucune (100% Cash)</span>
                    )}
                  </td>
                  <td style={styles.td}>{formatFCFA(bill.amount)}</td>
                  <td style={{ ...styles.td, color: 'var(--warning)', fontWeight: 'bold' }}>{formatFCFA(bill.patientShare)}</td>
                  <td style={styles.td}>{formatFCFA(bill.insuranceShare)}</td>
                  <td style={styles.td}>
                    <span className={`badge ${bill.status === 'PAID' ? 'badge-paid' : 'badge-unpaid'}`}>
                      {bill.status === 'PAID' ? 'Réglé' : 'Impayé'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {bill.status === 'UNPAID' ? (
                      <button
                        onClick={() => setSelectedBill(bill)}
                        className="btn btn-success"
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                      >
                        Encaisser
                      </button>
                    ) : (
                      <button
                        onClick={() => setInvoiceToPrint(bill)}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                      >
                        Reçu / Ticket
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Checkout Modal Overlay */}
      {selectedBill && (
        <div style={styles.modalOverlay}>
          <div className="glass-card animate-slide-up" style={styles.modal}>
            <h3 style={{ marginBottom: '1.25rem', color: 'var(--primary-color)' }}>Encaisser un Règlement</h3>
            
            <div style={styles.checkoutSummary}>
              <p>Patient : <strong>{selectedBill.patient.firstName} {selectedBill.patient.lastName} ({selectedBill.patient.code})</strong></p>
              <p>Reste à payer : <strong style={{ color: 'var(--warning)', fontSize: '1.2rem' }}>{formatFCFA(selectedBill.patientShare)}</strong></p>
              {selectedBill.mutuelleName && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  * Part assurance de {formatFCFA(selectedBill.insuranceShare)} ({selectedBill.insuranceCoverageShare}%) facturée à {selectedBill.mutuelleName}.
                </p>
              )}
            </div>

            {waveUrl ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <span style={{ fontSize: '3rem' }}>🌊</span>
                  <h4 style={{ marginTop: '0.5rem', color: 'var(--primary-color)' }}>En attente du paiement Wave</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                    Le patient doit cliquer sur le lien ci-dessous ou le scanner pour valider la transaction.
                    Cette fenêtre se fermera automatiquement dès réception du paiement !
                  </p>
                </div>
                
                <a 
                  href={waveUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ display: 'inline-block', width: '100%', marginBottom: '1rem', padding: '1rem', fontSize: '1.1rem' }}
                >
                  Ouvrir le portail de paiement Wave
                </a>

                <button 
                  onClick={() => setWaveUrl(null)} 
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                >
                  Annuler la session Wave
                </button>
              </div>
            ) : (
              <form onSubmit={handlePaymentSubmit}>
              <div className="form-group">
                <label className="form-label">Mode de Règlement</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="form-select"
                >
                  <option value="WAVE">Wave Mobile Money</option>
                  <option value="CASH">Espèces (Cash)</option>
                </select>
              </div>

              {paymentMethod === 'WAVE' && (
                <div className="form-group">
                  <label className="form-label">Numéro de téléphone Wave du Client</label>
                  <input
                    type="tel"
                    required
                    placeholder="Ex: 77 000 00 00"
                    value={momoPhone}
                    onChange={(e) => setMomoPhone(e.target.value)}
                    className="form-input"
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">
                  {paymentMethod === 'WAVE' ? 'Référence de Transaction Wave' : 'Numéro de Reçu / Référence (Facultatif)'}
                </label>
                <input
                  type="text"
                  placeholder={paymentMethod === 'WAVE' ? 'Générée automatiquement si vide (ex: W-123456)' : 'Automatique si vide'}
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={styles.modalActions}>
                <button type="button" onClick={() => setSelectedBill(null)} className="btn btn-secondary">Annuler</button>
                <button type="submit" className="btn btn-success" style={{ backgroundColor: 'var(--primary-color)', borderColor: 'var(--primary-color)' }}>
                  {paymentMethod === 'WAVE' ? 'Générer le Lien Wave' : 'Confirmer le Règlement Cash'}
                </button>
              </div>
            </form>
            )}
          </div>
        </div>
      )}

      {/* Invoice Ticket Display Overlay */}
      {invoiceToPrint && (
        <div style={styles.modalOverlay}>
          <div className="glass-card animate-slide-up" style={styles.receiptModal}>
            <div style={styles.receiptHeader}>
              <h2>Ticket de Paiement Caisse</h2>
              <button onClick={() => setInvoiceToPrint(null)} style={styles.closeReceiptBtn}>Fermer</button>
            </div>

            {/* Receipt Sheet */}
            <div style={styles.receiptSheet}>
              <div style={styles.receiptClinicDetails}>
                <h4>MedClinik — ERP Clinique</h4>
                <p>Abidjan, Cocody Mermoz — BP 221</p>
                <p>Tél: +225 07 00 00 00 — Email: contact@medclinik.com</p>
              </div>

              <div style={styles.receiptDivider}></div>

              <div style={styles.receiptDetails}>
                <p><strong>FACTURE N°:</strong> {invoiceToPrint.id.substring(0, 8).toUpperCase()}</p>
                <p><strong>DATE:</strong> {new Date(invoiceToPrint.createdAt).toLocaleString('fr-FR')}</p>
                <p><strong>CAISSIER:</strong> {invoiceToPrint.cashier?.name || user?.name}</p>
                <p><strong>PATIENT:</strong> {invoiceToPrint.patient.firstName} {invoiceToPrint.patient.lastName} ({invoiceToPrint.patient.code})</p>
              </div>

              <div style={styles.receiptDivider}></div>

              <table style={styles.receiptTable}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #000' }}>
                    <th style={{ textAlign: 'left', padding: '0.4rem 0' }}>Prestation</th>
                    <th style={{ textAlign: 'right', padding: '0.4rem 0' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '0.4rem 0' }}>Consultation médicale ({invoiceToPrint.patient.mutuelleName || 'Standard'})</td>
                    <td style={{ textAlign: 'right', padding: '0.4rem 0' }}>{formatFCFA(invoiceToPrint.amount)}</td>
                  </tr>
                </tbody>
              </table>

              <div style={styles.receiptDivider}></div>

              <div style={styles.receiptTotalBlock}>
                <div style={styles.totalRow}><span>Montant Total :</span> <span>{formatFCFA(invoiceToPrint.amount)}</span></div>
                {invoiceToPrint.mutuelleName && (
                  <>
                    <div style={styles.totalRow}><span>Part Assurance ({invoiceToPrint.insuranceCoverageShare}%) :</span> <span>{formatFCFA(invoiceToPrint.insuranceShare)}</span></div>
                    <div style={styles.totalRow}><span>Prise en charge :</span> <span>{invoiceToPrint.mutuelleName}</span></div>
                  </>
                )}
                <div style={{ ...styles.totalRow, fontWeight: 'bold', fontSize: '1.1rem' }}>
                  <span>NET PAYÉ (PATIENT) :</span> <span>{formatFCFA(invoiceToPrint.patientShare)}</span>
                </div>
              </div>

              <div style={styles.receiptDivider}></div>

              <div style={styles.receiptFooter}>
                <p>Règlement effectué par: <strong>{invoiceToPrint.paymentMethod === 'WAVE' ? 'Wave Mobile Money' : invoiceToPrint.paymentMethod === 'CASH' ? 'Espèces' : (invoiceToPrint.paymentMethod || 'Wave')}</strong></p>
                <p>ID Transac: <code>{invoiceToPrint.transactionId || 'N/A'}</code></p>
                
                <div style={styles.qrBlock}>
                  <div style={styles.mockBarCode}>
                    ||||| | |||| ||| | || |||| | ||||| | ||
                  </div>
                  <div style={styles.mockQrCode}>
                    QR SECURE
                  </div>
                </div>

                <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: '#555' }}>
                  Certifié authentique et exempt de fraudes. MedClinik ERP.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button onClick={() => window.print()} className="btn btn-primary">Imprimer la facture</button>
            </div>
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
  checkoutSummary: {
    backgroundColor: 'var(--primary-glow)',
    border: '1px solid var(--primary-color)',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem',
    marginTop: '1.5rem',
  },
  receiptModal: {
    maxWidth: '500px',
    width: '90%',
    padding: '1.5rem',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  receiptHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeReceiptBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
  },
  receiptSheet: {
    backgroundColor: '#fff',
    color: '#000',
    padding: '2rem',
    borderRadius: '8px',
    fontFamily: 'monospace',
    boxShadow: 'inset 0 0 10px rgba(0,0,0,0.1)',
  },
  receiptClinicDetails: {
    textAlign: 'center',
    fontSize: '0.85rem',
    lineHeight: '1.4',
  },
  receiptDivider: {
    borderTop: '1px dashed #000',
    margin: '1rem 0',
  },
  receiptDetails: {
    fontSize: '0.85rem',
    lineHeight: '1.4',
  },
  receiptTable: {
    width: '100%',
    fontSize: '0.85rem',
    borderCollapse: 'collapse',
  },
  receiptTotalBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    fontSize: '0.85rem',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  receiptFooter: {
    textAlign: 'center',
    fontSize: '0.8rem',
    lineHeight: '1.4',
    marginTop: '1rem',
  },
  qrBlock: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '1rem',
    border: '1px solid #000',
    padding: '0.5rem',
  },
  mockBarCode: {
    fontSize: '1rem',
    letterSpacing: '-2px',
    fontWeight: 'bold',
  },
  mockQrCode: {
    border: '2px solid #000',
    padding: '0.25rem 0.5rem',
    fontSize: '0.7rem',
    fontWeight: 'bold',
  },
};
