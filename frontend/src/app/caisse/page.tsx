'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth, API_URL } from '../../components/AuthContext';
import io from 'socket.io-client';
import { useToast } from '../../components/ToastContext';

// Services (DIP)
import { BillingService } from '../../services/billing.service';
import { PatientService } from '../../services/patient.service';

// Types
import { Bill } from '../../types/billing';

// Components (SRP)
import { BillsTable } from '../../components/billing/BillsTable';
import { BillCreateForm } from '../../components/billing/BillCreateForm';
import { PaymentModal } from '../../components/billing/PaymentModal';
import { ReceiptPrinter } from '../../components/billing/ReceiptPrinter';

export default function CaissePage() {
  const { user, apiFetch, token } = useAuth();
  const { toast } = useToast();

  // Instantiating services with DI
  const billingService = useMemo(() => new BillingService(apiFetch), [apiFetch]);
  const patientService = useMemo(() => new PatientService(apiFetch), [apiFetch]);

  // Global Page States
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Validation & Checkout overlays states
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [invoiceToPrint, setInvoiceToPrint] = useState<Bill | null>(null);
  const [showCreateBillForm, setShowCreateBillForm] = useState(false);

  // Fetch all billing transactions
  const fetchBills = useCallback(async () => {
    try {
      const res = await billingService.getBills();
      setBills(res);
    } catch (e: any) {
      console.error(e);
      setError("Erreur d'accès au module de caisse. Vérifiez vos permissions (réservé aux caissiers et administrateurs).");
    } finally {
      setLoading(false);
    }
  }, [billingService]);

  // Access validation and initial fetch
  useEffect(() => {
    if (token && (user?.role === 'CASHIER' || user?.role === 'ADMIN')) {
      fetchBills();
    } else if (token) {
      setLoading(false);
      setError('Accès restreint. Seuls les caissiers ou administrateurs peuvent consulter la caisse financière.');
    }
  }, [token, user?.role, fetchBills]);

  // Real-time updates handler via WebSockets
  useEffect(() => {
    const socket = io(API_URL);
    socket.on('queue_updated', () => {
      fetchBills();
    });
    return () => {
      socket.disconnect();
    };
  }, [fetchBills]);

  // Online mutual validation request
  const handleValidateInsurance = async (billId: string, mutuelleName: string, coverageShare: number) => {
    try {
      setValidatingId(billId);
      const updatedBill = await billingService.validateInsurance(billId, mutuelleName, coverageShare);
      
      setBills((prev) => prev.map((b) => (b.id === billId ? { ...b, ...updatedBill } : b)));
      toast.success(`Prise en charge validée en ligne avec succès ! Code d'autorisation : ${updatedBill.insuranceAuthCode}`);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Erreur de communication avec le serveur mutuelle.');
    } finally {
      setValidatingId(null);
    }
  };

  // Payment confirmation handler
  const handlePaymentSuccess = (paidBill: Bill) => {
    setBills((prev) => prev.map((b) => (b.id === paidBill.id ? paidBill : b)));
    setSelectedBill(null);
    fetchBills();
    setInvoiceToPrint(paidBill);
  };

  // Utility formatter
  const formatFCFA = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Check socket changes specifically to update checkout states if active
  const activeSelectedBill = useMemo(() => {
    if (!selectedBill) return null;
    return bills.find((b) => b.id === selectedBill.id) || selectedBill;
  }, [bills, selectedBill]);

  if (loading) {
    return (
      <div className="spinner-wrapper">
        <div className="spinner"></div>
        <p className="loading-text">Chargement des données de facturation...</p>
        <style jsx>{`
          .spinner-wrapper {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            min-height: 400px;
          }
          .loading-text {
            margin-top: 1rem;
            color: var(--text-muted);
          }
        `}</style>
      </div>
    );
  }

  if (error && bills.length === 0) {
    return (
      <div className="glass-card error-card">
        <h3 className="error-title">Accès Interdit</h3>
        <p className="error-text">{error}</p>
        <style jsx>{`
          .error-card {
            max-width: 500px;
            margin: 3rem auto;
            text-align: center;
            padding: 2rem;
          }
          .error-title {
            color: var(--danger);
          }
          .error-text {
            margin: 1rem 0;
            color: var(--text-muted);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="animate-fade-in caisse-container">
      <div className="header-row">
        <div>
          <h1>Caisse &amp; Facturation — Contrôle Anti-Fraude</h1>
          <p className="subtitle">
            Règlement des consultations, calcul des quote-parts mutuelles et déblocage instantané des dossiers médicaux.
          </p>
        </div>

        <button onClick={() => setShowCreateBillForm(!showCreateBillForm)} className="btn btn-primary">
          {showCreateBillForm ? 'Fermer la saisie' : '+ Saisir un Encaissement'}
        </button>
      </div>

      {error && (
        <div className="error-alert">
          <strong>Alerte :</strong> {error}
        </div>
      )}

      {/* Saisie Facturation Section */}
      {showCreateBillForm && (
        <div className="form-wrapper">
          <BillCreateForm
            patientService={patientService}
            billingService={billingService}
            apiFetch={apiFetch}
            onBillCreated={() => {
              setShowCreateBillForm(false);
              fetchBills();
            }}
            onClose={() => setShowCreateBillForm(false)}
            formatFCFA={formatFCFA}
          />
        </div>
      )}

      {/* Bill List Table */}
      <BillsTable
        bills={bills}
        validatingId={validatingId}
        onValidateInsurance={handleValidateInsurance}
        onSelectBill={setSelectedBill}
        onPrintInvoice={setInvoiceToPrint}
        formatFCFA={formatFCFA}
      />

      {/* Checkout Modal Overlay */}
      {activeSelectedBill && (
        <PaymentModal
          bill={activeSelectedBill}
          billingService={billingService}
          onPaymentSuccess={handlePaymentSuccess}
          onClose={() => setSelectedBill(null)}
          formatFCFA={formatFCFA}
        />
      )}

      {/* Invoice Ticket Display Overlay */}
      {invoiceToPrint && (
        <ReceiptPrinter
          bill={invoiceToPrint}
          cashierName={invoiceToPrint.cashier?.name || user?.name || 'Caissier'}
          onClose={() => setInvoiceToPrint(null)}
          formatFCFA={formatFCFA}
        />
      )}

      <style jsx>{`
        .caisse-container {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }
        .subtitle {
          color: var(--text-muted);
          margin-top: 0.25rem;
        }
        .error-alert {
          background-color: var(--danger-glow);
          border: 1px solid var(--danger);
          color: #fff;
          padding: 1rem;
          borderRadius: 8px;
        }
        .form-wrapper {
          margin-top: 0.5rem;
        }
      `}</style>
    </div>
  );
}
