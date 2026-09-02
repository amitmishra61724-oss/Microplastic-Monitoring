import React, { useEffect, useState } from 'react';
import { AlertTriangle, Server, Database, BrainCircuit } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<string>('Checking...');
  const [provisionalThresholds, setProvisionalThresholds] = useState<{ low: number; high: number } | null>(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/v1/health')
      .then(res => res.json())
      .then(data => {
        setHealthStatus(data.status);
        if (data.provisional_thresholds) {
          setProvisionalThresholds({
            low: data.provisional_thresholds.low,
            high: data.provisional_thresholds.high
          });
        }
      })
      .catch(() => setHealthStatus('Offline / Container starting...'));
  }, []);

  return (
    <div>
      <div className="disclaimer-banner">
        <AlertTriangle size={20} style={{ flexShrink: 0 }} />
        <div>
          <strong>Phase 0 Architecture Notice:</strong> The AI model detection engine and trained computer vision pipeline are <em>not yet integrated</em>. All metrics, thresholds, and calculations below reflect system architecture stubs.
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">System Status Overview</div>
          <span className="placeholder-badge">Infrastructure</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>
              <Server size={16} /> Backend API Status
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '0.5rem', color: healthStatus === 'healthy' ? '#34d399' : '#f87171' }}>
              {healthStatus}
            </div>
          </div>

          <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>
              <Database size={16} /> Database Target
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '0.5rem' }}>
              PostgreSQL 16
            </div>
          </div>

          <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>
              <BrainCircuit size={16} /> AI Detection Model
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '0.5rem', color: '#fbbf24' }}>
              Not Integrated (Phase 2)
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Provisional Classification Thresholds</div>
          <span className="placeholder-badge">Configuration</span>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Threshold settings configured in backend environment variables. These are unvalidated placeholder values.
        </p>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <div>
            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>LOW_CONCENTRATION_THRESHOLD:</span>
            <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{provisionalThresholds?.low ?? '10.0'} particles/L</div>
          </div>
          <div>
            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>HIGH_CONCENTRATION_THRESHOLD:</span>
            <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{provisionalThresholds?.high ?? '50.0'} particles/L</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Recent Analysis Workspace</div>
          <span className="placeholder-badge">Placeholder</span>
        </div>
        <div className="placeholder-box">
          <p>No sample analysis records created yet.</p>
          <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Analysis result tracking will populate here in future phases.</p>
        </div>
      </div>
    </div>
  );
};
