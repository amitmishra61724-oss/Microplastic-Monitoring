import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Eye,
  Trash2,
  FileSpreadsheet,
  FileJson,
  X,
  Microscope
} from 'lucide-react';
import { apiUrl, assetUrl } from '../config/api';

interface ParticleRecord {
  id?: number;
  particle_type: string;
  size_um: number;
  confidence: number;
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
}

interface AnalysisRecord {
  id: number;
  sample_id: number;
  total_particle_count: number;
  concentration_particles_per_liter: number;
  contamination_level: string;
  image_path: string;
  annotated_image_path?: string;
  created_at: string;
  particles: ParticleRecord[];
  sample?: {
    sample_code: string;
    volume_ml: number;
    location?: string;
    notes?: string;
  };
}

export const AnalysisHistory: React.FC = () => {
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inspectRecord, setInspectRecord] = useState<AnalysisRecord | null>(null);

  const fetchAnalyses = () => {
    const endpoint = filterLevel !== 'ALL'
      ? `/api/v1/analysis?contamination_level=${filterLevel}`
      : '/api/v1/analysis';

    fetch(apiUrl(endpoint))
      .then(res => res.json())
      .then(data => {
        setAnalyses(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load analysis history:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAnalyses();
  }, [filterLevel]);

  const handleDelete = (id: number) => {
    if (!window.confirm(`Are you sure you want to delete analysis scan #${id}?`)) return;

    fetch(apiUrl(`/api/v1/analysis/${id}`), { method: 'DELETE' })
      .then(res => {
        if (res.ok) {
          if (inspectRecord?.id === id) setInspectRecord(null);
          fetchAnalyses();
        }
      })
      .catch(err => console.error('Failed to delete analysis:', err));
  };

  const downloadReport = (id: number, format: 'json' | 'csv') => {
    window.open(apiUrl(`/api/v1/analysis/${id}/report?format=${format}`), '_blank');
  };

  const filteredAnalyses = analyses.filter(a => {
    const code = a.sample?.sample_code || `SMP-${a.sample_id}`;
    const loc = a.sample?.location || '';
    const q = searchQuery.toLowerCase();
    return code.toLowerCase().includes(q) || loc.toLowerCase().includes(q) || a.id.toString().includes(q);
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
            Historical Analysis Log
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Comprehensive audit archive of microplastic scans, particle coordinates, and regulatory compliance records.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '240px' }}>
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              className="form-control"
              placeholder="Search by Scan ID, sample code, or location..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', padding: '0.3rem 0' }}
            />
          </div>

          {/* Level Filter Tabs */}
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {['ALL', 'LOW', 'MODERATE', 'HIGH'].map(lvl => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className={`btn ${filterLevel === lvl ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Historical Analyses Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <History size={18} color="#38bdf8" /> Completed Sample Analyses ({filteredAnalyses.length})
          </div>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Scan ID</th>
                <th>Sample Identifier</th>
                <th>Water Volume</th>
                <th>Particles Detected</th>
                <th>Concentration (particles/L)</th>
                <th>Risk Level</th>
                <th>Scan Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Loading historical scans...
                  </td>
                </tr>
              ) : filteredAnalyses.length > 0 ? (
                filteredAnalyses.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>#{a.id}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--cyan-soft)' }}>
                        {a.sample?.sample_code ?? `SMP-${a.sample_id}`}
                      </span>
                      {a.sample?.location && (
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {a.sample.location}
                        </span>
                      )}
                    </td>
                    <td>{a.sample?.volume_ml ? `${a.sample.volume_ml.toFixed(0)} mL` : '500 mL'}</td>
                    <td style={{ fontWeight: 700 }}>{a.total_particle_count}</td>
                    <td style={{ fontWeight: 700, color: '#fbbf24' }}>
                      {a.concentration_particles_per_liter.toFixed(1)}
                    </td>
                    <td>
                      <span className={`badge badge-${a.contamination_level?.toLowerCase() ?? 'neutral'}`}>
                        {a.contamination_level}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      {new Date(a.created_at).toLocaleDateString()} {new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          onClick={() => setInspectRecord(a)}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.65rem' }}
                          title="Inspect AI Detection Viewer"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => downloadReport(a.id, 'csv')}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.65rem' }}
                          title="Download CSV"
                        >
                          <FileSpreadsheet size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(a.id)}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', color: '#f87171' }}
                          title="Delete Scan"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No analysis scans match the current filters. Run an analysis scan or change filter settings.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Detail Modal */}
      {inspectRecord && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '2rem'
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              border: '1px solid var(--border-glow)'
            }}
          >
            <div className="card-header">
              <div>
                <div className="card-title">
                  <Microscope size={18} color="#38bdf8" /> Analysis Inspection — Scan #{inspectRecord.id}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Sample: {inspectRecord.sample?.sample_code} • {new Date(inspectRecord.created_at).toLocaleString()}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  onClick={() => downloadReport(inspectRecord.id, 'csv')}
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                >
                  <FileSpreadsheet size={14} /> CSV
                </button>
                <button
                  onClick={() => downloadReport(inspectRecord.id, 'json')}
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                >
                  <FileJson size={14} /> JSON
                </button>
                <button
                  type="button"
                  onClick={() => setInspectRecord(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem', marginLeft: '0.5rem' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Particles</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--cyan-soft)' }}>{inspectRecord.total_particle_count}</div>
              </div>
              <div style={{ background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Concentration</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24' }}>
                  {inspectRecord.concentration_particles_per_liter.toFixed(1)} <span style={{ fontSize: '0.7rem' }}>p/L</span>
                </div>
              </div>
              <div style={{ background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Classification</span>
                <div style={{ marginTop: '0.2rem' }}>
                  <span className={`badge badge-${inspectRecord.contamination_level.toLowerCase()}`}>
                    {inspectRecord.contamination_level}
                  </span>
                </div>
              </div>
            </div>

            {/* Annotated Image View */}
            <div
              style={{
                background: '#040711',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                textAlign: 'center',
                marginBottom: '1.25rem',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <img
                src={
                  inspectRecord.annotated_image_path
                    ? assetUrl(inspectRecord.annotated_image_path)
                    : assetUrl(inspectRecord.image_path)
                }
                alt="Annotated detection preview"
                style={{ maxHeight: '420px', maxWidth: '100%', objectFit: 'contain' }}
              />
            </div>

            {/* Granular Particles Table */}
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              Detected Particles ({inspectRecord.particles.length})
            </div>
            <div className="data-table-container" style={{ maxHeight: '200px', overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Type</th>
                    <th>Size (µm)</th>
                    <th>Confidence</th>
                    <th>Bounding Box</th>
                  </tr>
                </thead>
                <tbody>
                  {inspectRecord.particles.map((p, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td>
                        <span className="badge badge-cyan">{p.particle_type}</span>
                      </td>
                      <td>{p.size_um?.toFixed(1) ?? '—'} µm</td>
                      <td>{Math.round(p.confidence * 100)}%</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        [{Math.round(p.x_min)}, {Math.round(p.y_min)}, {Math.round(p.x_max)}, {Math.round(p.y_max)}]
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
