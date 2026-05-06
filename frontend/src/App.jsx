import { useState } from 'react';
import { UploadSection } from './components/UploadSection';
import { Dashboard } from './components/Dashboard';
import { PatientHistory } from './components/PatientHistory';
import { ModelSettings } from './components/ModelSettings';
import { Activity } from 'lucide-react';
import './index.css';

function App() {
  const [currentView, setCurrentView] = useState('new_analysis'); // 'new_analysis', 'history', 'settings'
  const [analysisResult, setAnalysisResult] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpload = async (file, patientData) => {
    setIsLoading(true);
    const objectUrl = URL.createObjectURL(file);
    setOriginalImage(objectUrl);

    try {
      const formData = new FormData();
      formData.append('file', file);
      // Append patient metadata
      formData.append('patient_name', patientData.name);
      formData.append('patient_age', patientData.age);
      formData.append('patient_gender', patientData.gender);
      
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      
      setAnalysisResult({
        disease: data.disease,
        confidence: data.confidence,
        heatmapUrl: data.heatmap ? `data:image/png;base64,${data.heatmap}` : null,
        patientName: patientData.name,
        patientId: "PT-" + Math.floor(Math.random() * 100000),
        similarCases: data.similar_cases.map(c => ({
          id: c.id,
          score: c.score,
          severityScore: c.severity_score,
          knownDisease: c.known_disease,
          img: c.id.includes('.png') ? `${API_URL}/images/${c.id}` : `https://via.placeholder.com/150/1a1e23/3b82f6?text=${c.id}`
        })),
        observations: data.observations
      });
    } catch (error) {
      console.error("Error analyzing image:", error);
      alert("Failed to connect to the backend. Make sure the FastAPI server is running on port 8000.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setOriginalImage(null);
  };

  const renderMainContent = () => {
    if (currentView === 'history') {
      return <PatientHistory />;
    }
    if (currentView === 'settings') {
      return <ModelSettings />;
    }
    
    // new_analysis view
    if (!originalImage) {
      return (
        <div style={{ maxWidth: '1000px', margin: '4rem auto 0' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
            New Analysis
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '3rem' }}>
            Upload a Chest X-Ray and enter patient details. The EfficientNet-V2 model will generate an AI Attention Map.
          </p>
          <UploadSection onUpload={handleUpload} />
        </div>
      );
    } else {
      return (
        <Dashboard 
          originalImage={originalImage} 
          result={analysisResult} 
          isLoading={isLoading} 
          onReset={handleReset} 
        />
      );
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: 'var(--primary)', padding: '0.5rem', borderRadius: '8px', color: '#fff' }}>
            <Activity size={24} />
          </div>
          <h2 style={{ fontSize: '1.25rem', letterSpacing: '-0.02em' }}>Radiosight<span style={{color: 'var(--primary)'}}>.ai</span></h2>
        </div>
        
        <div style={{ flex: 1, padding: '1.5rem' }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Menu</h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li 
              onClick={() => { setCurrentView('new_analysis'); handleReset(); }}
              style={{ background: currentView === 'new_analysis' ? 'rgba(255,255,255,0.05)' : 'transparent', padding: '0.75rem 1rem', borderRadius: '8px', cursor: 'pointer', color: currentView === 'new_analysis' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: currentView === 'new_analysis' ? 500 : 400 }}
            >
              New Analysis
            </li>
            <li 
              onClick={() => setCurrentView('history')}
              style={{ background: currentView === 'history' ? 'rgba(255,255,255,0.05)' : 'transparent', padding: '0.75rem 1rem', borderRadius: '8px', cursor: 'pointer', color: currentView === 'history' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: currentView === 'history' ? 500 : 400 }}
            >
              Patient History
            </li>
            <li 
              onClick={() => setCurrentView('settings')}
              style={{ background: currentView === 'settings' ? 'rgba(255,255,255,0.05)' : 'transparent', padding: '0.75rem 1rem', borderRadius: '8px', cursor: 'pointer', color: currentView === 'settings' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: currentView === 'settings' ? 500 : 400 }}
            >
              Model Settings
            </li>
          </ul>
        </div>
        
        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>Dr</div>
            <div>
              <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>Dr. Smith</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Pulmonologist</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {renderMainContent()}
      </main>
    </div>
  );
}

export default App;
