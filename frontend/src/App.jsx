import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import DocumentUploader from './components/DocumentUploader';
import FactVerificationCard from './components/FactVerificationCard';
import ExplanationPanel from './components/ExplanationPanel';
import DocumentChat from './components/DocumentChat';
import TranscriptionModal from './components/TranscriptionModal';
import { checkHealth, analyzeDocument } from './services/api';
import { ShieldCheck, AlertCircle, FileText, Heart, Sparkles, CheckCircle, ExternalLink } from 'lucide-react';

export default function App() {
  const [health, setHealth] = useState(null);
  const [isWarming, setIsWarming] = useState(false);

  const [selectedImage, setSelectedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [verifiedFacts, setVerifiedFacts] = useState(null);
  const [processingTime, setProcessingTime] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);

  const [showTranscriptionModal, setShowTranscriptionModal] = useState(false);

  // Fetch initial health status
  const fetchHealthStatus = async () => {
    const data = await checkHealth();
    setHealth(data);
  };

  useEffect(() => {
    fetchHealthStatus();
  }, []);

  const handleWarmup = async () => {
    setIsWarming(true);
    try {
      await fetch('/api/health'); // Ping
      await fetchHealthStatus();
    } catch (e) {
      console.warn('Warmup trigger:', e);
    } finally {
      setTimeout(() => setIsWarming(false), 1500);
    }
  };

  // Analyze document trigger
  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    setVerifiedFacts(null);

    try {
      const result = await analyzeDocument(selectedImage);
      setVerifiedFacts(result.data);
      setProcessingTime(result.processingTimeSeconds);
    } catch (err) {
      setAnalysisError(err.message || 'Failed to analyze document');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ maxWidth: '1240px', width: '100%', margin: '0 auto', padding: '1.5rem' }}>
        
        {/* Navigation & System Header */}
        <Header
          health={health}
          onRefreshHealth={fetchHealthStatus}
          isWarming={isWarming}
          onWarmup={handleWarmup}
        />

        {/* Backend Offline Warning Banner if applicable */}
        {health?.status === 'offline' && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: '#fca5a5'
          }}>
            <AlertCircle size={22} color="#ef4444" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.875rem' }}>
              <strong>DocSaathi Backend Server Offline:</strong> Please make sure the backend express server is running on <code>http://localhost:5000</code> by executing <code>cd backend &amp;&amp; npm start</code> in your terminal.
            </div>
          </div>
        )}

        {/* Step 1: Upload or Select Document */}
        <DocumentUploader
          selectedImage={selectedImage}
          onSelectImage={(img) => {
            setSelectedImage(img);
            setVerifiedFacts(null);
            setAnalysisError(null);
          }}
          onAnalyze={handleAnalyze}
          isAnalyzing={isAnalyzing}
        />

        {/* Analysis Error Notification */}
        {analysisError && (
          <div className="glass-panel" style={{
            padding: '1.25rem',
            marginBottom: '2rem',
            background: 'rgba(239, 68, 68, 0.12)',
            borderColor: 'rgba(239, 68, 68, 0.3)',
            color: '#fca5a5'
          }}>
            <h4 style={{ fontWeight: '700', marginBottom: '0.35rem', color: '#f87171' }}>
              ⚠️ Analysis Failed
            </h4>
            <p style={{ fontSize: '0.875rem' }}>{analysisError}</p>
          </div>
        )}

        {/* Results Container when Verified Facts exist */}
        {verifiedFacts && (
          <>
            {/* Pass 1: Fact Verification Dashboard */}
            <FactVerificationCard
              verifiedFacts={verifiedFacts}
              processingTime={processingTime}
              onViewTranscription={() => setShowTranscriptionModal(true)}
            />

            {/* Pass 2: Multilingual AI Explanation & Audio Reader */}
            <ExplanationPanel verifiedFacts={verifiedFacts} />

            {/* Pass 3: Grounded Interactive Document Q&A Assistant */}
            <DocumentChat transcription={verifiedFacts.transcription} />
          </>
        )}

      </div>

      {/* Transcription Modal */}
      {showTranscriptionModal && verifiedFacts?.transcription && (
        <TranscriptionModal
          transcription={verifiedFacts.transcription}
          onClose={() => setShowTranscriptionModal(false)}
        />
      )}

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--border-color)',
        padding: '1.75rem 0',
        background: 'rgba(11, 15, 25, 0.8)',
        textAlign: 'center',
        fontSize: '0.85rem',
        color: 'var(--text-muted)'
      }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={16} color="var(--accent-primary)" />
            <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>DocSaathi</span> — INIT CLUB × iDEA CLUB Hacktoberfest Hack Day Coimbatore 2026
          </div>
          <div>
            Philosophy: <span style={{ color: '#34d399', fontWeight: '600' }}>"Code handles facts, the model handles language."</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
