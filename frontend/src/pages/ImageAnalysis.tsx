import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Eye,
  Microscope,
  FileSpreadsheet,
  FileJson,
  RefreshCw
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

interface AnalysisResultData {
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

interface DemoSample {
  name: string;
  display_name: string;
  image_url: string;
  recommended_volume_ml: number;
  ground_truth_particle_count: number;
  ground_truth_concentration_particles_l: number;
  ground_truth_level: string;
}

export const ImageAnalysis: React.FC = () => {
  // Form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedDemoName, setSelectedDemoName] = useState<string | null>(null);
  const [sampleCode, setSampleCode] = useState<string>('SMP-2026-001');
  const [volumeMl, setVolumeMl] = useState<number>(500.0);
  const [location, setLocation] = useState<string>('Station Alpha - Water Intake');
  const [magnification, setMagnification] = useState<string>('10x');
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.50);
  const [notes, setNotes] = useState<string>('');

  // Processing state
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStage, setScanStage] = useState<string>('');
  const [result, setResult] = useState<AnalysisResultData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'annotated' | 'original'>('annotated');
  const [highlightedParticleIdx, setHighlightedParticleIdx] = useState<number | null>(null);

  // Preloaded demos
  const [demos, setDemos] = useState<DemoSample[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(apiUrl('/api/v1/demo/samples'))
      .then(res => res.json())
      .then(data => setDemos(data))
      .catch(err => console.error('Failed to load demo samples:', err));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setSelectedDemoName(null);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setErrorMsg(null);
    }
  };

  const handleSelectDemo = (demo: DemoSample) => {
    setSelectedDemoName(demo.name);
    setSelectedFile(null);
    setPreviewUrl(assetUrl(demo.image_url));
    setSampleCode(`SMP-${demo.name.toUpperCase().replace('DEMO_', '')}`);
    setVolumeMl(demo.recommended_volume_ml);
    setLocation(demo.display_name);
    setResult(null);
    setErrorMsg(null);
  };

  const handleRunAnalysis = async () => {
    if (!selectedFile && !selectedDemoName) {
      setErrorMsg('Please select a microscope image file or choose a pre-loaded benchmark sample.');
      return;
    }

    setIsScanning(true);
    setErrorMsg(null);
    setScanStage('Initializing computer vision pipeline...');

    try {
      setTimeout(() => setScanStage('Executing CLAHE contrast & bilateral denoising...'), 600);
      setTimeout(() => setScanStage('Segmenting particle contours & morphological analysis...'), 1200);
      setTimeout(() => setScanStage('Classifying polymer types & computing concentration...'), 1800);

      let response;
      if (selectedDemoName) {
        // Run demo analysis endpoint
        response = await fetch(
          apiUrl(`/api/v1/analysis/analyze-demo?demo_name=${selectedDemoName}&sample_code=${sampleCode}&volume_ml=${volumeMl}&optical_magnification=${magnification}&confidence_threshold=${confidenceThreshold}`),
          { method: 'POST' }
        );
      } else if (selectedFile) {
        // Upload multipart form
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('sample_code', sampleCode);
        formData.append('volume_ml', volumeMl.toString());
        if (location) formData.append('location', location);
        if (notes) formData.append('notes', notes);
        formData.append('optical_magnification', magnification);
        formData.append('confidence_threshold', confidenceThreshold.toString());

        response = await fetch(apiUrl('/api/v1/analysis/upload'), {
          method: 'POST',
          body: formData
        });
      }

      if (!response || !response.ok) {
        const errData = await response?.json().catch(() => ({}));
        throw new Error(errData.detail || 'Analysis pipeline returned an error.');
      }

      const resData = await response.json();
      setResult(resData);
      setViewMode('annotated');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred during AI analysis.');
    } finally {
      setIsScanning(false);
      setScanStage('');
    }
  };

  const downloadReport = (format: 'json' | 'csv') => {
    if (!result) return;
    window.open(apiUrl(`/api/v1/analysis/${result.id}/report?format=${format}`), '_blank');
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
          Microscope Image Ingestion & AI Detection
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
          Upload optical microscopy water sample imagery to localize microplastic particles, measure micrometer dimensions, and compute contamination concentration.
        </p>
      </div>

      {errorMsg && (
        <div className="disclaimer-banner" style={{ background: 'rgba(244, 63, 94, 0.1)', borderColor: 'rgba(244, 63, 94, 0.4)', color: '#fb7185' }}>
          <AlertTriangle size={20} />
          <div>{errorMsg}</div>
        </div>
      )}

      {/* Main Analysis Workflow Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 420px) 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* Left Column: Input Form & Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Preset Demos Selector */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div className="card-header" style={{ marginBottom: '0.75rem' }}>
              <div className="card-title" style={{ fontSize: '0.95rem' }}>
                <Sparkles size={16} color="#38bdf8" /> Benchmark Microscope Samples
              </div>
              <span className="badge badge-cyan">1-Click Test</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              No image file on hand? Select a pre-loaded optical microscope capture:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {demos.map(d => (
                <button
                  key={d.name}
                  type="button"
                  onClick={() => handleSelectDemo(d)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.6rem 0.85rem',
                    background: selectedDemoName === d.name ? 'rgba(56, 189, 248, 0.15)' : 'var(--bg-surface)',
                    border: selectedDemoName === d.name ? '1px solid var(--cyan-soft)' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{d.display_name}</span>
                  <span className={`badge badge-${d.ground_truth_level.toLowerCase()}`} style={{ fontSize: '0.68rem' }}>
                    {d.ground_truth_level}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Upload & Form Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Upload size={18} color="#38bdf8" /> Sample Metadata & File
              </div>
            </div>

            <form onSubmit={e => { e.preventDefault(); handleRunAnalysis(); }} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Upload Image File</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".png,.jpg,.jpeg,.tif,.tiff,.bmp"
                  style={{ display: 'none' }}
                />
                <div
                  className="dropzone"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ padding: '1.5rem 1rem' }}
                >
                  <Microscope size={32} style={{ color: 'var(--cyan-soft)', margin: '0 auto 0.5rem' }} />
                  <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                    {selectedFile ? selectedFile.name : selectedDemoName ? `Preloaded: ${selectedDemoName}.png` : 'Drop microscope image here or click'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Supports PNG, JPEG, TIFF, BMP (Up to 25MB)
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Sample Code Identifier</label>
                <input
                  type="text"
                  className="form-control"
                  value={sampleCode}
                  onChange={e => setSampleCode(e.target.value)}
                  placeholder="e.g. SMP-2026-001"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Filtered Water Volume (mL)</label>
                <input
                  type="number"
                  step="10"
                  min="1"
                  className="form-control"
                  value={volumeMl}
                  onChange={e => setVolumeMl(parseFloat(e.target.value) || 500)}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Formula: Concentration (particles/L) = Total Particles / (Volume / 1000)
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Sampling Location / Facility</label>
                <input
                  type="text"
                  className="form-control"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. Water Treatment Plant #3"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Objective Magnification</label>
                  <select
                    className="form-control"
                    value={magnification}
                    onChange={e => setMagnification(e.target.value)}
                  >
                    <option value="4x">4x (3.12 µm/px)</option>
                    <option value="10x">10x (1.25 µm/px)</option>
                    <option value="20x">20x (0.62 µm/px)</option>
                    <option value="40x">40x (0.31 µm/px)</option>
                    <option value="100x">100x (0.12 µm/px)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Confidence: {confidenceThreshold.toFixed(2)}</label>
                  <input
                    type="range"
                    min="0.2"
                    max="0.9"
                    step="0.05"
                    value={confidenceThreshold}
                    onChange={e => setConfidenceThreshold(parseFloat(e.target.value))}
                    style={{ marginTop: '0.6rem', accentColor: 'var(--cyan-soft)', width: '100%' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Inspection Notes</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Optional field observations or technician notes..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={isScanning || (!selectedFile && !selectedDemoName)}
                style={{ width: '100%', padding: '0.85rem' }}
              >
                {isScanning ? (
                  <>
                    <RefreshCw size={16} className="pulse-dot" style={{ animation: 'spin 1s linear infinite' }} />
                    Running Inference...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} /> Execute Particle Detection
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Visualizer & Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Microscope Image Visualizer */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div className="card-header" style={{ marginBottom: '1rem' }}>
              <div className="card-title">
                <Eye size={18} color="#38bdf8" /> Microscope Field of View
              </div>

              {result && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className={`btn ${viewMode === 'annotated' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                    onClick={() => setViewMode('annotated')}
                  >
                    AI Annotated
                  </button>
                  <button
                    type="button"
                    className={`btn ${viewMode === 'original' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                    onClick={() => setViewMode('original')}
                  >
                    Raw Image
                  </button>
                </div>
              )}
            </div>

            {/* Visualizer viewport */}
            <div
              style={{
                position: 'relative',
                background: '#040711',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                minHeight: '420px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--border-subtle)'
              }}
            >
              {isScanning && <div className="scanning-overlay" />}

              {result ? (
                <img
                  src={
                    viewMode === 'annotated' && result.annotated_image_path
                      ? assetUrl(result.annotated_image_path)
                      : assetUrl(result.image_path)
                  }
                  alt="Microscope analysis result"
                  style={{ width: '100%', maxHeight: '550px', objectFit: 'contain', display: 'block' }}
                />
              ) : previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Microscope sample preview"
                  style={{ width: '100%', maxHeight: '550px', objectFit: 'contain', display: 'block' }}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)' }}>
                  <Microscope size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                  <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>No Microscope Image Loaded</p>
                  <p style={{ fontSize: '0.82rem', marginTop: '0.25rem' }}>
                    Select a benchmark sample or upload your optical microscopy image to inspect
                  </p>
                </div>
              )}

              {isScanning && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '1.5rem',
                    left: '1.5rem',
                    right: '1.5rem',
                    padding: '0.75rem 1rem',
                    background: 'rgba(11, 19, 32, 0.85)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-glow)',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    color: 'var(--cyan-core)'
                  }}
                >
                  <div className="pulse-dot" style={{ backgroundColor: 'var(--cyan-core)' }} />
                  <span>{scanStage}</span>
                </div>
              )}
            </div>
          </div>

          {/* Results Summary & Breakdown Card */}
          {result && (
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">
                    <CheckCircle size={18} color="#10b981" /> Analysis Results & Quantification
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Sample: {result.sample?.sample_code} • Scanned {new Date(result.created_at).toLocaleTimeString()}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => downloadReport('json')}
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem' }}
                  >
                    <FileJson size={14} /> JSON
                  </button>
                  <button
                    onClick={() => downloadReport('csv')}
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem' }}
                  >
                    <FileSpreadsheet size={14} /> CSV
                  </button>
                </div>
              </div>

              {/* Quantification Metrics Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Particles Counted
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--cyan-soft)', marginTop: '0.2rem' }}>
                    {result.total_particle_count}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Concentration
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fbbf24', marginTop: '0.2rem' }}>
                    {result.concentration_particles_per_liter.toFixed(1)}
                    <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '0.3rem' }}>particles/L</span>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Contamination Risk
                  </div>
                  <div style={{ marginTop: '0.4rem' }}>
                    <span className={`badge badge-${result.contamination_level?.toLowerCase()}`} style={{ fontSize: '0.9rem', padding: '0.3rem 0.8rem' }}>
                      {result.contamination_level} RISK
                    </span>
                  </div>
                </div>
              </div>

              {/* Detected Particle Roster Table */}
              <div style={{ marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.92rem' }}>
                Granular Particle Detections ({result.particles.length})
              </div>

              <div className="data-table-container" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Polymer Morphology</th>
                      <th>Physical Size</th>
                      <th>Confidence</th>
                      <th>Coordinates (Bounding Box)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.particles.map((p, idx) => (
                      <tr
                        key={idx}
                        onMouseEnter={() => setHighlightedParticleIdx(idx)}
                        onMouseLeave={() => setHighlightedParticleIdx(null)}
                        style={{
                          backgroundColor: highlightedParticleIdx === idx ? 'rgba(56, 189, 248, 0.1)' : 'transparent'
                        }}
                      >
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{idx + 1}</td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              background: 'rgba(255, 255, 255, 0.08)',
                              color:
                                p.particle_type === 'fiber'
                                  ? '#38bdf8'
                                  : p.particle_type === 'fragment'
                                  ? '#fbbf24'
                                  : p.particle_type === 'pellet'
                                  ? '#34d399'
                                  : p.particle_type === 'film'
                                  ? '#c084fc'
                                  : '#fb7185'
                            }}
                          >
                            {p.particle_type.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{p.size_um?.toFixed(1) ?? '—'} µm</td>
                        <td>{Math.round(p.confidence * 100)}%</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          [{Math.round(p.x_min)}, {Math.round(p.y_min)}, {Math.round(p.x_max)}, {Math.round(p.y_max)}]
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
