import React, { useState, useRef } from 'react';
import { Upload, FileText, Camera, Image as ImageIcon, Sparkles, CheckCircle, Zap, Loader2 } from 'lucide-react';
import { SAMPLE_DOCUMENTS } from './SampleDocs';
import { renderPdfFirstPage } from '../services/pdf';

export default function DocumentUploader({ selectedImage, onSelectImage, onAnalyze, isAnalyzing }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedSampleId, setSelectedSampleId] = useState(null);
  const [isConvertingPdf, setIsConvertingPdf] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (file) => {
    if (!file) return;

    // Handle PDF files
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      try {
        setIsConvertingPdf(true);
        const pageImage = await renderPdfFirstPage(file);
        onSelectImage(pageImage);
        setSelectedSampleId(null);
      } catch (err) {
        alert('Could not read PDF: ' + (err.message || 'Please upload a valid PDF or image.'));
      } finally {
        setIsConvertingPdf(false);
      }
      return;
    }

    // Handle standard images
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WEBP) or a PDF document.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      onSelectImage(e.target.result);
      setSelectedSampleId(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSampleClick = (sample) => {
    setSelectedSampleId(sample.id);
    onSelectImage(sample.image);
  };

  return (
    <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Upload size={20} color="var(--accent-primary)" />
            Step 1: Upload or Select Document
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Upload any paper bill, medical prescription, tax notice, or select a sample document for instant evaluation.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedImage ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
        
        {/* Dropzone Container */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: dragActive ? '2px dashed #3b82f6' : '2px dashed rgba(255, 255, 255, 0.15)',
            borderRadius: 'var(--radius-md)',
            padding: '2.5rem 1.5rem',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragActive ? 'rgba(59, 130, 246, 0.08)' : 'rgba(15, 23, 42, 0.4)',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '220px'
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf,.pdf"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
          />
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            background: 'rgba(59, 130, 246, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
            color: 'var(--accent-primary)'
          }}>
            {isConvertingPdf ? <Loader2 size={26} className="spin" /> : <ImageIcon size={26} />}
          </div>
          <p style={{ fontWeight: '600', fontSize: '1rem', marginBottom: '0.35rem' }}>
            {isConvertingPdf ? 'Rendering PDF page 1...' : <>Drop document (Image or PDF) here or <span style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>browse</span></>}
          </p>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>
            Supports PDF, PNG, JPG, WEBP &amp; scanned paper photos
          </p>
        </div>

        {/* Selected Image Preview Box */}
        {selectedImage && (
          <div style={{
            position: 'relative',
            background: 'rgba(0, 0, 0, 0.4)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            maxHeight: '300px',
            overflow: 'hidden'
          }}>
            <img
              src={selectedImage}
              alt="Uploaded document preview"
              style={{
                maxWidth: '100%',
                maxHeight: '220px',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-sm)'
              }}
            />
            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.75rem', width: '100%', justifyContent: 'center' }}>
              <button
                onClick={onAnalyze}
                disabled={isAnalyzing}
                className="btn btn-primary"
                style={{ width: '100%', maxWidth: '280px' }}
              >
                {isAnalyzing ? (
                  <>
                    <Zap size={18} className="spinner" />
                    <span>Analyzing &amp; Verifying...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Analyze Document Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Preset Sample Documents Cards for One-Click Hackathon Demo */}
      <div style={{ marginTop: '1.75rem' }}>
        <p style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Zap size={14} color="#f59e0b" />
          Quick Test with Sample Documents (Instant 1-Click Load):
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem' }}>
          {SAMPLE_DOCUMENTS.map((sample) => {
            const isSelected = selectedSampleId === sample.id;
            return (
              <div
                key={sample.id}
                onClick={() => handleSampleClick(sample)}
                style={{
                  background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'rgba(15, 23, 42, 0.5)',
                  border: isSelected ? '1.5px solid #3b82f6' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem'
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: isSelected ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <FileText size={20} color={isSelected ? '#fff' : 'var(--text-muted)'} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {sample.title}
                    </h4>
                    {isSelected && <CheckCircle size={15} color="#3b82f6" />}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {sample.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
