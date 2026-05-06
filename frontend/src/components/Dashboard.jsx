import { useState } from 'react';
import { ChevronLeft, Maximize2, AlertTriangle, Layers, Brain, Search, User } from 'lucide-react';
import { motion } from 'framer-motion';

export function Dashboard({ originalImage, result, isLoading, onReset }) {
  const [showHeatmap, setShowHeatmap] = useState(true);

  if (isLoading) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Analyzing X-Ray</h3>
        <p style={{ color: 'var(--text-secondary)' }}>Extracting features via EfficientNet-V2...</p>
      </div>
    );
  }

  if (!result) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="dashboard-grid"
    >
      {/* Left Column: Image Viewer */}
      <div className="main-view glass-panel">
        <div className="controls-bar" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <button className="btn btn-secondary" onClick={onReset} style={{ padding: '0.5rem 1rem' }}>
            <ChevronLeft size={18} /> New Scan
          </button>
          
          <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.25rem', borderRadius: '8px' }}>
            <button 
              onClick={() => setShowHeatmap(false)}
              style={{ 
                padding: '0.5rem 1rem', 
                borderRadius: '6px', 
                border: 'none',
                background: !showHeatmap ? 'var(--primary)' : 'transparent',
                color: !showHeatmap ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Original
            </button>
            <button 
              onClick={() => setShowHeatmap(true)}
              style={{ 
                padding: '0.5rem 1rem', 
                borderRadius: '6px', 
                border: 'none',
                background: showHeatmap ? 'var(--accent)' : 'transparent',
                color: showHeatmap ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Layers size={16} /> Grad-CAM
            </button>
          </div>
          
          <button className="btn btn-secondary" style={{ padding: '0.5rem', borderRadius: '8px' }}>
            <Maximize2 size={18} />
          </button>
        </div>
        
        <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="image-container">
            <img src={originalImage} alt="Original X-Ray" className="xray-image" />
            
            {/* Actual AI Heatmap Overlay */}
            {result.heatmapUrl && (
              <img 
                src={result.heatmapUrl} 
                alt="AI Grad-CAM Heatmap"
                className={`heatmap-overlay ${showHeatmap ? 'visible' : ''}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  opacity: showHeatmap ? 1 : 0,
                  transition: 'opacity 0.3s ease-in-out',
                  zIndex: 2
                }}
              />
            )}
            
            {!showHeatmap && (
              <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', background: 'rgba(0,0,0,0.6)', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.8rem', backdropFilter: 'blur(4px)' }}>
                Original DICOM
              </div>
            )}
            {showHeatmap && (
              <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.8), rgba(59, 130, 246, 0.8))', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.8rem', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Brain size={14} /> AI Attention Map
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Insights Panel */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyItems: 'center', padding: '10px' }}>
             <User size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{result.patientName || "Patient"}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>ID: {result.patientId}</p>
          </div>
        </div>
        
        <div className="info-section" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), transparent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', marginBottom: '0.5rem' }}>
            <AlertTriangle size={20} />
            <h3 style={{ margin: 0, fontSize: '1rem' }}>Primary Finding</h3>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <h2 style={{ fontSize: '2rem', margin: 0, color: '#fff' }}>{result.disease}</h2>
            <span style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--danger)' }}>
              {(result.confidence * 100).toFixed(1)}%
            </span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${result.confidence * 100}%` }}></div>
          </div>
        </div>
        
        <div className="info-section">
          <h4 style={{ color: 'var(--text-secondary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Brain size={16} /> Clinical Observations
          </h4>
          <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {result.observations.map((obs, i) => (
              <li key={i} style={{ fontSize: '0.95rem' }}>{obs}</li>
            ))}
          </ul>
        </div>
        
        <div className="info-section" style={{ flex: 1, borderBottom: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Search size={16} /> Similar NIH Cases
            </h4>
            <span style={{ fontSize: '0.75rem', background: 'rgba(59, 130, 246, 0.2)', color: 'var(--primary)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
              Cosine Similarity
            </span>
          </div>
          
          <div className="similar-images-grid">
            {result.similarCases.map((caseItem, i) => (
              <div key={i} className="similar-image-card">
                <img src={caseItem.img} alt={`Similar case ${caseItem.id}`} />
                <div className="similarity-score" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span>{(caseItem.score * 100).toFixed(1)}% Match</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--danger)', fontWeight: 500 }}>
                    Severity: {(caseItem.severityScore * 100).toFixed(1)}%
                  </span>
                </div>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '0.25rem', background: 'linear-gradient(to bottom, rgba(0,0,0,0.9), transparent)', fontSize: '0.7rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{caseItem.id}</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{caseItem.knownDisease}</span>
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-secondary" style={{ width: '100%', marginTop: '1rem', fontSize: '0.875rem' }}>
            View Full Database Comparison
          </button>
        </div>
      </div>
    </motion.div>
  );
}
