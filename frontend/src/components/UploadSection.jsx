import { useState, useRef } from 'react';
import { UploadCloud, FileImage, X, User, Calendar, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export function UploadSection({ onUpload }) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [patientData, setPatientData] = useState({ name: '', age: '', gender: 'Male' });
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    if (selectedFile && patientData.name && patientData.age) {
      onUpload(selectedFile, patientData);
    } else {
      alert("Please fill in the patient's name and age before analyzing.");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-panel" 
      style={{ padding: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}
    >
      {/* Left side: Upload Area */}
      <div>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>1. X-Ray Image</h3>
        {!selectedFile ? (
          <div 
            className={`upload-area ${isDragging ? 'drag-active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
            style={{ height: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*"
              onChange={handleFileChange}
            />
            <UploadCloud className="upload-icon" style={{ margin: '0 auto 1rem' }} />
            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Drag & Drop X-ray image</h4>
            <p style={{ color: 'var(--text-secondary)' }}>or click to browse</p>
          </div>
        ) : (
          <div style={{ height: '300px', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px' }}>
              <div style={{ background: 'var(--primary)', padding: '0.75rem', borderRadius: '8px' }}>
                <FileImage size={24} color="white" />
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <p style={{ fontWeight: 500, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{selectedFile.name}</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button 
                onClick={() => setSelectedFile(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.5rem' }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', padding: '1rem' }}>
              Image Ready for Processing
            </div>
          </div>
        )}
      </div>

      {/* Right side: Patient Metadata */}
      <div>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>2. Patient Details</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              <User size={16} /> Full Name
            </label>
            <input 
              type="text" 
              placeholder="e.g. Jane Doe"
              value={patientData.name}
              onChange={(e) => setPatientData({...patientData, name: e.target.value})}
              style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                <Calendar size={16} /> Age
              </label>
              <input 
                type="number" 
                placeholder="Years"
                value={patientData.age}
                onChange={(e) => setPatientData({...patientData, age: e.target.value})}
                style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', outline: 'none' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                <Activity size={16} /> Gender
              </label>
              <select 
                value={patientData.gender}
                onChange={(e) => setPatientData({...patientData, gender: e.target.value})}
                style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', outline: 'none', appearance: 'none' }}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          
          <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
            <button 
              className="btn btn-primary" 
              onClick={handleSubmit}
              disabled={!selectedFile}
              style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
            >
              Analyze X-Ray & Save Patient
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
