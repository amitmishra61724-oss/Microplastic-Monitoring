import React from 'react';
import { Layers, ShieldCheck, Cpu } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div className="card-title">About AI-Based Microplastic Monitoring System</div>
          <span className="placeholder-badge">Project Specification</span>
        </div>

        <p style={{ color: '#cbd5e1', marginBottom: '1rem', lineHeight: '1.7' }}>
          This full-stack application automates the detection, counting, concentration estimation, and classification of microplastic particles in water samples using microscope imaging and AI-driven computer vision.
        </p>

        <h3 style={{ fontSize: '1rem', color: '#38bdf8', marginTop: '1.5rem', marginBottom: '0.75rem' }}>
          System Processing Pipeline
        </h3>
        <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #334155', fontFamily: 'monospace', fontSize: '0.85rem', color: '#94a3b8' }}>
          Microscope Image → Upload → Image Preprocessing → AI Detection → Particle Counting → Concentration (particles/L) → Contamination Classification → Database → Dashboard
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Cpu size={18} color="#38bdf8" /> Technology Architecture
            </div>
          </div>
          <ul style={{ paddingLeft: '1.25rem', color: '#94a3b8', fontSize: '0.875rem', lineHeight: '1.7' }}>
            <li><strong>Backend:</strong> Python, FastAPI, SQLAlchemy</li>
            <li><strong>Frontend:</strong> React 18, TypeScript, Vite</li>
            <li><strong>Database:</strong> PostgreSQL 16</li>
            <li><strong>Containerization:</strong> Docker & Docker Compose</li>
            <li><strong>Machine Learning Target:</strong> PyTorch / Ultralytics YOLO</li>
          </ul>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={18} color="#38bdf8" /> SEPM & FDS Principles
            </div>
          </div>
          <ul style={{ paddingLeft: '1.25rem', color: '#94a3b8', fontSize: '0.875rem', lineHeight: '1.7' }}>
            <li>Decoupled modular architecture</li>
            <li>Strict Pydantic domain schema validations</li>
            <li>Calculated concentration formula in particles/L</li>
            <li>Configurable provisional thresholds in environment settings</li>
          </ul>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} color="#38bdf8" /> Scientific Standard Notice
            </div>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: '1.7' }}>
            Threshold levels (<code>LOW_CONCENTRATION_THRESHOLD</code> and <code>HIGH_CONCENTRATION_THRESHOLD</code>) are unvalidated configuration settings. Official regulatory thresholds will be integrated in future phases upon selecting reference scientific standards.
          </p>
        </div>
      </div>
    </div>
  );
};
