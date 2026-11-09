'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ArchiveButtonProps {
  endpoint: 'communities' | 'houses' | 'agents' | 'listings';
  id: string;
  name?: string;
  isArchived?: boolean;
}

export default function ArchiveButton({ endpoint, id, name, isArchived }: ArchiveButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (isArchived) {
    return (
      <span className="badge badge-unverified" style={{ fontSize: '11px', padding: '2px 8px' }}>
        Archived
      </span>
    );
  }

  const handleArchive = async () => {
    const label = name ? `"${name}"` : 'this record';
    const confirmed = window.confirm(
      `Are you sure you want to archive ${label}?\n\nThis will soft-delete the record so it is hidden from the public portal, while permanently preserving all historical price and verification records.`
    );

    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/${endpoint}?id=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        alert(data.error || 'Failed to archive record');
      } else {
        router.refresh();
      }
    } catch {
      alert('Network error while archiving record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleArchive}
      disabled={loading}
      className="btn btn-sm btn-outline-danger"
      style={{
        padding: '3px 8px',
        fontSize: '11px',
        opacity: loading ? 0.5 : 1,
      }}
      title="Soft-delete / Archive (preserves history)"
    >
      {loading ? 'Archiving...' : 'Archive'}
    </button>
  );
}
