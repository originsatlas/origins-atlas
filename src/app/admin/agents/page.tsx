import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const metadata = { title: 'Manage Agents — Origins Atlas Admin' };

export default async function AdminAgentsPage() {
  const supabase = await createServerSupabaseClient();

  const { data: agents } = await supabase
    .from('agents')
    .select(`*, source_listings (id)`)
    .order('name');

  return (
    <>
      <div className="admin-content-header">
        <div>
          <h1 className="page-title">Agents & Sources</h1>
          <p className="page-subtitle">Manage real estate agents and listing sources</p>
        </div>
        <Link href="/admin/agents/new" className="btn btn-primary">+ Add Agent</Link>
      </div>

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Agent Name</th>
              <th>Platform</th>
              <th>Verified</th>
              <th>Listings</th>
              <th>Contact</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {agents?.map((agent) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const listingsCount = (agent.source_listings as any[])?.length || 0;
              return (
                <tr key={agent.id}>
                  <td><strong>{agent.name}</strong></td>
                  <td style={{ fontSize: '13px' }}>{agent.source_platform || '—'}</td>
                  <td>
                    {agent.is_verified ? (
                      <span className="badge badge-verified">Verified</span>
                    ) : (
                      <span className="badge badge-unverified">Unverified</span>
                    )}
                  </td>
                  <td>
                    <span className="property-card-listings-count">{listingsCount}</span>
                  </td>
                  <td style={{ fontSize: '13px' }}>{agent.contact_email || agent.contact_phone || '—'}</td>
                  <td>
                    <Link href={`/admin/agents/${agent.id}/edit`} className="btn btn-sm btn-secondary">Edit</Link>
                  </td>
                </tr>
              );
            })}
            {(!agents || agents.length === 0) && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '40px' }}>
                  No agents yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
