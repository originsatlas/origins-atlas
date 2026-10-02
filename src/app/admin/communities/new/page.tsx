'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function NewCommunityPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Auto-generate slug from name
    if (name === 'name') {
      setForm((prev) => ({
        ...prev,
        slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: insertError } = await supabase.from('communities').insert({
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
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push('/admin/communities');
    router.refresh();
  };

  return (
    <>
      <div className="admin-content-header">
        <div>
          <h1 className="page-title">New Community</h1>
          <p className="page-subtitle">Add a new residential community to track</p>
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
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., Nirvana Absolute Bangna"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">URL Slug</label>
            <input
              type="text"
              name="slug"
              value={form.slug}
              onChange={handleChange}
              className="form-input"
              placeholder="auto-generated-from-name"
            />
            <span className="form-hint">Auto-generated. URL: /communities/{form.slug || '...'}</span>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="form-textarea"
              placeholder="Brief description of the community..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Location / Area</label>
              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., Bangna, Bangkok"
              />
            </div>
            <div className="form-group">
              <label className="form-label">City</label>
              <input
                type="text"
                name="city"
                value={form.city}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., Bangkok"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Province</label>
              <input
                type="text"
                name="province"
                value={form.province}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., Bangkok"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Country Code</label>
              <input
                type="text"
                name="country"
                value={form.country}
                onChange={handleChange}
                className="form-input"
                placeholder="TH"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Total Units (approximate)</label>
              <input
                type="number"
                name="total_units"
                value={form.total_units}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., 30"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Community Type</label>
              <select
                name="community_type"
                value={form.community_type}
                onChange={handleChange}
                className="form-select"
              >
                <option value="gated_community">Gated Community</option>
                <option value="condo">Condominium</option>
                <option value="village">Village</option>
                <option value="townhouse_project">Townhouse Project</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Amenities</label>
            <input
              type="text"
              name="amenities"
              value={form.amenities}
              onChange={handleChange}
              className="form-input"
              placeholder="Swimming Pool, Fitness Center, 24-Hour Security, ..."
            />
            <span className="form-hint">Comma-separated list of amenities</span>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Community'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => router.back()}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
