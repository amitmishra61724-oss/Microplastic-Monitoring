import React from 'react';

export const AnalysisHistory: React.FC = () => {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">Historical Analysis Log</div>
        <span className="placeholder-badge">Database Log</span>
      </div>

      <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Peristed water sample analysis records and calculated microplastic concentrations.
      </p>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Sample Code</th>
              <th style={{ padding: '0.75rem 1rem' }}>Volume (mL)</th>
              <th style={{ padding: '0.75rem 1rem' }}>Particle Count</th>
              <th style={{ padding: '0.75rem 1rem' }}>Concentration (particles/L)</th>
              <th style={{ padding: '0.75rem 1rem' }}>Contamination Level</th>
              <th style={{ padding: '0.75rem 1rem' }}>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
                No analysis records stored in database. Create samples and execute detection in subsequent project phases.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
