'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { House, Agent } from '@/lib/types/database';

export default function NewListingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [houses, setHouses] = useState<House[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);

  const [form, setForm] = useState({
    house_id: '', agent_id: '', source_url: '',
    asking_price_usd: '', asking_price_thb: '', price_per_sqm_usd: '',
    listing_date: '', last_seen_date: '', is_active: true, listing_description: '',
  });

  const fetchData = useCallback(async () => {
    const [{ data: h }, { data: a }] = await Promise.all([
      supabase.from('houses').select('*').order('house_number'),
      supabase.from('agents').select('*').order('name'),
    ]);
    setHouses(h || []);
    setAgents(a || []);
    if (h?.length) setForm((p) => ({ ...p, house_id: p.house_id || h[0].id }));
    if (a?.length) setForm((p) => ({ ...p, agent_id: p.agent_id || a[0].id }));
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setForm((p) => ({ ...p, [name]: (e.target as HTMLInputElement).checked }));
    } else if (name === 'asking_price_thb') {
      const thb = parseFloat(value);
      const derivedUsd = !isNaN(thb) ? (thb * 0.0271).toFixed(2) : '';
      setForm((p) => ({ ...p, asking_price_thb: value, asking_price_usd: derivedUsd }));
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const result = await res.json();
      if (!res.ok || result.error) {
        setError(result.error || 'Failed to create listing');
        setLoading(false);
        return;
      }

      router.push('/admin/listings');
      router.refresh();
    } catch {
      setError('Network error while saving listing');
      setLoading(false);
    }
  };

  return (
    <>
      <div className="admin-content-header">
        <div>
          <h1 className="page-title">New Source Listing</h1>
          <p className="page-subtitle">Attach an agent listing to a canonical house</p>
        </div>
      </div>

      <div style={{
        maxWidth: '720px', background: 'var(--surface-elevated)', border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)', padding: '32px',
      }}>
        {error && <div style={{ padding: '12px 16px', background: 'var(--danger-50)', color: 'var(--danger-600)',
          borderRadius: 'var(--radius-md)', marginBottom: '20px', fontSize: '14px' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Canonical House *</label>
              <select name="house_id" value={form.house_id} onChange={handleChange} className="form-select" required>
                {houses.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.house_number || 'Unknown'} — {h.bedrooms}BR/{h.bathrooms}BA {h.house_size_sqm ? `(${h.house_size_sqm}m²)` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Agent *</label>
              <select name="agent_id" value={form.agent_id} onChange={handleChange} className="form-select" required>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({a.source_platform || 'N/A'})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Source URL</label>
            <input type="url" name="source_url" value={form.source_url} onChange={handleChange}
              className="form-input" placeholder="https://www.hipflat.com/..." />
          </div>

          <div className="form-row-3">
            <div className="form-group">
              <label className="form-label">Price in THB (Primary) *</label>
              <input type="number" name="asking_price_thb" value={form.asking_price_thb} onChange={handleChange}
                className="form-input" step="0.01" placeholder="e.g. 21450000" />
              <span className="form-hint">Thai Baht is the source price</span>
            </div>
            <div className="form-group">
              <label className="form-label">Asking Price in USD (Derived)</label>
              <input type="number" name="asking_price_usd" value={form.asking_price_usd} onChange={handleChange}
                className="form-input" step="0.01" placeholder="Auto-calculated from THB" />
              <span className="form-hint">Auto-derived via live conversion</span>
            </div>
            <div className="form-group">
              <label className="form-label">Price/m² (USD)</label>
              <input type="number" name="price_per_sqm_usd" value={form.price_per_sqm_usd} onChange={handleChange}
                className="form-input" step="0.01" placeholder="2017" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Listing Date</label>
              <input type="date" name="listing_date" value={form.listing_date} onChange={handleChange} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Last Seen Date</label>
              <input type="date" name="last_seen_date" value={form.last_seen_date} onChange={handleChange} className="form-input" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea name="listing_description" value={form.listing_description} onChange={handleChange} className="form-textarea"
              placeholder="Listing-specific description..." />
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} id="is_active" />
            <label htmlFor="is_active" style={{ fontSize: '14px' }}>Active Listing</label>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Listing'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => router.back()}>Cancel</button>
          </div>
        </form>
      </div>
    </>
  );
}
