import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, User, FileText, Search, Activity } from 'lucide-react';

export function PatientHistory() {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    fetch(`${API_URL}/history`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setHistory(data);
        } else {
          setHistory([]);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to load history:", err);
        setIsLoading(false);
      });
  }, []);

  const filteredHistory = history.filter(h => 
    h.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    h.disease.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-panel"
      style={{ margin: '2rem', padding: '2rem', height: 'calc(100vh - 4rem)', display: 'flex', flexDirection: 'column' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Clock size={28} color="var(--primary)" /> Patient History Database
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Review past X-ray analyses and EfficientNet-V2 predictions.</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', width: '300px' }}>
          <Search size={18} color="var(--text-secondary)" />
          <input 
            type="text" 
            placeholder="Search name or disease..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', paddingLeft: '0.5rem', width: '100%' }}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="loader-container">
          <div className="spinner"></div>
          <p>Loading patient records from MongoDB...</p>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '1rem', fontWeight: 500 }}>Patient Details</th>
                <th style={{ padding: '1rem', fontWeight: 500 }}>Date</th>
                <th style={{ padding: '1rem', fontWeight: 500 }}>AI Prediction</th>
                <th style={{ padding: '1rem', fontWeight: 500 }}>Confidence</th>
                <th style={{ padding: '1rem', fontWeight: 500 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((record) => (
                <tr key={record.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s', cursor: 'pointer' }} className="hover-row">
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={20} />
                      </div>
                      <div>
                        <p style={{ fontWeight: 600 }}>{record.name}</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{record.age} yrs • {record.gender}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{record.date}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      background: record.disease === 'No Finding' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: record.disease === 'No Finding' ? 'var(--success)' : 'var(--danger)',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.875rem',
                      fontWeight: 500
                    }}>
                      {record.disease}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Activity size={16} color="var(--primary)" />
                      {(record.confidence * 100).toFixed(1)}%
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <button 
                      className="btn btn-secondary" 
                      onClick={(e) => { e.stopPropagation(); setSelectedReport(record); }}
                      style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                    >
                      <FileText size={16} /> View Report
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredHistory.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              No patient records found matching your search.
            </div>
          )}
        </div>
      )}

      {selectedReport && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ width: '500px', padding: '2.5rem', position: 'relative' }}>
            <button 
              onClick={() => setSelectedReport(null)} 
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%' }}
            >
              ✕
            </button>
            
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              Radiology AI Report
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Patient Name</p>
                <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>{selectedReport.name}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Patient ID</p>
                <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>{selectedReport.patient_id}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Age & Gender</p>
                <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>{selectedReport.age} yrs • {selectedReport.gender}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Scan Date</p>
                <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>{selectedReport.date}</p>
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>AI Diagnosis</p>
              <h3 style={{ fontSize: '1.8rem', color: selectedReport.disease === 'No Finding (Normal)' ? 'var(--success)' : 'var(--danger)', marginBottom: '0.5rem' }}>
                {selectedReport.disease}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '20px', display: 'inline-flex' }}>
                <Activity size={16} color="var(--primary)" />
                <span style={{ fontWeight: 'bold' }}>{(selectedReport.confidence * 100).toFixed(1)}% Confidence</span>
              </div>
            </div>
            
            <button className="btn btn-primary" onClick={() => setSelectedReport(null)} style={{ width: '100%', marginTop: '2rem', padding: '1rem' }}>
              Close Report
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
