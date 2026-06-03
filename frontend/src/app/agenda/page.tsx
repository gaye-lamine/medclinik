'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../components/AuthContext';

interface Patient {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

interface Doctor {
  id: string;
  name: string;
  email: string;
}

interface Appointment {
  id: string;
  patientId: string;
  patient: { id: string; firstName: string; lastName: string; code: string };
  doctorId: string;
  doctor: { id: string; name: string };
  dateTime: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  specialty: string;
  notes?: string;
}

export default function AgendaPage() {
  const { user, apiFetch, token } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>('ALL');

  // Booking Modal States
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  
  const [formDoctorId, setFormDoctorId] = useState('');
  const [formDateTime, setFormDateTime] = useState('');
  const [formSpecialty, setFormSpecialty] = useState('Général');
  const [formNotes, setFormNotes] = useState('');

  // Selected Appointment detail popover state
  const [selectedApptDetail, setSelectedApptDetail] = useState<Appointment | null>(null);

  const fetchAgendaData = useCallback(async () => {
    try {
      setLoading(true);
      const [apptsRes, docsRes] = await Promise.all([
        apiFetch('/appointments'),
        apiFetch('/doctors'),
      ]);
      setAppointments(apptsRes);
      setDoctors(docsRes);
      
      if (docsRes.length > 0 && !formDoctorId) {
        setFormDoctorId(docsRes[0].id);
      }
      setError(null);
    } catch (e: any) {
      console.error(e);
      setError('Impossible de charger les données de l\'agenda. Assurez-vous d\'être connecté.');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, formDoctorId]);

  useEffect(() => {
    if (token) {
      fetchAgendaData();
    }
  }, [token, fetchAgendaData]);

  // Generate Current Week days (Monday to Saturday)
  const getWeekDays = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    const monday = new Date(today.setDate(diff));
    
    return Array.from({ length: 6 }).map((_, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      return d;
    });
  };

  const weekDays = getWeekDays();
  const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

  const getApptForSlot = (day: Date, hourStr: string) => {
    const slotHour = parseInt(hourStr.split(':')[0]);
    return appointments.find((app) => {
      const appDate = new Date(app.dateTime);
      const doctorMatches = selectedDoctorFilter === 'ALL' || app.doctorId === selectedDoctorFilter;
      return (
        appDate.toDateString() === day.toDateString() && 
        appDate.getHours() === slotHour &&
        doctorMatches
      );
    });
  };

  const handleCellClick = (day: Date, hourStr: string) => {
    if (!(user?.role === 'ADMIN' || user?.role === 'NURSE' || user?.role === 'DOCTOR')) {
      alert("Droits insuffisants pour planifier un rendez-vous.");
      return;
    }
    const [h, m] = hourStr.split(':');
    const targetDate = new Date(day);
    targetDate.setHours(parseInt(h), parseInt(m), 0, 0);
    
    // Format to local ISO string (YYYY-MM-DDTHH:MM)
    const offset = targetDate.getTimezoneOffset() * 60000;
    const localISO = new Date(targetDate.getTime() - offset).toISOString().slice(0, 16);
    
    setFormDateTime(localISO);
    setShowModal(true);
  };

  const handlePatientSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setPatientResults([]);
      return;
    }
    try {
      const results = await apiFetch(`/patients/search?q=${query}`);
      setPatientResults(results);
    } catch (e) {
      console.error(e);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !formDoctorId || !formDateTime) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    try {
      setError(null);
      await apiFetch('/appointments', {
        method: 'POST',
        body: JSON.stringify({
          patientId: selectedPatient.id,
          doctorId: formDoctorId,
          dateTime: formDateTime,
          specialty: formSpecialty,
          notes: formNotes,
        }),
      });

      setSelectedPatient(null);
      setSearchQuery('');
      setPatientResults([]);
      setFormDateTime('');
      setFormNotes('');
      setShowModal(false);
      fetchAgendaData();
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Impossible de créer le rendez-vous');
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await apiFetch(`/appointments/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      setSelectedApptDetail(null);
      fetchAgendaData();
    } catch (e: any) {
      console.error(e);
      alert('Erreur lors de la mise à jour du statut.');
    }
  };

  const handleAdmit = async (apptId: string) => {
    try {
      await apiFetch(`/appointments/admit/${apptId}`, {
        method: 'POST',
      });
      setSelectedApptDetail(null);
      fetchAgendaData();
      alert('Patient admis avec succès. Facture de consultation générée en caisse.');
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Erreur lors de l'admission du patient.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce rendez-vous ?')) return;
    try {
      await apiFetch(`/appointments/${id}`, {
        method: 'DELETE',
      });
      setSelectedApptDetail(null);
      fetchAgendaData();
    } catch (e: any) {
      console.error(e);
      alert('Erreur lors de la suppression.');
    }
  };

  const getSpecialtyColor = (specialty: string) => {
    switch (specialty) {
      case 'Gynécologie':
        return 'hsl(325, 75%, 50%)'; // Pink
      case 'Pédiatrie':
        return 'hsl(260, 70%, 55%)'; // Purple
      case 'Ophtalmologie':
        return 'hsl(35, 90%, 45%)'; // Orange
      default:
        return 'var(--primary-color)'; // Cyan
    }
  };

  if (loading) {
    return (
      <div style={styles.spinnerWrapper}>
        <div className="spinner"></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Chargement de l'agenda clinique...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={styles.headerRow}>
        <div>
          <h1>Calendrier de Planification Hebdomadaire</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Visualisez les plannings par médecin, cliquez sur un créneau vide pour réserver et gérez les rendez-vous en temps réel.
          </p>
        </div>

        <div style={styles.filterGroup}>
          <label className="form-label" style={{ marginBottom: 0, whiteSpace: 'nowrap' }}>Filtrer par Praticien :</label>
          <select 
            value={selectedDoctorFilter} 
            onChange={(e) => setSelectedDoctorFilter(e.target.value)} 
            className="form-select"
            style={{ width: '220px', padding: '0.5rem 1rem' }}
          >
            <option value="ALL">Tous les médecins</option>
            {doctors.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div style={styles.errorAlert}>
          <strong>Erreur :</strong> {error}
        </div>
      )}

      {/* Visual Week-Grid Calendar Container */}
      <div className="glass-card" style={{ padding: '1rem', overflowX: 'auto' }}>
        <div style={styles.gridTable}>
          {/* Header Row: Days */}
          <div style={styles.gridHeaderRow}>
            <div style={styles.timeColumnHeader}>Heure</div>
            {weekDays.map((day) => {
              const isToday = day.toDateString() === new Date().toDateString();
              return (
                <div key={day.toDateString()} style={{ ...styles.dayColumnHeader, ...(isToday ? styles.todayHeader : {}) }}>
                  <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
                  </span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{day.getDate()}</span>
                </div>
              );
            })}
          </div>

          {/* Time Rows */}
          {hours.map((hour) => (
            <div key={hour} style={styles.gridRow}>
              {/* Hour indicator cell */}
              <div style={styles.timeCell}>{hour}</div>
              
              {/* Columns for each day */}
              {weekDays.map((day) => {
                const appt = getApptForSlot(day, hour);
                const isToday = day.toDateString() === new Date().toDateString();

                return (
                  <div 
                    key={day.toDateString() + '-' + hour} 
                    style={{ ...styles.calendarCell, ...(isToday ? styles.todayCell : {}) }}
                  >
                    {appt ? (
                      <div 
                        onClick={() => setSelectedApptDetail(appt)}
                        style={{ 
                          ...styles.apptBlock, 
                          backgroundColor: getSpecialtyColor(appt.specialty) + '30',
                          borderLeft: `4px solid ${getSpecialtyColor(appt.specialty)}`,
                          color: getSpecialtyColor(appt.specialty)
                        }}
                      >
                        <div style={{ fontWeight: '700', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {appt.patient.firstName} {appt.patient.lastName}
                        </div>
                        <div style={{ fontSize: '0.7rem', opacity: 0.95 }}>
                          {appt.specialty}
                        </div>
                      </div>
                    ) : (
                      <div 
                        onClick={() => handleCellClick(day, hour)}
                        className="empty-slot-btn"
                        style={styles.emptySlot}
                        title="Réserver ce créneau"
                      >
                        +
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Styled css rule for empty slot hover glows */}
      <style jsx global>{`
        .empty-slot-btn {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: transparent;
          font-size: 1.2rem;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s ease;
          border-radius: 4px;
        }
        .empty-slot-btn:hover {
          background-color: rgba(6, 182, 212, 0.08);
          color: var(--primary-color);
        }
      `}</style>

      {/* Appointment Details Popover / Modal Overlay */}
      {selectedApptDetail && (
        <div style={styles.modalOverlay}>
          <div className="glass-card animate-slide-up" style={{ ...styles.modal, maxWidth: '480px' }}>
            <h3 style={{ marginBottom: '1.25rem', color: getSpecialtyColor(selectedApptDetail.specialty) }}>
              Détails du Rendez-vous
            </h3>

            <div style={styles.detailBody}>
              <p style={styles.detailRow}>
                <span>Patient :</span>
                <strong>{selectedApptDetail.patient.firstName} {selectedApptDetail.patient.lastName} ({selectedApptDetail.patient.code})</strong>
              </p>
              <p style={styles.detailRow}>
                <span>Date &amp; Heure :</span>
                <strong>{new Date(selectedApptDetail.dateTime).toLocaleString('fr-FR')}</strong>
              </p>
              <p style={styles.detailRow}>
                <span>Médecin :</span>
                <strong>{selectedApptDetail.doctor.name}</strong>
              </p>
              <p style={styles.detailRow}>
                <span>Spécialité :</span>
                <strong>{selectedApptDetail.specialty}</strong>
              </p>
              <p style={styles.detailRow}>
                <span>Statut :</span>
                <strong>
                  {selectedApptDetail.status === 'SCHEDULED' ? 'Planifié' : selectedApptDetail.status === 'COMPLETED' ? 'Terminé' : 'Annulé'}
                </strong>
              </p>
              {selectedApptDetail.notes && (
                <p style={styles.notesRow}>
                  <span>Observations :</span>
                  <span style={{ fontStyle: 'italic', display: 'block', marginTop: '0.25rem', color: 'var(--text-muted)' }}>
                    {selectedApptDetail.notes}
                  </span>
                </p>
              )}
            </div>

            <div style={styles.modalActions}>
              <button type="button" onClick={() => setSelectedApptDetail(null)} className="btn btn-secondary">
                Fermer
              </button>
              {selectedApptDetail.status === 'SCHEDULED' && (
                <>
                  <button 
                    type="button" 
                    onClick={() => handleAdmit(selectedApptDetail.id)} 
                    className="btn btn-primary"
                  >
                    Admettre le Patient
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleUpdateStatus(selectedApptDetail.id, 'COMPLETED')} 
                    className="btn btn-success"
                  >
                    Confirmer Présence
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleUpdateStatus(selectedApptDetail.id, 'CANCELLED')} 
                    className="btn btn-secondary"
                    style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
                  >
                    Annuler le RDV
                  </button>
                </>
              )}
              <button 
                type="button" 
                onClick={() => handleDelete(selectedApptDetail.id)} 
                className="btn btn-danger"
                style={{ marginLeft: 'auto' }}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Form Modal Overlay */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div className="glass-card animate-slide-up" style={styles.modal}>
            <h3 style={{ marginBottom: '1.25rem', color: 'var(--primary-color)' }}>Prendre un Rendez-vous</h3>
            
            <form onSubmit={handleBookAppointment}>
              {/* Patient Autocomplete Search */}
              {!selectedPatient ? (
                <div className="form-group" style={{ position: 'relative' }}>
                  <label className="form-label">Rechercher le Patient</label>
                  <input
                    type="text"
                    required
                    placeholder="Saisir nom ou code du patient..."
                    value={searchQuery}
                    onChange={(e) => handlePatientSearch(e.target.value)}
                    className="form-input"
                  />
                  {patientResults.length > 0 && (
                    <div style={styles.searchResults}>
                      {patientResults.map((pat) => (
                        <div
                          key={pat.id}
                          onClick={() => setSelectedPatient(pat)}
                          style={styles.searchResultItem}
                        >
                          <strong>{pat.firstName} {pat.lastName}</strong>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{pat.code}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div style={styles.selectedPatientBadge}>
                  <span>Patient : <strong>{selectedPatient.firstName} {selectedPatient.lastName} ({selectedPatient.code})</strong></span>
                  <button type="button" onClick={() => setSelectedPatient(null)} style={styles.removeBtn}>Changer</button>
                </div>
              )}

              {/* Doctor Dropdown */}
              <div className="form-group">
                <label className="form-label">Médecin Référent</label>
                <select
                  required
                  value={formDoctorId}
                  onChange={(e) => setFormDoctorId(e.target.value)}
                  className="form-select"
                >
                  <option value="">Sélectionner un médecin...</option>
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Specialty & Date */}
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Spécialité / Service</label>
                  <select
                    value={formSpecialty}
                    onChange={(e) => setFormSpecialty(e.target.value)}
                    className="form-select"
                  >
                    <option value="Général">Médecine Générale</option>
                    <option value="Pédiatrie">Pédiatrie</option>
                    <option value="Gynécologie">Gynécologie</option>
                    <option value="Ophtalmologie">Ophtalmologie</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Date &amp; Heure</label>
                  <input
                    type="datetime-local"
                    required
                    value={formDateTime}
                    onChange={(e) => setFormDateTime(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="form-group">
                <label className="form-label">Motif de consultation / Notes</label>
                <textarea
                  placeholder="Symptômes, suivi de routine, etc..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="form-textarea"
                  style={{ height: '80px', resize: 'none' }}
                />
              </div>

              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Fermer</button>
                <button type="submit" className="btn btn-primary">Enregistrer le Rendez-vous</button>
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
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  gridTable: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: '780px',
  },
  gridHeaderRow: {
    display: 'flex',
    borderBottom: '2px solid var(--border-color)',
    paddingBottom: '0.75rem',
    marginBottom: '0.5rem',
  },
  timeColumnHeader: {
    width: '80px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
    fontWeight: 'bold',
  },
  dayColumnHeader: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0.5rem 0',
    borderRadius: '8px',
  },
  todayHeader: {
    background: 'var(--primary-glow)',
    border: '1px solid var(--primary-color)',
    color: 'var(--primary-color)',
  },
  gridRow: {
    display: 'flex',
    borderBottom: '1px solid var(--border-color)',
    height: '65px',
  },
  timeCell: {
    width: '80px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    fontWeight: '600',
    borderRight: '1px solid var(--border-color)',
  },
  calendarCell: {
    flex: 1,
    padding: '0.25rem',
    position: 'relative',
    borderRight: '1px solid var(--border-color)',
  },
  todayCell: {
    backgroundColor: 'rgba(6, 182, 212, 0.015)',
  },
  apptBlock: {
    width: '100%',
    height: '100%',
    padding: '0.5rem',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    overflow: 'hidden',
  },
  emptySlot: {
    width: '100%',
    height: '100%',
  },
  detailBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: '1rem',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    marginBottom: '1.25rem',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.95rem',
  },
  notesRow: {
    borderTop: '1px solid var(--border-color)',
    paddingTop: '0.5rem',
    fontSize: '0.9rem',
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
    padding: '2rem',
    borderRadius: '16px',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    marginTop: '1.5rem',
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
    maxHeight: '180px',
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
    marginBottom: '1.25rem',
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--danger)',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
};
