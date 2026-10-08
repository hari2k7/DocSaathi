import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Bot, User, Sparkles, HelpCircle, ShieldCheck } from 'lucide-react';
import { streamQA } from '../services/api';

const SUGGESTED_QUESTIONS = [
  'What is the total amount due?',
  'What is the due date for payment?',
  'What is the penalty if paid late?',
  'How and where can I pay this bill?',
  'What are the critical medical/doctor instructions?'
];

export default function DocumentChat({ transcription }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Hello! I am your DocSaathi AI Assistant. Ask me any question about your document — my answers are strictly grounded in your document text.',
      timestamp: new Date()
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  const handleSendQuestion = async (questionText) => {
    const query = questionText || inputQuery;
    if (!query.trim() || !transcription) return;

    const userMsgId = Date.now().toString();
    const botMsgId = (Date.now() + 1).toString();

    // Append user message
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, sender: 'user', text: query, timestamp: new Date() },
      { id: botMsgId, sender: 'bot', text: '', timestamp: new Date(), streaming: true }
    ]);

    setInputQuery('');
    setIsStreaming(true);

    await streamQA(
      transcription,
      query,
      'English',
      (token) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMsgId ? { ...msg, text: msg.text + token } : msg
          )
        );
      },
      (err) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMsgId
              ? { ...msg, text: `⚠️ Error processing request: ${err}`, streaming: false }
              : msg
          )
        );
        setIsStreaming(false);
      },
      () => {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === botMsgId ? { ...msg, streaming: false } : msg))
        );
        setIsStreaming(false);
      }
    );
  };

  if (!transcription) return null;

  return (
    <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'rgba(59, 130, 246, 0.15)',
            color: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <MessageSquare size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Pass 3: Grounded Document Q&amp;A</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>
              Ask anything about this specific document with zero AI hallucinations.
            </p>
          </div>
        </div>

        <span className="badge badge-verified" style={{ fontSize: '0.7rem' }}>
          <ShieldCheck size={12} /> Grounded in Evidence
        </span>
      </div>

      {/* Suggested Questions Pills */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
        {SUGGESTED_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendQuestion(q)}
            disabled={isStreaming}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              borderRadius: '9999px',
              padding: '0.35rem 0.85rem',
              fontSize: '0.775rem',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Messages Log */}
      <div style={{
        background: 'rgba(11, 15, 25, 0.7)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '1.25rem',
        maxHeight: '320px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        marginBottom: '1rem'
      }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              gap: '0.75rem',
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%'
            }}
          >
            {msg.sender === 'bot' && (
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--accent-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Bot size={18} color="#fff" />
              </div>
            )}

            <div style={{
              background: msg.sender === 'user' ? '#2563eb' : 'rgba(30, 41, 59, 0.8)',
              color: '#ffffff',
              padding: '0.75rem 1rem',
              borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              fontSize: '0.9rem',
              lineHeight: '1.5',
              whiteSpace: 'pre-wrap',
              border: msg.sender === 'bot' ? '1px solid var(--border-color)' : 'none'
            }}>
              {msg.text}
              {msg.streaming && (
                <span style={{
                  display: 'inline-block',
                  width: '6px',
                  height: '14px',
                  background: '#60a5fa',
                  marginLeft: '4px',
                  animation: 'pulse-glow 0.8s infinite'
                }} />
              )}
            </div>

            {msg.sender === 'user' && (
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <User size={18} color="var(--text-muted)" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendQuestion();
        }}
        style={{ display: 'flex', gap: '0.75rem' }}
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask a question about this document..."
          disabled={isStreaming}
          style={{
            flex: 1,
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem',
            color: 'var(--text-main)',
            fontSize: '0.9rem',
            outline: 'none'
          }}
        />
        <button
          type="submit"
          disabled={isStreaming || !inputQuery.trim()}
          className="btn btn-primary"
          style={{ padding: '0.75rem 1.25rem' }}
        >
          <Send size={16} />
          <span>Ask</span>
        </button>
      </form>

    </div>
  );
}
