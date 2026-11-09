'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { House, Agent } from '@/lib/types/database';

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams();
  const listingId = params.id as string;
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [houses, setHouses] = useState<House[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [originalPrice, setOriginalPrice] = useState<number | null>(null);

  const [form, setForm] = useState({
    house_id: '',
    agent_id: '',
    source_url: '',
    asking_price_usd: '',
    asking_price_thb: '',
    price_per_sqm_usd: '',
    listing_date: '',
    last_seen_date: '',
    is_active: true,
    listing_description: '',
  });

  const fetchData = useCallback(async () => {
    const [{ data: h }, { data: a }, { data: listing }] = await Promise.all([
      supabase.from('houses').select('*').order('house_number'),
      supabase.from('agents').select('*').order('name'),
      supabase.from('source_listings').select('*').eq('id', listingId).single(),
    ]);
    setHouses(h || []);
    setAgents(a || []);
    if (listing) {
      setOriginalPrice(listing.asking_price_usd ?? null);
      setForm({
        house_id: listing.house_id,
        agent_id: listing.agent_id,
        source_url: listing.source_url || '',
        asking_price_usd: listing.asking_price_usd?.toString() || '',
        asking_price_thb: listing.asking_price_thb?.toString() || '',
        price_per_sqm_usd: listing.price_per_sqm_usd?.toString() || '',
        listing_date: listing.listing_date || '',
        last_seen_date: listing.last_seen_date || '',
        is_active: listing.is_active ?? true,
        listing_description: listing.listing_description || '',
      });
    }
    setFetching(false);
  }, [supabase, listingId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
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
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: listingId,
          ...form,
        }),
      });

      const result = await res.json();
      if (!res.ok || result.error) {
        setError(result.error || 'Failed to update listing');
        setLoading(false);
        return;
      }

      router.push('/admin/listings');
      router.refresh();
    } catch {
      setError('Network error while updating listing');
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
        Loading...
      </div>
    );
  }

  return (
    <>
      <div className="admin-content-header">
        <div>
          <h1 className="page-title">Edit Listing</h1>
          <p className="page-subtitle">Update source listing details and preserve price history</p>
        </div>
      </div>
      <div
        style={{
          maxWidth: '720px',
          background: 'var(--surface-elevated)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: '32px',
        }}
      >
        {error && (
          <div
            style={{
              padding: '12px 16px',
              background: 'var(--danger-50)',
              color: 'var(--danger-600)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Canonical House *</label>
              <select
                name="house_id"
                value={form.house_id}
                onChange={handleChange}
                className="form-select"
                required
              >
                {houses.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.house_number || 'Unknown'} — {h.bedrooms}BR/{h.bathrooms}BA
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Agent / Source *</label>
              <select
                name="agent_id"
                value={form.agent_id}
                onChange={handleChange}
                className="form-select"
                required
              >
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.source_platform || 'Direct'})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Source URL</label>
            <input
              type="url"
              name="source_url"
              value={form.source_url}
              onChange={handleChange}
              className="form-input"
            />
          </div>
          <div className="form-row-3">
            <div className="form-group">
              <label className="form-label">Price in THB (Primary) *</label>
              <input
                type="number"
                name="asking_price_thb"
                value={form.asking_price_thb}
                onChange={handleChange}
                className="form-input"
                step="0.01"
              />
              <span className="form-hint">Thai Baht is the source price</span>
            </div>
            <div className="form-group">
              <label className="form-label">Asking Price in USD (Derived)</label>
              <input
                type="number"
                name="asking_price_usd"
                value={form.asking_price_usd}
                onChange={handleChange}
                className="form-input"
                step="0.01"
              />
              <span className="form-hint">Auto-derived via live conversion</span>
            </div>
            <div className="form-group">
              <label className="form-label">Price/m² (USD)</label>
              <input
                type="number"
                name="price_per_sqm_usd"
                value={form.price_per_sqm_usd}
                onChange={handleChange}
                className="form-input"
                step="0.01"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Listed Date</label>
              <input
                type="date"
                name="listing_date"
                value={form.listing_date}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Seen Date</label>
              <input
                type="date"
                name="last_seen_date"
                value={form.last_seen_date}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Listing Description</label>
            <textarea
              name="listing_description"
              value={form.listing_description}
              onChange={handleChange}
              className="form-textarea"
            />
          </div>
          <div
            className="form-group"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
              id="is_active"
            />
            <label htmlFor="is_active" style={{ fontSize: '14px' }}>
              Active Listing
            </label>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save & Record History'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => router.back()}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
