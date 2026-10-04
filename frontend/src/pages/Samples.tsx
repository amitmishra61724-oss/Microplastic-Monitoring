import React, { useState, useEffect } from 'react';
import {
  Droplet,
  Plus,
  Search,
  Trash2,
  MapPin,
  AlertCircle
} from 'lucide-react';
import { apiUrl } from '../config/api';

interface SampleItem {
  id: number;
  sample_code: string;
  volume_ml: number;
  location?: string;
  notes?: string;
  collection_date: string;
  created_at: string;
}

export const Samples: React.FC = () => {
  const [samples, setSamples] = useState<SampleItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // Form State
  const [newCode, setNewCode] = useState<string>('');
  const [newVolume, setNewVolume] = useState<number>(500);
  const [newLocation, setNewLocation] = useState<string>('');
  const [newNotes, setNewNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchSamples = () => {
    const url = searchQuery
      ? apiUrl(`/api/v1/samples?search=${encodeURIComponent(searchQuery)}`)
      : apiUrl('/api/v1/samples');

    fetch(url)
      .then(res => res.json())
      .then(data => {
        setSamples(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch samples:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSamples();
  }, [searchQuery]);

  const handleCreateSample = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    fetch(apiUrl('/api/v1/samples'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sample_code: newCode,
        volume_ml: newVolume,
        location: newLocation || null,
        notes: newNotes || null
      })
    })
      .then(async res => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || 'Failed to create sample');
        }
        return res.json();
      })
      .then(() => {
        setShowCreateModal(false);
        setNewCode('');
        setNewVolume(500);
        setNewLocation('');
        setNewNotes('');
        fetchSamples();
      })
      .catch(err => {
        setErrorMsg(err.message);
      });
  };

  const handleDeleteSample = (id: number) => {
    if (!window.confirm('Are you sure you want to delete this sample and all related analyses?')) return;

    fetch(apiUrl(`/api/v1/samples/${id}`), { method: 'DELETE' })
      .then(res => {
        if (res.ok) fetchSamples();
      })
      .catch(err => console.error('Failed to delete sample:', err));
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
            Water Sample Registry
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Catalogue of collected water bodies, sampling collection volumes, and geographic coordinates.
          </p>
        </div>

        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          <Plus size={16} /> Register New Sample
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            className="form-control"
            placeholder="Search by sample code or sampling location..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ border: 'none', background: 'transparent', padding: '0.3rem 0' }}
          />
        </div>
      </div>

      {/* Samples Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Droplet size={18} color="#38bdf8" /> Sample Archive ({samples.length})
          </div>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Sample Code</th>
                <th>Volume (mL)</th>
                <th>Collection Location</th>
                <th>Notes</th>
                <th>Registered Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Loading samples...
                  </td>
                </tr>
              ) : samples.length > 0 ? (
                samples.map(s => (
                  <tr key={s.id}>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--cyan-soft)', fontFamily: 'var(--font-mono)' }}>
                        {s.sample_code}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{s.volume_ml.toFixed(1)} mL</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                        <MapPin size={14} color="var(--text-muted)" />
                        {s.location || 'Unspecified'}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.notes || '—'}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        onClick={() => handleDeleteSample(s.id)}
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', color: '#f87171' }}
                        title="Delete Sample"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No water samples registered. Click "Register New Sample" above or run an analysis scan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Sample Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem'
          }}
        >
          <div className="card" style={{ maxWidth: '480px', width: '100%', border: '1px solid var(--border-glow)' }}>
            <div className="card-header">
              <div className="card-title">Register Water Sample</div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="disclaimer-banner" style={{ background: 'rgba(244, 63, 94, 0.1)', borderColor: 'rgba(244, 63, 94, 0.4)', color: '#fb7185' }}>
                <AlertCircle size={18} />
                <div>{errorMsg}</div>
              </div>
            )}

            <form onSubmit={handleCreateSample} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Sample Code</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. SMP-ESTUARY-01"
                  value={newCode}
                  onChange={e => setNewCode(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Water Sample Volume (mL)</label>
                <input
                  type="number"
                  step="10"
                  min="1"
                  className="form-control"
                  value={newVolume}
                  onChange={e => setNewVolume(parseFloat(e.target.value) || 500)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Collection Location</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Potomac River Outlet"
                  value={newLocation}
                  onChange={e => setNewLocation(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Laboratory sampling notes, water temperature, filtration mesh size..."
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Sample
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
