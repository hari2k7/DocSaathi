import React, { useState } from 'react';
import {
  ShieldCheck, AlertTriangle, Calendar, IndianRupee, Clock, Building2,
  FileCheck, Stethoscope, FileText, ChevronDown, ChevronUp, AlertCircle, Search, HelpCircle
} from 'lucide-react';

export default function FactVerificationCard({ verifiedFacts, processingTime, onViewTranscription }) {
  const [showRawFacts, setShowRawFacts] = useState(false);

  if (!verifiedFacts) return null;

  const {
    doc_type = 'document',
    sender,
    amount_due,
    due_date,
    reference_ids = [],
    required_actions = [],
    penalties = [],
    medical_details,
    unclear_parts = []
  } = verifiedFacts;

  // Determine urgency badge for due date
  const renderDueDateBadge = () => {
    if (!due_date || due_date.days_left === null) {
      return (
        <span className="badge badge-info">
          <Calendar size={12} /> Date: N/A
        </span>
      );
    }

    if (due_date.is_past) {
      return (
        <span className="badge badge-danger">
          <Clock size={12} /> Overdue by {Math.abs(due_date.days_left)} Days
        </span>
      );
    } else if (due_date.days_left <= 3) {
      return (
        <span className="badge badge-danger">
          <Clock size={12} /> Due in {due_date.days_left} Days (Urgent)
        </span>
      );
    } else if (due_date.days_left <= 7) {
      return (
        <span className="badge badge-warning">
          <Clock size={12} /> Due in {due_date.days_left} Days
        </span>
      );
    } else {
      return (
        <span className="badge badge-verified">
          <Calendar size={12} /> Due in {due_date.days_left} Days
        </span>
      );
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
      
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#34d399',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Pass 1: Verified Document Facts</h3>
              <span className="badge badge-verified" style={{ textTransform: 'capitalize' }}>
                {doc_type.replace('_', ' ')}
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>
              Deterministic code verification engine processed in {processingTime || '0.5'}s
            </p>
          </div>
        </div>

        <button
          onClick={onViewTranscription}
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <FileText size={14} color="var(--accent-primary)" />
          <span>View Verbatim Transcription</span>
        </button>
      </div>

      {/* Main Grid: Key Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        
        {/* Sender / Institution */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Building2 size={14} color="var(--accent-primary)" />
              SENDER / ISSUER
            </span>
            {sender?.is_verified ? (
              <span className="badge badge-verified" style={{ fontSize: '0.65rem' }}>Verbatim Match</span>
            ) : (
              <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>Unverified</span>
            )}
          </div>
          <p style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main)' }}>
            {sender?.value || 'Unknown Issuer'}
          </p>
          {sender?.source_text && (
            <p style={{ fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
              Source: "{sender.source_text}"
            </p>
          )}
        </div>

        {/* Amount Due */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <IndianRupee size={14} color="#f59e0b" />
              AMOUNT DUE / FINE
            </span>
            {amount_due?.is_verified ? (
              <span className="badge badge-verified" style={{ fontSize: '0.65rem' }}>Match</span>
            ) : (
              <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>Check Paper Copy</span>
            )}
          </div>
          <p style={{ fontSize: '1.4rem', fontWeight: '800', color: amount_due?.value ? '#f8fafc' : 'var(--text-dim)' }}>
            {amount_due?.value !== null && amount_due?.value !== undefined ? (
              `₹ ${Number(amount_due.value).toLocaleString('en-IN')}`
            ) : (
              'No Amount'
            )}
          </p>
          {amount_due?.warning && (
            <p style={{ fontSize: '0.725rem', color: '#fbbf24', marginTop: '0.2rem' }}>
              ⚠️ {amount_due.warning}
            </p>
          )}
        </div>

        {/* Due Date Card */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Calendar size={14} color="#34d399" />
              DUE / EXPIRY DATE
            </span>
            {renderDueDateBadge()}
          </div>
          <p style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)' }}>
            {due_date?.value || 'No Due Date Specified'}
          </p>
          {due_date?.warning && (
            <p style={{ fontSize: '0.725rem', color: '#fbbf24', marginTop: '0.2rem' }}>
              ⚠️ {due_date.warning}
            </p>
          )}
        </div>

      </div>

      {/* Reference IDs Tag Grid */}
      {reference_ids.length > 0 && (
        <div style={{ marginBottom: '1.25rem', background: 'rgba(15, 23, 42, 0.4)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <h4 style={{ fontSize: '0.825rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FileCheck size={14} color="var(--accent-cyan)" />
            REFERENCE NUMBERS &amp; ACCOUNT CODES:
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            {reference_ids.map((ref, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.825rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>{ref.label || 'Ref'}:</span>
                <span style={{ fontWeight: '700', color: 'var(--accent-cyan)' }}>{ref.value}</span>
                {ref.is_verified && (
                  <span style={{ color: '#34d399', fontSize: '0.7rem' }} title="Verified Verbatim in document text">✓ Verified</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Medical Details Section (if Medical prescription/discharge document) */}
      {medical_details && (
        <div style={{
          marginBottom: '1.25rem',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem'
        }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#34d399', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Stethoscope size={18} />
            Medical Prescription &amp; Patient Care Summary
          </h4>

          {medical_details.diagnosis_or_test?.value && (
            <p style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>
              <strong>Diagnosis / Test:</strong> {medical_details.diagnosis_or_test.value}
            </p>
          )}

          {/* Medications Table */}
          {medical_details.medications?.length > 0 && (
            <div style={{ overflowX: 'auto', marginBottom: '0.85rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.5rem' }}>Medicine Name</th>
                    <th style={{ padding: '0.5rem' }}>Dosage</th>
                    <th style={{ padding: '0.5rem' }}>Timing &amp; Instructions</th>
                    <th style={{ padding: '0.5rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {medical_details.medications.map((med, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '0.5rem', fontWeight: '700', color: '#f8fafc' }}>{med.name}</td>
                      <td style={{ padding: '0.5rem', color: '#93c5fd' }}>{med.dosage || '-'}</td>
                      <td style={{ padding: '0.5rem', color: '#34d399' }}>{med.timing || '-'}</td>
                      <td style={{ padding: '0.5rem' }}>
                        {med.is_verified ? (
                          <span style={{ color: '#34d399', fontSize: '0.75rem' }}>✓ Verified</span>
                        ) : (
                          <span style={{ color: '#fbbf24', fontSize: '0.75rem' }}>⚠️ Check label</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Critical Care Instructions */}
          {medical_details.critical_instructions?.length > 0 && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <p style={{ fontSize: '0.825rem', fontWeight: '700', color: '#f87171', marginBottom: '0.35rem' }}>
                ⚠️ CRITICAL DOCTOR INSTRUCTIONS:
              </p>
              <ul style={{ paddingLeft: '1.2rem', fontSize: '0.825rem', color: '#fca5a5' }}>
                {medical_details.critical_instructions.map((inst, i) => (
                  <li key={i}>{inst.text}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Required Actions & Penalties Lists */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        
        {required_actions.length > 0 && (
          <div style={{ background: 'rgba(59, 130, 246, 0.08)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#60a5fa', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FileCheck size={16} />
              REQUIRED ACTIONS:
            </h4>
            <ul style={{ paddingLeft: '1.1rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
              {required_actions.map((act, i) => (
                <li key={i} style={{ marginBottom: '0.3rem' }}>{act.action}</li>
              ))}
            </ul>
          </div>
        )}

        {penalties.length > 0 && (
          <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#f87171', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertTriangle size={16} />
              PENALTIES &amp; LATE FEES:
            </h4>
            <ul style={{ paddingLeft: '1.1rem', fontSize: '0.85rem', color: '#fca5a5' }}>
              {penalties.map((pen, i) => (
                <li key={i} style={{ marginBottom: '0.3rem' }}>{pen.text}</li>
              ))}
            </ul>
          </div>
        )}

      </div>

      {/* Unclear Text Warnings */}
      {unclear_parts.length > 0 && (
        <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245, 158, 11, 0.3)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <HelpCircle size={18} color="#fbbf24" />
          <p style={{ fontSize: '0.825rem', color: '#fbbf24' }}>
            <strong>Low Clarity Alert:</strong> Model noticed blurry or unclear sections: {unclear_parts.join(', ')}. Please double check against your original paper document.
          </p>
        </div>
      )}

      {/* Raw Verified JSON Inspector Toggle */}
      <div style={{ marginTop: '1rem' }}>
        <button
          onClick={() => setShowRawFacts(!showRawFacts)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '0.8rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: 0
          }}
        >
          {showRawFacts ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          <span>{showRawFacts ? 'Hide Raw Verified Fact Schema' : 'Inspect Raw Verified Fact JSON'}</span>
        </button>

        {showRawFacts && (
          <pre style={{
            background: '#090d16',
            padding: '1rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            fontSize: '0.75rem',
            color: '#a7f3d0',
            overflowX: 'auto',
            marginTop: '0.5rem',
            maxHeight: '260px'
          }}>
            {JSON.stringify(verifiedFacts, null, 2)}
          </pre>
        )}
      </div>

    </div>
  );
}
