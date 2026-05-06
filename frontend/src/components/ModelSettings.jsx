import { motion } from 'framer-motion';
import { Settings, Sliders, Database, ShieldAlert, Cpu } from 'lucide-react';

export function ModelSettings() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-panel"
      style={{ margin: '2rem', padding: '2rem', maxWidth: '800px', marginLeft: 'auto', marginRight: 'auto' }}
    >
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Settings size={28} color="var(--primary)" /> Model Settings
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Configure EfficientNet-V2 inference parameters and similarity thresholds.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Threshold Setting */}
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}><ShieldAlert size={20} color="var(--accent)" /> Confidence Threshold</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Minimum probability required to flag a positive disease finding.</p>
            </div>
            <span style={{ background: 'var(--primary)', padding: '0.25rem 0.75rem', borderRadius: '20px', fontWeight: 'bold' }}>0.50 (Default)</span>
          </div>
          <input type="range" min="0" max="1" step="0.05" defaultValue="0.5" style={{ width: '100%', accentColor: 'var(--primary)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            <span>0.0 (High Recall)</span>
            <span>1.0 (High Precision)</span>
          </div>
        </div>

        {/* Similarity DB Setting */}
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}><Database size={20} color="var(--success)" /> Similarity Search Database</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Select which database of pre-computed embeddings to use for nearest neighbor matching.</p>
            </div>
          </div>
          <select style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', outline: 'none' }}>
            <option value="nih_full">NIH Chest X-ray 14 (Full 112k Set)</option>
            <option value="nih_sample">NIH Chest X-ray Sample (5.6k Set)</option>
            <option value="custom">Local Clinic Database</option>
          </select>
        </div>

        {/* Grad-CAM Layer */}
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}><Sliders size={20} color="#f59e0b" /> Grad-CAM Target Layer</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Adjust which convolutional block is used for explainability heatmaps.</p>
            </div>
          </div>
          <select style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', outline: 'none' }}>
            <option value="features[-1]">features[-1] (Default - Highest Semantic Detail)</option>
            <option value="features[-2]">features[-2] (Broader Activation)</option>
            <option value="features[-4]">features[-4] (Low-level Textures)</option>
          </select>
        </div>
        
        <button className="btn btn-primary" style={{ marginTop: '1rem', padding: '1rem' }}>
          <Cpu size={20} /> Save Model Configuration
        </button>

      </div>
    </motion.div>
  );
}
