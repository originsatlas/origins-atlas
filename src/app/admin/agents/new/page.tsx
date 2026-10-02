'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function NewAgentPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    source_platform: 'Hipflat',
    contact_email: '',
    contact_phone: '',
    website_url: '',
    is_verified: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

    const { error: insertError } = await supabase.from('agents').insert({
      name: form.name,
      source_platform: form.source_platform || null,
      contact_email: form.contact_email || null,
      contact_phone: form.contact_phone || null,
      website_url: form.website_url || null,
      is_verified: form.is_verified,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push('/admin/agents');
    router.refresh();
  };

  return (
    <>
      <div className="admin-content-header">
        <div>
          <h1 className="page-title">New Agent</h1>
          <p className="page-subtitle">Add a real estate agent or listing source</p>
        </div>
      </div>

      <div style={{
        maxWidth: '600px', background: 'var(--surface-elevated)', border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)', padding: '32px',
      }}>
        {error && (
          <div style={{ padding: '12px 16px', background: 'var(--danger-50)', color: 'var(--danger-600)',
            borderRadius: 'var(--radius-md)', marginBottom: '20px', fontSize: '14px' }}>{error}</div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Agent / Company Name *</label>
            <input type="text" name="name" value={form.name} onChange={handleChange}
              className="form-input" placeholder="e.g., PropertyScout" required />
          </div>
          <div className="form-group">
            <label className="form-label">Source Platform</label>
            <input type="text" name="source_platform" value={form.source_platform} onChange={handleChange}
              className="form-input" placeholder="e.g., Hipflat, DDProperty" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" name="contact_email" value={form.contact_email} onChange={handleChange} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input type="text" name="contact_phone" value={form.contact_phone} onChange={handleChange} className="form-input" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Website URL</label>
            <input type="url" name="website_url" value={form.website_url} onChange={handleChange} className="form-input" />
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="checkbox" name="is_verified" checked={form.is_verified} onChange={handleChange} id="is_verified" />
            <label htmlFor="is_verified" style={{ fontSize: '14px' }}>Verified Agent</label>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Agent'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => router.back()}>Cancel</button>
          </div>
        </form>
      </div>
    </>
  );
}
