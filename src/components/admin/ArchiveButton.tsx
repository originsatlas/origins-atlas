'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';

interface ArchiveButtonProps {
  endpoint: 'communities' | 'houses' | 'agents' | 'listings';
  id: string;
  name?: string;
  isArchived?: boolean;
}

export default function ArchiveButton({ endpoint, id, name, isArchived }: ArchiveButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close modal on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading]);

  if (isArchived) {
    return (
      <span
        className="badge badge-unverified"
        style={{
          fontSize: '11px',
          padding: '4px 8px',
          height: '32px',
          display: 'inline-flex',
          alignItems: 'center',
          boxSizing: 'border-box',
        }}
      >
        Archived
      </span>
    );
  }

  const handleOpen = () => {
    setErrorMsg('');
    setIsOpen(true);
  };

  const handleClose = () => {
    if (loading) return;
    setIsOpen(false);
    setErrorMsg('');
  };

  const handleConfirmArchive = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/admin/${endpoint}?id=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorMsg(data.error || 'Failed to archive record. Please try again.');
        setLoading(false);
        return;
      }

      setIsOpen(false);
      router.refresh();
    } catch {
      setErrorMsg('Network error while archiving record. Please check your connection.');
      setLoading(false);
    }
  };

  const entityTypeLabel =
    endpoint === 'communities' ? 'Community' :
    endpoint === 'houses' ? 'House' :
    endpoint === 'agents' ? 'Agent' : 'Listing';

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="btn btn-sm btn-archive-action"
        title={`Archive ${name || entityTypeLabel}`}
      >
        Archive
      </button>

      {isOpen && mounted && createPortal(
        <div
          className="archive-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <div className="archive-modal-card" role="dialog" aria-modal="true" aria-labelledby="archive-modal-title">
            <div className="archive-modal-header">
              <div className="archive-modal-icon-badge">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="21 8 21 21 3 21 3 8" />
                  <rect x="1" y="3" width="22" height="5" />
                  <line x1="10" y1="12" x2="14" y2="12" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <h3 id="archive-modal-title" className="archive-modal-title">Archive {entityTypeLabel}</h3>
                <p className="archive-modal-subtitle">Soft-delete confirmation</p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="archive-modal-close-btn"
                aria-label="Close dialog"
                disabled={loading}
              >
                ✕
              </button>
            </div>

            <div className="archive-modal-body">
              <p className="archive-modal-message">
                Are you sure you want to archive <strong>{name ? `"${name}"` : `this ${entityTypeLabel.toLowerCase()}`}</strong>?
              </p>

              <div className="archive-modal-notice">
                <div className="archive-modal-notice-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </div>
                <div>
                  <strong>Safe Soft-Delete:</strong> This record will be hidden from public searches and community pages. Historical prices, listings, and audit logs remain permanently preserved in the database.
                </div>
              </div>

              {errorMsg && (
                <div className="archive-modal-error">
                  {errorMsg}
                </div>
              )}
            </div>

            <div className="archive-modal-footer">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="btn btn-sm btn-secondary"
                style={{ minWidth: '84px', height: '36px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmArchive}
                disabled={loading}
                className="btn btn-sm btn-confirm-archive"
                style={{ height: '36px' }}
              >
                {loading ? 'Archiving...' : `Archive ${entityTypeLabel}`}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
