import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import ArchiveButton from '@/components/admin/ArchiveButton';

export const metadata = { title: 'Manage Communities — Origins Atlas Admin' };

export default async function AdminCommunitiesPage() {
  const supabase = await createServerSupabaseClient();

  const { data: communities } = await supabase
    .from('communities')
    .select('*')
    .order('name');

  return (
    <>
      <div className="admin-content-header">
        <div>
          <h1 className="page-title">Communities</h1>
          <p className="page-subtitle">Manage residential communities</p>
        </div>
        <Link href="/admin/communities/new" className="btn btn-primary">+ Add Community</Link>
      </div>

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Location</th>
              <th>Type</th>
              <th>Units</th>
              <th>Slug</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {communities?.map((c) => (
              <tr key={c.id}>
                <td><strong>{c.name}</strong></td>
                <td style={{ fontSize: '13px' }}>{c.city}, {c.province}</td>
                <td style={{ fontSize: '13px', textTransform: 'capitalize' }}>{c.community_type?.replace('_', ' ')}</td>
                <td>{c.total_units || '—'}</td>
                <td style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>{c.slug}</td>
                <td>
                  <div className="data-table-actions" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Link href={`/admin/communities/${c.id}/edit`} className="btn btn-sm btn-secondary">Edit</Link>
                    <ArchiveButton endpoint="communities" id={c.id} name={c.name} isArchived={c.is_archived} />
                  </div>
                </td>
              </tr>
            ))}
            {(!communities || communities.length === 0) && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '40px' }}>
                  No communities yet. Click &ldquo;Add Community&rdquo; to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
