import React from 'react';
import { ShieldCheck, Cpu, RefreshCw, Sparkles, AlertTriangle, CheckCircle2, FileText } from 'lucide-react';

export default function Header({ health, onRefreshHealth, isWarming, onWarmup }) {
  const isOnline = health?.status === 'ok';
  const ollamaOk = health?.ollama?.status === 'ok';
  const modelName = health?.ollama?.configuredModel || 'gemma4:latest';

  return (
    <header className="glass-panel" style={{ padding: '1.25rem 2rem', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        
        {/* Brand Title & Tagline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(59, 130, 246, 0.4)',
            fontSize: '1.5rem',
            color: '#fff'
          }}>
            <FileText size={28} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0 }} className="gradient-text">
                DocSaathi
              </h1>
              <span className="badge badge-info" style={{ textTransform: 'none', fontSize: '0.7rem' }}>
                Hack Day Coimbatore
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0.15rem 0 0 0' }}>
              AI Document Companion for Deterministic Fact Verification &amp; Multilingual Explanations
            </p>
          </div>
        </div>

        {/* System & Ollama Model Status Monitor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          
          {/* Status Badge */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '0.6rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {ollamaOk ? (
                <CheckCircle2 size={16} color="#34d399" />
              ) : (
                <AlertTriangle size={16} color="#fbbf24" />
              )}
              <span style={{ fontSize: '0.825rem', fontWeight: '600', color: ollamaOk ? '#34d399' : '#fbbf24' }}>
                {ollamaOk ? 'Ollama Vision Ready' : 'Ollama Offline / Standby'}
              </span>
            </div>

            <div style={{ width: '1px', height: '18px', background: 'var(--border-color)' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Cpu size={14} color="var(--text-muted)" />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {modelName}
              </span>
            </div>

            <button
              onClick={onRefreshHealth}
              title="Refresh Ollama Connection"
              className="btn btn-secondary btn-sm"
              style={{ padding: '0.25rem 0.5rem' }}
            >
              <RefreshCw size={13} />
            </button>
          </div>

          {/* Model Warmup Action */}
          <button
            onClick={onWarmup}
            disabled={isWarming}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Sparkles size={14} color="#f59e0b" className={isWarming ? 'spinner' : ''} />
            <span>{isWarming ? 'Warming RAM...' : 'Warmup Model'}</span>
          </button>
        </div>

      </div>
    </header>
  );
}
