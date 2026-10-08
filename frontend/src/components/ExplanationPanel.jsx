import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Globe, Volume2, VolumeX, Copy, Check, Play, Pause, RefreshCw, FileText } from 'lucide-react';
import { streamExplanation } from '../services/api';

const LANGUAGES = [
  // apiCode is the language code the backend expects (see backend/API.md)
  { code: 'Tamil', apiCode: 'ta', label: 'தமிழ் (Tamil)', speechLang: 'ta-IN' },
  { code: 'English', apiCode: 'en', label: 'English', speechLang: 'en-IN' },
  { code: 'Hindi', apiCode: 'hi', label: 'हिंदी (Hindi)', speechLang: 'hi-IN' },
  { code: 'Malayalam', apiCode: 'ml', label: 'മലയാളം (Malayalam)', speechLang: 'ml-IN' },
  { code: 'Telugu', apiCode: 'te', label: 'తెలుగు (Telugu)', speechLang: 'te-IN' },
  { code: 'Kannada', apiCode: 'kn', label: 'ಕನ್ನಡ (Kannada)', speechLang: 'kn-IN' },
  { code: 'Bengali', apiCode: 'bn', label: 'বাংলা (Bengali)', speechLang: 'bn-IN' },
  { code: 'Marathi', apiCode: 'mr', label: 'मराठी (Marathi)', speechLang: 'mr-IN' },
  { code: 'Gujarati', apiCode: 'gu', label: 'ગુજરાતી (Gujarati)', speechLang: 'gu-IN' }
];

const MODES = [
  { id: 'explain', label: 'Explain Simple', desc: 'Easy citizen-friendly explanation' },
  { id: 'summarize', label: 'Key Summary', desc: 'Bullet points with dates & amounts' },
  { id: 'translate', label: 'Translate', desc: 'Verbatim text translation' }
];

const normalizeLang = (lang) => (lang || '').toLowerCase().replace('_', '-');

// Pick an installed voice for the language. Setting utterance.lang alone is only a
// hint: browsers fall back to their default (English/Hindi) voice, so we choose explicitly.
const findVoiceForLang = (voices, speechLang) => {
  const target = normalizeLang(speechLang);
  const base = target.split('-')[0];
  const exact = voices.filter((v) => normalizeLang(v.lang) === target);
  const sameLanguage = voices.filter((v) => normalizeLang(v.lang).split('-')[0] === base);
  return exact[0] || sameLanguage[0] || null;
};

export default function ExplanationPanel({ verifiedFacts }) {
  const [selectedLang, setSelectedLang] = useState('Tamil');
  const [selectedMode, setSelectedMode] = useState('explain');
  const [streamedText, setStreamedText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Audio Speech Synthesis state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synthRef = useRef(window.speechSynthesis);
  const voicesRef = useRef([]);
  const abortRef = useRef(null);
  const [voiceNotice, setVoiceNotice] = useState(null);

  // Browsers load voices asynchronously, so keep the list updated
  useEffect(() => {
    const synth = synthRef.current;
    if (!synth) return;
    const loadVoices = () => {
      voicesRef.current = synth.getVoices();
    };
    loadVoices();
    synth.addEventListener('voiceschanged', loadVoices);
    return () => synth.removeEventListener('voiceschanged', loadVoices);
  }, []);

  // Auto trigger stream when facts, lang, or mode change
  useEffect(() => {
    if (!verifiedFacts) return;
    handleGenerateExplanation();
    return () => {
      // Drop the stream of the previous language/mode so its text cannot mix into the new one
      abortRef.current?.abort();
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [verifiedFacts, selectedLang, selectedMode]);

  const handleGenerateExplanation = async () => {
    if (!verifiedFacts) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    if (synthRef.current) synthRef.current.cancel();
    setIsSpeaking(false);
    setVoiceNotice(null);

    setStreamedText('');
    setStreamError(null);
    setIsStreaming(true);

    const langObj = LANGUAGES.find((l) => l.code === selectedLang);

    await streamExplanation(
      { analysis: verifiedFacts, language: langObj.apiCode, mode: selectedMode, signal: controller.signal },
      (token) => {
        setStreamedText((prev) => prev + token);
      },
      (err) => {
        setStreamError(err);
        setIsStreaming(false);
      },
      () => {
        setIsStreaming(false);
      }
    );
  };

  const handleCopyText = () => {
    if (!streamedText) return;
    navigator.clipboard.writeText(streamedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Text-To-Speech Playback
  const handleToggleSpeech = () => {
    if (!synthRef.current) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }

    if (isSpeaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!streamedText) return;

    // Clean markdown formatting for speech
    const textToSpeak = streamedText
      .replace(/[*#_`]/g, '')
      .replace(/\[.*?\]/g, '');

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    
    const langObj = LANGUAGES.find(l => l.code === selectedLang);
    const targetCode = langObj ? langObj.speechLang : 'en-IN';

    const voices = synthRef.current.getVoices();
    const voice = findVoiceForLang(voices.length ? voices : voicesRef.current, targetCode);

    if (!voice) {
      setVoiceNotice(
        `No ${selectedLang} voice is installed on this browser/device, so the audio can't be read in ${selectedLang}. ` +
        `Try Microsoft Edge, or install the ${selectedLang} voice in your system speech settings.`
      );
      return;
    }

    setVoiceNotice(null);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = 0.92;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    synthRef.current.speak(utterance);
  };

  return (
    <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
      
      {/* Header with Mode & Language controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={22} color="#8b5cf6" />
            Pass 2: Multilingual AI Explanation &amp; Audio Reader
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Generates clear explanations in regional languages based strictly on verified document facts.
          </p>
        </div>

        {/* Language Selector Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Globe size={18} color="var(--accent-primary)" />
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            style={{
              background: 'rgba(15, 23, 42, 0.8)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '0.5rem 0.85rem',
              fontWeight: '600',
              fontSize: '0.875rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mode Pills Switcher */}
      <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {MODES.map((mode) => {
          const isActive = selectedMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => setSelectedMode(mode.id)}
              style={{
                background: isActive ? 'var(--accent-gradient)' : 'rgba(255, 255, 255, 0.05)',
                color: '#ffffff',
                border: isActive ? 'none' : '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '0.45rem 0.95rem',
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <span>{mode.label}</span>
            </button>
          );
        })}

        <button
          onClick={handleGenerateExplanation}
          disabled={isStreaming}
          className="btn btn-secondary btn-sm"
          style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <RefreshCw size={13} className={isStreaming ? 'spinner' : ''} />
          <span>Regenerate</span>
        </button>
      </div>

      {/* Streamed Output Box */}
      <div style={{
        background: 'rgba(11, 15, 25, 0.8)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '1.25rem',
        minHeight: '160px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        
        {streamError ? (
          <div style={{ color: '#f87171', fontSize: '0.9rem', padding: '1rem' }}>
            ⚠️ Failed to generate explanation stream: {streamError}
          </div>
        ) : (
          <div style={{
            fontSize: '1rem',
            lineHeight: '1.7',
            whiteSpace: 'pre-wrap',
            color: '#f8fafc',
            fontFamily: selectedLang === 'English' ? 'inherit' : 'sans-serif'
          }}>
            {streamedText}
            {isStreaming && (
              <span style={{
                display: 'inline-block',
                width: '8px',
                height: '18px',
                background: '#8b5cf6',
                marginLeft: '4px',
                borderRadius: '2px',
                animation: 'pulse-glow 0.8s infinite'
              }} />
            )}
            {!streamedText && isStreaming && (
              <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Streaming response in {selectedLang}...
              </span>
            )}
          </div>
        )}

        {/* Action Toolbar: TTS Audio & Copy */}
        {streamedText && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '1.25rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            
            {/* Audio Voice Synthesizer Button */}
            <button
              onClick={handleToggleSpeech}
              className={isSpeaking ? 'btn btn-emerald btn-sm' : 'btn btn-secondary btn-sm'}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              {isSpeaking ? (
                <>
                  <Pause size={14} />
                  <span>Stop Audio</span>
                </>
              ) : (
                <>
                  <Volume2 size={14} color="#34d399" />
                  <span>Listen Aloud ({selectedLang})</span>
                </>
              )}
            </button>

            {/* Copy Button */}
            <button
              onClick={handleCopyText}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              {copied ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>

          </div>
        )}

        {voiceNotice && (
          <div style={{ color: '#fbbf24', fontSize: '0.85rem', marginTop: '0.75rem' }}>
            ⚠️ {voiceNotice}
          </div>
        )}

      </div>

    </div>
  );
}
