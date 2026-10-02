'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function EditCommunityPage() {
  const router = useRouter();
  const params = useParams();
  const communityId = params.id as string;
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    location: '',
    city: '',
    province: '',
    country: 'TH',
    total_units: '',
    community_type: 'gated_community',
    amenities: '',
  });

  const fetchCommunity = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('communities')
      .select('*')
      .eq('id', communityId)
      .single();

    if (fetchError || !data) {
      setError('Community not found');
      setFetching(false);
      return;
    }

    setForm({
      name: data.name || '',
      slug: data.slug || '',
      description: data.description || '',
      location: data.location || '',
      city: data.city || '',
      province: data.province || '',
      country: data.country || 'TH',
      total_units: data.total_units?.toString() || '',
      community_type: data.community_type || 'gated_community',
      amenities: data.amenities?.join(', ') || '',
    });
    setFetching(false);
  }, [supabase, communityId]);

  useEffect(() => {
    fetchCommunity();
  }, [fetchCommunity]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: updateError } = await supabase
      .from('communities')
      .update({
        name: form.name,
        slug: form.slug,
        description: form.description || null,
        location: form.location || null,
        city: form.city || null,
        province: form.province || null,
        country: form.country,
        total_units: form.total_units ? parseInt(form.total_units) : null,
        community_type: form.community_type,
        amenities: form.amenities ? form.amenities.split(',').map((a) => a.trim()) : [],
      })
      .eq('id', communityId);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    router.push('/admin/communities');
    router.refresh();
  };

  if (fetching) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
        Loading community data...
      </div>
    );
  }

  return (
    <>
      <div className="admin-content-header">
        <div>
          <h1 className="page-title">Edit Community</h1>
          <p className="page-subtitle">Update community information</p>
        </div>
      </div>

      <div style={{
        maxWidth: '720px',
        background: 'var(--surface-elevated)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: '32px',
      }}>
        {error && (
          <div style={{
            padding: '12px 16px',
            background: 'var(--danger-50)',
            color: 'var(--danger-600)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
            fontSize: '14px',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Community Name *</label>
            <input type="text" name="name" value={form.name} onChange={handleChange} className="form-input" required />
          </div>

          <div className="form-group">
            <label className="form-label">URL Slug</label>
            <input type="text" name="slug" value={form.slug} onChange={handleChange} className="form-input" />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} className="form-textarea" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Location</label>
              <input type="text" name="location" value={form.location} onChange={handleChange} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">City</label>
              <input type="text" name="city" value={form.city} onChange={handleChange} className="form-input" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Province</label>
              <input type="text" name="province" value={form.province} onChange={handleChange} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Country</label>
              <input type="text" name="country" value={form.country} onChange={handleChange} className="form-input" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Total Units</label>
              <input type="number" name="total_units" value={form.total_units} onChange={handleChange} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Community Type</label>
              <select name="community_type" value={form.community_type} onChange={handleChange} className="form-select">
                <option value="gated_community">Gated Community</option>
                <option value="condo">Condominium</option>
                <option value="village">Village</option>
                <option value="townhouse_project">Townhouse Project</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Amenities (comma-separated)</label>
            <input type="text" name="amenities" value={form.amenities} onChange={handleChange} className="form-input" />
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
