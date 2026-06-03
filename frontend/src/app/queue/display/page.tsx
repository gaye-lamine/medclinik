'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth, API_URL } from '../../../components/AuthContext';
import { io } from 'socket.io-client';
import Link from 'next/link';

interface Patient {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  gender: string;
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

export default function QueueDisplayPage() {
  const { apiFetch, token } = useAuth();
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [activeCall, setActiveCall] = useState<QueueEntry | null>(null);
  const [showCallOverlay, setShowCallOverlay] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  
  // Track already called patient IDs to avoid repeating the chime/TTS on page reload
  const spokenCalls = useRef<Set<string>>(new Set());

  // Web Audio Chime Synthesizer
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      // Ding-Dong Chime notes (E5 then C5)
      const now = ctx.currentTime;
      
      // First Note E5 (659.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.6);

      // Second Note C5 (523.25 Hz) after 0.3s
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(523.25, now + 0.3);
      gain2.gain.setValueAtTime(0, now);
      gain2.gain.setValueAtTime(0.3, now + 0.3);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.9);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.3);
      osc2.stop(now + 0.9);
    } catch (e) {
      console.error('Audio chime failed:', e);
    }
  };

  // TTS Voice Callout
  const speakCall = (entry: QueueEntry) => {
    if (!soundEnabled) return;
    try {
      const patientName = `${entry.patient.firstName} ${entry.patient.lastName}`;
      const service = entry.department === 'VITALS' ? "à l'infirmerie pour les constantes" : "en consultation médicale";
      const text = `Le patient, ${patientName}, est attendu ${service}.`;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.rate = 0.9;
      
      // Try to find a French voice
      const voices = window.speechSynthesis.getVoices();
      const frVoice = voices.find(v => v.lang.startsWith('fr'));
      if (frVoice) {
        utterance.voice = frVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error('TTS failed:', e);
    }
  };

  const fetchQueue = useCallback(async () => {
    try {
      const res = await apiFetch('/queue');
      setQueue(res);

      // Detect if there is a patient currently being called
      const callingEntries = res.filter((e: QueueEntry) => e.status === 'CALLING');
      if (callingEntries.length > 0) {
        // Grab the most recently added or first calling patient
        const currentCall = callingEntries[0];
        
        // Trigger alert only if we haven't spoken/displayed this call event yet
        if (!spokenCalls.current.has(currentCall.id)) {
          spokenCalls.current.add(currentCall.id);
          setActiveCall(currentCall);
          setShowCallOverlay(true);
          
          // Sound effects
          playChime();
          // Delay TTS voice to let chime finish
          setTimeout(() => {
            speakCall(currentCall);
          }, 800);

          // Hide overlay after 8 seconds
          setTimeout(() => {
            setShowCallOverlay(false);
          }, 8000);
        }
      }
    } catch (e) {
      console.error('Error fetching queue for display:', e);
    }
  }, [apiFetch, soundEnabled]);

  // Socket setup
  useEffect(() => {
    if (!token) return;
    
    // Initial fetch
    fetchQueue();

    // Connect WebSockets
    const socket = io(API_URL);
    socket.on('connect', () => {
      console.log('Display screen connected to WS Gateway');
    });

    socket.on('queue_updated', () => {
      console.log('WS Broadcast: queue_updated, reloading display queue...');
      fetchQueue();
    });

    // Populate voices for TTS
    window.speechSynthesis.getVoices();

    return () => {
      socket.disconnect();
    };
  }, [token, fetchQueue]);

  // Lists split
  const callingEntries = queue.filter(e => e.status === 'CALLING' || e.status === 'IN_CONSULTATION');
  const waitingEntries = queue.filter(e => e.status === 'IN_QUEUE')
    .sort((a, b) => {
      // Emergency > Urgent > Normal
      const priorityMap: Record<string, number> = { EMERGENCY: 3, URGENT: 2, NORMAL: 1 };
      const priorityDiff = (priorityMap[b.priority] || 0) - (priorityMap[a.priority] || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'EMERGENCY':
        return <span style={{ ...styles.badge, backgroundColor: 'var(--danger)', color: '#fff' }}>URGENCE VITALE</span>;
      case 'URGENT':
        return <span style={{ ...styles.badge, backgroundColor: 'var(--warning)', color: '#000' }}>URGENT</span>;
      default:
        return <span style={{ ...styles.badge, backgroundColor: 'rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>NORMAL</span>;
    }
  };

  return (
    <div style={styles.container}>
      {/* Audio permission activator overlay */}
      {!soundEnabled && (
        <div style={styles.soundOverlay}>
          <div style={styles.soundCard} className="glass-card">
            <h2 style={{ marginBottom: '1rem', fontFamily: 'var(--font-title)' }}>Activer le Son Salle d'Attente</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              Pour que l'écran TV puisse diffuser les carillons sonores et appeler les patients par voix de synthèse, veuillez cliquer ci-dessous.
            </p>
            <button 
              onClick={() => {
                setSoundEnabled(true);
                // Trigger a test sound to activate AudioContext
                setTimeout(() => {
                  try {
                    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    gain.gain.setValueAtTime(0.05, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.1);
                  } catch(e){}
                }, 100);
              }} 
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem' }}
            >
              Activer les Annonces Sonores
            </button>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header style={styles.header}>
        <div style={styles.logoGroup}>
          <div style={styles.logoPulse}></div>
          <span style={styles.logoText}>MedClinik <span>SÉCURITÉ</span></span>
        </div>
        <div style={styles.titleGroup}>
          <h1 style={styles.mainTitle}>ÉCRAN D'APPEL ET DE DIRECTION DES SOINS</h1>
          <span style={styles.liveBadge}>● TEMPS RÉEL ACTIF</span>
        </div>
        <Link href="/queue" className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
          Retour Console
        </Link>
      </header>

      {/* Main Grid split screen */}
      <div style={styles.contentGrid}>
        
        {/* Left Side: CURRENT CALLS */}
        <section style={styles.leftCol} className="glass-card">
          <div style={styles.sectionHeader}>
            <h2>APPELS EN COURS / ORIENTATION</h2>
          </div>
          
          <div style={styles.activeCallsList}>
            {callingEntries.length === 0 ? (
              <div style={styles.noCallsWrapper}>
                <p>Aucun appel actif. Les patients en attente seront appelés sous peu.</p>
              </div>
            ) : (
              callingEntries.map((entry) => (
                <div 
                  key={entry.id} 
                  style={{
                    ...styles.callRow,
                    borderColor: entry.status === 'CALLING' ? 'var(--primary-color)' : 'var(--border-color)',
                    boxShadow: entry.status === 'CALLING' ? 'var(--neon-glow)' : 'none'
                  }}
                  className={entry.status === 'CALLING' ? 'pulse-calling-border' : ''}
                >
                  <div style={styles.patientInfoGroup}>
                    <span style={styles.patientCode}>{entry.patient.code}</span>
                    <span style={styles.patientName}>{entry.patient.firstName} {entry.patient.lastName}</span>
                  </div>
                  
                  <div style={styles.destGroup}>
                    <span style={styles.destTitle}>SE DIRIGER VERS</span>
                    <span style={{
                      ...styles.destValue,
                      color: entry.department === 'VITALS' ? 'var(--success)' : 'var(--primary-color)'
                    }}>
                      {entry.department === 'VITALS' ? 'INFIRMERIE (CONSTANTES)' : 'CONSULTATIONS MÉDICALES'}
                    </span>
                  </div>

                  <div style={styles.statusIndicator}>
                    {entry.status === 'CALLING' ? (
                      <span style={styles.callingText}>◀ RAPPEL EN COURS</span>
                    ) : (
                      <span style={styles.consultingText}>EN SOINS</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Right Side: WAITING QUEUE LIST */}
        <section style={styles.rightCol} className="glass-card">
          <div style={styles.sectionHeader}>
            <h2>FILE D'ATTENTE GÉNÉRALE</h2>
          </div>

          <div style={styles.tableHeader}>
            <span>Patient</span>
            <span style={{ textAlign: 'center' }}>Code</span>
            <span style={{ textAlign: 'right' }}>Priorité d'Ordre</span>
          </div>

          <div style={styles.waitingList}>
            {waitingEntries.length === 0 ? (
              <p style={styles.emptyText}>La salle d'attente est vide.</p>
            ) : (
              waitingEntries.map((entry, idx) => (
                <div key={entry.id} style={styles.waitingRow}>
                  <div style={styles.waitNumberGroup}>
                    <span style={styles.waitNumber}>{idx + 1}</span>
                    <span style={styles.waitName}>{entry.patient.firstName} {entry.patient.lastName}</span>
                  </div>
                  <span style={styles.waitCode}>{entry.patient.code}</span>
                  <div style={{ textAlign: 'right' }}>{getPriorityBadge(entry.priority)}</div>
                </div>
              ))
            )}
          </div>
        </section>

      </div>

      {/* FULL SCREEN FLASHING OVERLAY ON NEW CALL */}
      {showCallOverlay && activeCall && (
        <div style={styles.overlayBG}>
          <div style={styles.overlayCard} className="glass-card animate-scale-up">
            <div style={styles.overlayLabel}>APPEL CLINIQUE PATIENT</div>
            
            <div style={styles.overlayPatientName}>
              {activeCall.patient.firstName} {activeCall.patient.lastName}
            </div>
            
            <div style={styles.overlayCode}>
              N° Dossier : {activeCall.patient.code}
            </div>

            <div style={styles.divider}></div>
            
            <div style={styles.overlayLabel}>VEUILLEZ VOUS DIRIGER VERS :</div>
            <div style={{
              ...styles.overlayDestination,
              color: activeCall.department === 'VITALS' ? 'var(--success)' : 'var(--primary-color)'
            }}>
              {activeCall.department === 'VITALS' ? 'INFIRMERIE — CONSTANTES' : 'SALLE DE CONSULTATION'}
            </div>
          </div>
        </div>
      )}

      {/* Local custom animations */}
      <style jsx global>{`
        @keyframes scaleUp {
          from { transform: scale(0.85); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes pulseBorderNeon {
          0% { box-shadow: 0 0 0 0 hsla(190, 85%, 45%, 0.4); border-color: var(--primary-color); }
          70% { box-shadow: 0 0 25px 8px hsla(190, 85%, 45%, 0); border-color: var(--primary-color); }
          100% { box-shadow: 0 0 0 0 hsla(190, 85%, 45%, 0); border-color: var(--primary-color); }
        }
        .animate-scale-up {
          animation: scaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .pulse-calling-border {
          animation: pulseBorderNeon 2s infinite;
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100vh',
    width: '100%',
    padding: '2rem',
    backgroundColor: '#070a13',
    color: '#fff',
    gap: '2rem',
    overflow: 'hidden',
  },
  soundOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.85)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
  },
  soundCard: {
    maxWidth: '460px',
    width: '100%',
    textAlign: 'center' as const,
    padding: '2.5rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '1.5rem',
  },
  logoGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  logoPulse: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary-color)',
    boxShadow: '0 0 10px var(--primary-color)',
  },
  logoText: {
    fontFamily: 'var(--font-title)',
    fontWeight: '800',
    fontSize: '1.4rem',
    letterSpacing: '-0.02em',
  },
  titleGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '0.25rem',
  },
  mainTitle: {
    fontSize: '1.8rem',
    fontWeight: '800',
    color: '#fff',
    background: 'none',
    WebkitTextFillColor: 'initial',
  },
  liveBadge: {
    fontSize: '0.75rem',
    color: 'var(--success)',
    fontWeight: 'bold',
    letterSpacing: '0.1em',
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 0.8fr',
    gap: '2rem',
    flex: 1,
    minHeight: 0, // important for nested scroll
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '2rem',
    height: '100%',
    minHeight: 0,
  },
  rightCol: {
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '2rem',
    height: '100%',
    minHeight: 0,
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1.5rem',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '1rem',
  },
  iconIndicator: {
    fontSize: '1.5rem',
  },
  activeCallsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem',
    flex: 1,
    overflowY: 'auto' as const,
    paddingRight: '0.5rem',
  },
  noCallsWrapper: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: '1rem',
    color: 'var(--text-muted)',
    textAlign: 'center' as const,
  },
  sleepIcon: {
    fontSize: '3rem',
    opacity: 0.6,
  },
  callRow: {
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '1.75rem',
    backgroundColor: 'rgba(255,255,255,0.02)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    gap: '1rem',
    transition: 'all 0.3s ease',
  },
  patientInfoGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  patientCode: {
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: '1.2rem',
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: '0.25rem 0.75rem',
    borderRadius: '6px',
    color: 'var(--primary-color)',
  },
  patientName: {
    fontSize: '1.6rem',
    fontWeight: 'bold',
  },
  destGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.25rem',
  },
  destTitle: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    letterSpacing: '0.05em',
  },
  destValue: {
    fontSize: '1.4rem',
    fontWeight: 'bold',
  },
  statusIndicator: {
    textAlign: 'right' as const,
  },
  callingText: {
    color: 'var(--warning)',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    letterSpacing: '0.05em',
    animation: 'pulse 1s infinite alternate',
  },
  consultingText: {
    color: 'var(--text-muted)',
    fontWeight: 'bold',
    fontSize: '0.85rem',
    letterSpacing: '0.05em',
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 0.8fr 1fr',
    padding: '0.75rem 1rem',
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
    textTransform: 'uppercase' as const,
    borderBottom: '1px solid var(--border-color)',
    marginBottom: '1rem',
  },
  waitingList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
    flex: 1,
    overflowY: 'auto' as const,
    paddingRight: '0.5rem',
  },
  waitingRow: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 0.8fr 1fr',
    padding: '1rem',
    backgroundColor: 'rgba(255,255,255,0.01)',
    border: '1px solid rgba(255,255,255,0.03)',
    borderRadius: '8px',
    alignItems: 'center',
  },
  waitNumberGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  waitNumber: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
  },
  waitName: {
    fontWeight: 'bold',
    fontSize: '1rem',
  },
  waitCode: {
    fontFamily: 'monospace',
    color: 'var(--text-muted)',
    textAlign: 'center' as const,
  },
  badge: {
    fontSize: '0.7rem',
    padding: '0.2rem 0.5rem',
    borderRadius: '4px',
    fontWeight: 'bold' as const,
    display: 'inline-block',
  },
  emptyText: {
    textAlign: 'center' as const,
    color: 'var(--text-muted)',
    marginTop: '2rem',
  },
  overlayBG: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(5, 7, 15, 0.96)',
    zIndex: 99999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
  },
  overlayCard: {
    maxWidth: '800px',
    width: '100%',
    textAlign: 'center' as const,
    padding: '4rem 3rem',
    border: '3px solid var(--primary-color)',
    boxShadow: '0 0 50px rgba(6, 182, 212, 0.3)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '1.5rem',
  },
  overlayIcon: {
    fontSize: '5rem',
    animation: 'swing 2s infinite ease-in-out',
  },
  overlayLabel: {
    fontSize: '1.2rem',
    color: 'var(--text-muted)',
    letterSpacing: '0.2em',
    textTransform: 'uppercase' as const,
  },
  overlayPatientName: {
    fontSize: '3.6rem',
    fontWeight: '900',
    color: '#fff',
    letterSpacing: '-0.02em',
  },
  overlayCode: {
    fontSize: '1.8rem',
    fontFamily: 'monospace',
    color: 'var(--primary-color)',
    fontWeight: 'bold',
  },
  divider: {
    width: '120px',
    height: '4px',
    backgroundColor: 'var(--border-color)',
    margin: '1rem 0',
    borderRadius: '2px',
  },
  overlayDestination: {
    fontSize: '2.6rem',
    fontWeight: 'bold',
  },
};
