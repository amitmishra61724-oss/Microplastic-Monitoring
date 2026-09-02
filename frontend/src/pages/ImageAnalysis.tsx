import React from 'react';
import { Upload, AlertCircle } from 'lucide-react';

export const ImageAnalysis: React.FC = () => {
  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div className="card-title">Microscope Sample Image Upload</div>
          <span className="placeholder-badge">Upload Form Interface</span>
        </div>

        <div className="disclaimer-banner" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <div>
            <strong>Phase 0 Notice:</strong> Image processing and particle detection pipelines are disabled until Phase 2 integration.
          </div>
        </div>

        <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '0.5rem', fontWeight: 500 }}>
              Sample Code Identifier
            </label>
            <input 
              type="text" 
              placeholder="e.g. SMP-2026-001" 
              disabled 
              style={{
                width: '100%',
                padding: '0.6rem 1rem',
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '0.5rem',
                color: '#94a3b8'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '0.5rem', fontWeight: 500 }}>
              Sample Water Volume (mL)
            </label>
            <input 
              type="number" 
              placeholder="500.0" 
              disabled 
              style={{
                width: '100%',
                padding: '0.6rem 1rem',
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '0.5rem',
                color: '#94a3b8'
              }}
            />
            <span style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
              Used to calculate concentration (particles/L) = total_particle_count / (volume_ml / 1000)
            </span>
          </div>

          <div>
            <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '0.5rem', fontWeight: 500 }}>
              Microscope Image File
            </label>
            <div className="placeholder-box" style={{ cursor: 'not-allowed' }}>
              <Upload size={32} style={{ margin: '0 auto 0.5rem auto', color: '#64748b' }} />
              <p>Drag and drop optical microscope image here or click to browse</p>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Supports PNG, JPEG, TIFF (Max 20MB)</span>
            </div>
          </div>

          <div>
            <button className="btn btn-primary" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
              Run Particle Detection (Disabled in Phase 0)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
