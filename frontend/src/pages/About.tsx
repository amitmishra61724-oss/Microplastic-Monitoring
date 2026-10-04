import React from 'react';
import {
  Layers,
  ShieldCheck,
  Code,
  Workflow
} from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
          System Architecture & Scientific Specifications
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
          Technical overview of the AI-powered microplastic computer vision detection pipeline, database architecture, and contamination thresholds.
        </p>
      </div>

      {/* Main Mission Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Workflow size={20} color="#38bdf8" /> End-to-End Processing Pipeline
          </div>
          <span className="badge badge-cyan">Full Production Pipeline</span>
        </div>

        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '1.5rem' }}>
          The system automates the ingestion, preprocessing, localization, morphological classification, and concentration quantification of microplastic particles (&lt; 5mm) in water samples from high-resolution microscope imagery.
        </p>

        {/* Visual pipeline steps */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', textAlign: 'center' }}>
          {[
            { step: '01', title: 'Image Capture', desc: 'Optical microscope FOV (4x–100x)' },
            { step: '02', title: 'Preprocessing', desc: 'CLAHE & bilateral filtering' },
            { step: '03', title: 'AI Detection', desc: 'Contour & morphological extraction' },
            { step: '04', title: 'Polymer Class', desc: 'Fibers, fragments, pellets, films' },
            { step: '05', title: 'Concentration', desc: 'Calculated in particles/L' },
            { step: '06', title: 'Persistence', desc: 'PostgreSQL / SQLite storage' },
            { step: '07', title: 'Audit Report', desc: 'Exportable JSON / CSV lab reports' }
          ].map(s => (
            <div
              key={s.step}
              style={{
                background: 'var(--bg-surface)',
                padding: '1rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--cyan-soft)', fontFamily: 'var(--font-mono)' }}>
                {s.step}
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '0.25rem' }}>{s.title}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid of technical details */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        {/* Mathematical Model */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Code size={18} color="#38bdf8" /> Concentration Mathematical Formulation
            </div>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.7', marginBottom: '1rem' }}>
            Microplastic concentration is standardized in <strong>particles per liter (particles/L)</strong>:
          </p>
          <div
            style={{
              background: '#040711',
              padding: '1rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.9rem',
              color: 'var(--cyan-soft)',
              textAlign: 'center',
              marginBottom: '1rem'
            }}
          >
            Concentration = Total Particles / (Volume_mL / 1000)
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Physical particle dimensions in micrometers (&micro;m) are calibrated per optical objective:
            4x (3.125 &micro;m/px), 10x (1.25 &micro;m/px), 20x (0.625 &micro;m/px), 40x (0.3125 &micro;m/px).
          </p>
        </div>

        {/* Regulatory Thresholds */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <ShieldCheck size={18} color="#10b981" /> Contamination Standards & Thresholds
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.8rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div>
                <span style={{ fontWeight: 700, color: '#34d399' }}>LOW Contamination</span>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Baseline drinking / surface water</div>
              </div>
              <span style={{ fontWeight: 800, color: '#34d399' }}>&lt; 10.0 particles/L</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.8rem', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <div>
                <span style={{ fontWeight: 700, color: '#fbbf24' }}>MODERATE Contamination</span>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Urban runoff / estuarine environments</div>
              </div>
              <span style={{ fontWeight: 800, color: '#fbbf24' }}>10.0 – 50.0 particles/L</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.8rem', background: 'rgba(244, 63, 94, 0.08)', borderRadius: '6px', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
              <div>
                <span style={{ fontWeight: 700, color: '#fb7185' }}>HIGH Contamination</span>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Industrial effluent / urgent intervention</div>
              </div>
              <span style={{ fontWeight: 800, color: '#fb7185' }}>&gt; 50.0 particles/L</span>
            </div>
          </div>
        </div>
      </div>

      {/* Polymer Morphologies Guide */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Layers size={18} color="#a855f7" /> Polymer Morphology Classification Reference
          </div>
          <span className="badge badge-neutral">Taxonomy</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {[
            {
              type: 'Fiber',
              color: '#38bdf8',
              desc: 'High aspect ratio (&gt; 3.2), slender curved synthetic polymer thread from textiles (nylon, polyester).'
            },
            {
              type: 'Fragment',
              color: '#fbbf24',
              desc: 'Angular jagged polygonal shards broken down from macroscopic plastics (polyethylene, polypropylene).'
            },
            {
              type: 'Pellet',
              color: '#34d399',
              desc: 'Compact, smooth rounded or cylindrical virgin pre-production resin pellets (nurdles).'
            },
            {
              type: 'Film',
              color: '#c084fc',
              desc: 'Thin, translucent membrane sheets with light refraction edges (packaging films, plastic bags).'
            },
            {
              type: 'Sphere',
              color: '#fb7185',
              desc: 'Highly circular microbeads with specular optical highlight reflections (cosmetics, industrial abrasives).'
            }
          ].map(p => (
            <div
              key={p.type}
              style={{
                background: 'var(--bg-surface)',
                padding: '1rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ fontWeight: 700, color: p.color, fontSize: '0.95rem', marginBottom: '0.4rem' }}>
                {p.type}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                {p.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
