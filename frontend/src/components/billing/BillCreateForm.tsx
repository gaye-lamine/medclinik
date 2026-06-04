import React, { useState, useEffect } from 'react';
import { Patient } from '../../types/billing';
import { PatientService } from '../../services/patient.service';
import { BillingService } from '../../services/billing.service';

interface Doctor {
  id: string;
  name: string;
  role: string;
}

interface BillCreateFormProps {
  patientService: PatientService;
  billingService: BillingService;
  onBillCreated: () => void;
  onClose: () => void;
  formatFCFA: (amount: number) => string;
  apiFetch: (path: string, options?: RequestInit) => Promise<any>;
}

export const BillCreateForm: React.FC<BillCreateFormProps> = ({
  patientService,
  billingService,
  onBillCreated,
  onClose,
  formatFCFA,
  apiFetch,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [billAmount, setBillAmount] = useState('15000');
  const [specialty, setSpecialty] = useState('Général');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Charger la liste des médecins au montage
  useEffect(() => {
    apiFetch('/auth/users')
      .then((users: any[]) => {
        const docs = users.filter((u) => u.role === 'DOCTOR');
        setDoctors(docs);
        if (docs.length > 0) setSelectedDoctorId(docs[0].id);
      })
      .catch(console.error);
  }, [apiFetch]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    try {
      const results = await patientService.searchPatients(query);
      setSearchResults(results);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    if (!selectedDoctorId) {
      setError('Veuillez sélectionner un médecin.');
      return;
    }
    try {
      setError(null);
      setIsSubmitting(true);
      await billingService.createBill(
        selectedPatient.id,
        parseFloat(billAmount),
        selectedDoctorId,
        specialty,
      );
      setSelectedPatient(null);
      setSearchQuery('');
      setSearchResults([]);
      onBillCreated();
    } catch (err: any) {
      setError(err.message || 'Impossible de créer la ligne de facturation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const parsedAmount = parseFloat(billAmount) || 0;
  const coveragePercent = selectedPatient?.insuranceCoverageShare || 0;
  const insuranceShare = (parsedAmount * coveragePercent) / 100;
  const patientShare = parsedAmount - insuranceShare;

  return (
    <div className="glass-card animate-slide-up" style={{ padding: '2rem' }}>
      <h3>Saisir une nouvelle Facture</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        Créez une facture pour un patient. Cela générera automatiquement un dossier d'examen en attente de paiement.
      </p>

      {error && (
        <div style={{ backgroundColor: 'var(--danger-glow)', border: '1px solid var(--danger)', color: '#fff', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {!selectedPatient ? (
        <div className="form-group" style={{ position: 'relative' }}>
          <label className="form-label">Nom du Patient</label>
          <input
            type="text"
            placeholder="Rechercher le patient par nom ou code..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="form-input"
          />

          {searchResults.length > 0 && (
            <div className="form-autocomplete-results">
              {searchResults.map((pat) => (
                <div
                  key={pat.id}
                  onClick={() => setSelectedPatient(pat)}
                  className="form-autocomplete-item"
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
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="selected-patient-badge">
            <span>Patient : <strong>{selectedPatient.firstName} {selectedPatient.lastName} ({selectedPatient.code})</strong></span>
            <button type="button" onClick={() => setSelectedPatient(null)} className="remove-patient-btn">Annuler</button>
          </div>

          <div className="form-group">
            <label className="form-label">Médecin traitant *</label>
            <select
              required
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="form-select"
            >
              <option value="">Sélectionner un médecin...</option>
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>{doc.name}</option>
              ))}
            </select>
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
                min="0"
                required
              />
            </div>
          </div>

          <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Configuration assurance patient : <br />
              — Mutuelle : <strong>{selectedPatient.mutuelleName || 'Aucune'}</strong> <br />
              — Couverture : <strong>{selectedPatient.insuranceCoverageShare}%</strong> <br />
              — Part Assureur : <strong>{formatFCFA(insuranceShare)}</strong> <br />
              — Part patient à régler : <strong style={{ color: 'var(--warning)', fontSize: '1.1rem' }}>{formatFCFA(patientShare)}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : 'Générer la facture'}
            </button>
          </div>
        </form>
      )}

      {/* Styled JSX for scoped class styles */}
      <style jsx>{`
        .form-autocomplete-results {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background-color: hsl(222, 40%, 15%);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          box-shadow: var(--shadow-lg);
          z-index: 50;
          max-height: 200px;
          overflow-y: auto;
        }
        .form-autocomplete-item {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--border-color);
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          transition: background-color 0.2s;
        }
        .form-autocomplete-item:hover {
          background-color: var(--surface-hover);
        }
        .selected-patient-badge {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: var(--primary-glow);
          border: 1px solid var(--primary-color);
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
        }
        .remove-patient-btn {
          background: none;
          border: none;
          color: var(--danger);
          cursor: pointer;
          fontWeight: bold;
        }
      `}</style>
    </div>
  );
};
