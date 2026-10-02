'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Community } from '@/lib/types/database';

export default function EditHousePage() {
  const router = useRouter();
  const params = useParams();
  const houseId = params.id as string;
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [communities, setCommunities] = useState<Community[]>([]);

  const [form, setForm] = useState({
    community_id: '',
    house_number: '',
    property_type: 'detached_house',
    bedrooms: '',
    bathrooms: '',
    parking_spaces: '',
    house_size_sqm: '',
    land_size_sqm: '',
    floors: '',
    year_built: '',
    description: '',
    status: 'active',
    is_new_listing: true,
    has_price_reduction: false,
  });

  const fetchData = useCallback(async () => {
    const [{ data: commData }, { data: houseData }] = await Promise.all([
      supabase.from('communities').select('*').order('name'),
      supabase.from('houses').select('*').eq('id', houseId).single(),
    ]);

    setCommunities(commData || []);

    if (houseData) {
      setForm({
        community_id: houseData.community_id,
        house_number: houseData.house_number || '',
        property_type: houseData.property_type || 'detached_house',
        bedrooms: houseData.bedrooms?.toString() || '',
        bathrooms: houseData.bathrooms?.toString() || '',
        parking_spaces: houseData.parking_spaces?.toString() || '',
        house_size_sqm: houseData.house_size_sqm?.toString() || '',
        land_size_sqm: houseData.land_size_sqm?.toString() || '',
        floors: houseData.floors?.toString() || '',
        year_built: houseData.year_built?.toString() || '',
        description: houseData.description || '',
        status: houseData.status || 'active',
        is_new_listing: houseData.is_new_listing ?? true,
        has_price_reduction: houseData.has_price_reduction ?? false,
      });
    }
    setFetching(false);
  }, [supabase, houseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setForm((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: updateError } = await supabase
      .from('houses')
      .update({
        community_id: form.community_id,
        house_number: form.house_number || null,
        property_type: form.property_type,
        bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
        bathrooms: form.bathrooms ? parseInt(form.bathrooms) : null,
        parking_spaces: form.parking_spaces ? parseInt(form.parking_spaces) : null,
        house_size_sqm: form.house_size_sqm ? parseFloat(form.house_size_sqm) : null,
        land_size_sqm: form.land_size_sqm ? parseFloat(form.land_size_sqm) : null,
        floors: form.floors ? parseInt(form.floors) : null,
        year_built: form.year_built ? parseInt(form.year_built) : null,
        description: form.description || null,
        status: form.status as 'active' | 'sold' | 'unlisted' | 'pending_review',
        is_new_listing: form.is_new_listing,
        has_price_reduction: form.has_price_reduction,
      })
      .eq('id', houseId);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    router.push('/admin/houses');
    router.refresh();
  };

  if (fetching) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading...</div>;
  }

  return (
    <>
      <div className="admin-content-header">
        <div>
          <h1 className="page-title">Edit House</h1>
          <p className="page-subtitle">Update canonical house record</p>
        </div>
      </div>

      <div style={{
        maxWidth: '720px', background: 'var(--surface-elevated)', border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)', padding: '32px',
      }}>
        {error && (
          <div style={{ padding: '12px 16px', background: 'var(--danger-50)', color: 'var(--danger-600)',
            borderRadius: 'var(--radius-md)', marginBottom: '20px', fontSize: '14px' }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Community *</label>
              <select name="community_id" value={form.community_id} onChange={handleChange} className="form-select" required>
                {communities.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">House Number</label>
              <input type="text" name="house_number" value={form.house_number} onChange={handleChange} className="form-input" />
            </div>
          </div>

          <div className="form-row-3">
            <div className="form-group">
              <label className="form-label">Property Type</label>
              <select name="property_type" value={form.property_type} onChange={handleChange} className="form-select">
                <option value="detached_house">Detached House</option>
                <option value="semi_detached">Semi-Detached</option>
                <option value="townhouse">Townhouse</option>
                <option value="condo">Condominium</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Bedrooms</label>
              <input type="number" name="bedrooms" value={form.bedrooms} onChange={handleChange} className="form-input" min="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Bathrooms</label>
              <input type="number" name="bathrooms" value={form.bathrooms} onChange={handleChange} className="form-input" min="0" />
            </div>
          </div>

          <div className="form-row-3">
            <div className="form-group">
              <label className="form-label">House Size (m²)</label>
              <input type="number" name="house_size_sqm" value={form.house_size_sqm} onChange={handleChange} className="form-input" step="0.01" />
            </div>
            <div className="form-group">
              <label className="form-label">Land Size (m²)</label>
              <input type="number" name="land_size_sqm" value={form.land_size_sqm} onChange={handleChange} className="form-input" step="0.01" />
            </div>
            <div className="form-group">
              <label className="form-label">Parking</label>
              <input type="number" name="parking_spaces" value={form.parking_spaces} onChange={handleChange} className="form-input" min="0" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Floors</label>
              <input type="number" name="floors" value={form.floors} onChange={handleChange} className="form-input" min="1" />
            </div>
            <div className="form-group">
              <label className="form-label">Year Built</label>
              <input type="number" name="year_built" value={form.year_built} onChange={handleChange} className="form-input" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} className="form-textarea" />
          </div>

          <div className="form-row-3">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select name="status" value={form.status} onChange={handleChange} className="form-select">
                <option value="active">Active</option>
                <option value="sold">Sold</option>
                <option value="unlisted">Unlisted</option>
                <option value="pending_review">Pending Review</option>
              </select>
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '24px' }}>
              <input type="checkbox" name="is_new_listing" checked={form.is_new_listing} onChange={handleChange} id="is_new_listing" />
              <label htmlFor="is_new_listing" style={{ fontSize: '14px' }}>New Listing</label>
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '24px' }}>
              <input type="checkbox" name="has_price_reduction" checked={form.has_price_reduction} onChange={handleChange} id="has_price_reduction" />
              <label htmlFor="has_price_reduction" style={{ fontSize: '14px' }}>Price Reduction</label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => router.back()}>Cancel</button>
          </div>
        </form>
      </div>
    </>
  );
}
