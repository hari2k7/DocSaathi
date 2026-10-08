import React, { useState } from 'react';
import { X, FileText, Copy, Check, Search } from 'lucide-react';

export default function TranscriptionModal({ transcription, onClose }) {
  const [copied, setCopied] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  if (!transcription) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(transcription);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1.5rem'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '800px',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.75rem',
        background: '#0f172a',
        border: '1px solid var(--border-glow)'
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <FileText size={22} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Verbatim Document Transcription</h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.25rem'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Search & Actions Toolbar */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{
            flex: 1,
            position: 'relative',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '0.85rem' }} />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search transcription text..."
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '0.6rem 0.85rem 0.6rem 2.4rem',
                color: 'var(--text-main)',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            />
          </div>

          <button
            onClick={handleCopy}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            {copied ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Content Viewbox */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          background: '#090d16',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          fontSize: '0.9rem',
          lineHeight: '1.7',
          color: '#cbd5e1',
          whiteSpace: 'pre-wrap',
          fontFamily: 'monospace'
        }}>
          {transcription}
        </div>

      </div>
    </div>
  );
}
