'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function NavigationProgressBar() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // When the route completes, dismiss the progress bar
    setLoading(false);
  }, [pathname]);

  useEffect(() => {
    const handleAnchorClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      // If internal navigation and not a hash link or target="_blank"
      if (
        href &&
        href.startsWith('/') &&
        !href.startsWith('/#') &&
        !href.startsWith('#') &&
        target.target !== '_blank' &&
        !event.ctrlKey &&
        !event.metaKey
      ) {
        // Only trigger if navigating to a different pathname
        const targetPath = href.split('?')[0].split('#')[0];
        if (targetPath !== window.location.pathname) {
          setLoading(true);
        }
      }
    };

    document.addEventListener('click', handleAnchorClick);
    return () => {
      document.removeEventListener('click', handleAnchorClick);
    };
  }, []);

  if (!loading) return null;

  return (
    <div className="global-top-progress-bar" id="global-nav-loader" role="progressbar" aria-label="Loading page">
      <div className="global-top-progress-fill" />
    </div>
  );
}
