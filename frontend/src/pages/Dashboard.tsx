import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Activity,
  Layers,
  Droplet,
  Microscope,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Sparkles,
  PieChart as PieIcon,
  FileText
} from 'lucide-react';
import { apiUrl, assetUrl } from '../config/api';

interface SummaryData {
  total_samples: number;
  total_analyses: number;
  total_particles_detected: number;
  mean_concentration_particles_l: number;
  risk_distribution: {
    LOW: number;
    MODERATE: number;
    HIGH: number;
  };
  particle_type_distribution: Record<string, number>;
  recent_analyses: Array<{
    id: number;
    sample_id: number;
    total_particle_count: number;
    concentration_particles_per_liter: number;
    contamination_level: string;
    image_path: string;
    annotated_image_path?: string;
    created_at: string;
    sample?: {
      sample_code: string;
      location?: string;
      volume_ml: number;
    };
  }>;
}

interface DemoSample {
  name: string;
  display_name: string;
  image_url: string;
  recommended_volume_ml: number;
  ground_truth_particle_count: number;
  ground_truth_concentration_particles_l: number;
  ground_truth_level: string;
}

export const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [demoSamples, setDemoSamples] = useState<DemoSample[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [quickAnalyzing, setQuickAnalyzing] = useState<string | null>(null);

  const fetchDashboardData = () => {
    Promise.all([
      fetch(apiUrl('/api/v1/analytics/summary')).then(r => r.json()),
      fetch(apiUrl('/api/v1/demo/samples')).then(r => r.json())
    ])
      .then(([summaryData, demos]) => {
        setSummary(summaryData);
        setDemoSamples(demos);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load dashboard data:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const runQuickDemo = (demo: DemoSample) => {
    setQuickAnalyzing(demo.name);
    fetch(
      apiUrl(`/api/v1/analysis/analyze-demo?demo_name=${demo.name}&volume_ml=${demo.recommended_volume_ml}`),
      { method: 'POST' }
    )
      .then(res => res.json())
      .then(() => {
        setQuickAnalyzing(null);
        fetchDashboardData();
      })
      .catch(err => {
        console.error('Quick analysis failed:', err);
        setQuickAnalyzing(null);
      });
  };

  const totalRisk = summary
    ? (summary.risk_distribution.LOW || 0) +
      (summary.risk_distribution.MODERATE || 0) +
      (summary.risk_distribution.HIGH || 0)
    : 0;

  return (
    <div>
      {/* Top Banner */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
            Laboratory Surveillance Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Real-time optical microplastic quantification and risk assessment across monitored water sources.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <NavLink to="/analysis" className="btn btn-primary">
            <Microscope size={16} /> Run Full Scan
          </NavLink>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="metrics-grid">
        <div className="metric-card" style={{ '--card-accent': 'var(--cyan-core)' } as React.CSSProperties}>
          <div className="metric-label">
            <Droplet size={16} color="#38bdf8" /> Samples Monitored
          </div>
          <div className="metric-value" style={{ color: '#38bdf8' }}>
            {loading ? '...' : summary?.total_samples ?? 0}
          </div>
          <div className="metric-subtext">Active batch test samples</div>
        </div>

        <div className="metric-card" style={{ '--card-accent': 'var(--emerald-core)' } as React.CSSProperties}>
          <div className="metric-label">
            <Activity size={16} color="#34d399" /> Microplastics Detected
          </div>
          <div className="metric-value" style={{ color: '#34d399' }}>
            {loading ? '...' : summary?.total_particles_detected ?? 0}
          </div>
          <div className="metric-subtext">Classified polymer particles</div>
        </div>

        <div className="metric-card" style={{ '--card-accent': 'var(--amber-core)' } as React.CSSProperties}>
          <div className="metric-label">
            <TrendingUp size={16} color="#fbbf24" /> Mean Concentration
          </div>
          <div className="metric-value" style={{ color: '#fbbf24' }}>
            {loading ? '...' : `${summary?.mean_concentration_particles_l.toFixed(1) ?? '0.0'}`}
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '0.4rem' }}>particles/L</span>
          </div>
          <div className="metric-subtext">Average across completed scans</div>
        </div>

        <div className="metric-card" style={{ '--card-accent': 'var(--rose-core)' } as React.CSSProperties}>
          <div className="metric-label">
            <ShieldAlert size={16} color="#fb7185" /> Critical Alerts (High)
          </div>
          <div className="metric-value" style={{ color: '#fb7185' }}>
            {loading ? '...' : summary?.risk_distribution.HIGH ?? 0}
          </div>
          <div className="metric-subtext">&gt; 50.0 particles/L threshold</div>
        </div>
      </div>

      {/* Two Column Layout: Contamination Risk & Morphology Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        {/* Risk Distribution Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <PieIcon size={18} color="#38bdf8" /> Contamination Level Breakdown
            </div>
            <span className="badge badge-cyan">Provisional Criteria</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '0.5rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                <span style={{ color: '#34d399', fontWeight: 600 }}>Low (&lt; 10 particles/L)</span>
                <span>{summary?.risk_distribution.LOW ?? 0} samples ({totalRisk ? Math.round(((summary?.risk_distribution.LOW || 0) / totalRisk) * 100) : 0}%)</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${totalRisk ? ((summary?.risk_distribution.LOW || 0) / totalRisk) * 100 : 0}%`, height: '100%', background: '#10b981', transition: 'width 0.5s ease' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                <span style={{ color: '#fbbf24', fontWeight: 600 }}>Moderate (10 - 50 particles/L)</span>
                <span>{summary?.risk_distribution.MODERATE ?? 0} samples ({totalRisk ? Math.round(((summary?.risk_distribution.MODERATE || 0) / totalRisk) * 100) : 0}%)</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${totalRisk ? ((summary?.risk_distribution.MODERATE || 0) / totalRisk) * 100 : 0}%`, height: '100%', background: '#f59e0b', transition: 'width 0.5s ease' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                <span style={{ color: '#fb7185', fontWeight: 600 }}>High (&gt; 50 particles/L)</span>
                <span>{summary?.risk_distribution.HIGH ?? 0} samples ({totalRisk ? Math.round(((summary?.risk_distribution.HIGH || 0) / totalRisk) * 100) : 0}%)</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${totalRisk ? ((summary?.risk_distribution.HIGH || 0) / totalRisk) * 100 : 0}%`, height: '100%', background: '#f43f5e', transition: 'width 0.5s ease' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Particle Morphology Breakdown Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Layers size={18} color="#a855f7" /> Particle Morphology Classes
            </div>
            <span className="badge badge-neutral">AI Model Output</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.85rem', marginTop: '0.5rem' }}>
            {[
              { key: 'fiber', label: 'Fibers', color: '#38bdf8', icon: '🧵' },
              { key: 'fragment', label: 'Fragments', color: '#f59e0b', icon: '💎' },
              { key: 'pellet', label: 'Pellets', color: '#10b981', icon: '⚪' },
              { key: 'film', label: 'Films', color: '#c084fc', icon: '📄' },
              { key: 'sphere', label: 'Spheres', color: '#f43f5e', icon: '🔴' }
            ].map(item => (
              <div
                key={item.key}
                style={{
                  background: 'var(--bg-surface)',
                  padding: '0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '1.4rem', marginBottom: '0.2rem' }}>{item.icon}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{item.label}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: item.color, marginTop: '0.25rem' }}>
                  {summary?.particle_type_distribution[item.key] ?? 0}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Instant Demo Benchmark Samples Selector */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <Sparkles size={18} color="#38bdf8" /> Quick Test Benchmark Microscope Samples
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              One-click instant analysis on preloaded high-resolution optical microscope water samples.
            </p>
          </div>
          <span className="badge badge-cyan">Demo Library</span>
        </div>

        <div className="demo-chips-grid">
          {demoSamples.map(demo => (
            <div
              key={demo.name}
              className="demo-chip-card"
              onClick={() => !quickAnalyzing && runQuickDemo(demo)}
              style={{ cursor: quickAnalyzing ? 'wait' : 'pointer' }}
            >
              <img
                src={assetUrl(demo.image_url)}
                alt={demo.display_name}
                className="demo-chip-thumb"
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {demo.display_name}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.3rem' }}>
                  <span className={`badge badge-${demo.ground_truth_level.toLowerCase()}`}>
                    {demo.ground_truth_level}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    ~{demo.ground_truth_particle_count} particles
                  </span>
                </div>
              </div>
              <button
                className="btn btn-secondary"
                disabled={quickAnalyzing === demo.name}
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem' }}
              >
                {quickAnalyzing === demo.name ? 'Scanning...' : 'Test'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Analysis Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <FileText size={18} color="#38bdf8" /> Recent Analysis Scans
          </div>
          <NavLink to="/history" className="btn btn-secondary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}>
            View Full Log <ArrowRight size={14} />
          </NavLink>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Scan ID</th>
                <th>Sample Identifier</th>
                <th>Particle Count</th>
                <th>Concentration (particles/L)</th>
                <th>Contamination Level</th>
                <th>Processed At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {summary?.recent_analyses && summary.recent_analyses.length > 0 ? (
                summary.recent_analyses.map(rec => (
                  <tr key={rec.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>#{rec.id}</td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{rec.sample?.sample_code ?? `SMP-${rec.sample_id}`}</span>
                      {rec.sample?.location && (
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {rec.sample.location}
                        </span>
                      )}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--cyan-soft)' }}>{rec.total_particle_count} particles</td>
                    <td style={{ fontWeight: 700 }}>{rec.concentration_particles_per_liter.toFixed(2)}</td>
                    <td>
                      <span className={`badge badge-${rec.contamination_level?.toLowerCase() ?? 'neutral'}`}>
                        {rec.contamination_level ?? 'UNSPECIFIED'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      {new Date(rec.created_at).toLocaleDateString()} {new Date(rec.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>
                      <NavLink
                        to="/history"
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                      >
                        Inspect
                      </NavLink>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No sample analyses recorded yet. Click one of the benchmark samples above or upload an image in Microscope Analysis.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
