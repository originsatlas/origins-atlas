// Utility functions for Origins Atlas

/**
 * Format a number as USD currency
 */
export function formatUSD(amount: number | null | undefined): string {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a number as THB currency
 */
export function formatTHB(amount: number | null | undefined): string {
  if (amount == null) return '—';
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format price per square meter
 */
export function formatPricePerSqm(amount: number | null | undefined): string {
  if (amount == null) return '';
  return `$${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)}/m²`;
}

/**
 * Format a date string to a readable format
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
}

/**
 * Get the lowest asking price from source listings
 */
export function getLowestPrice(
  listings: { asking_price_usd: number | null }[]
): number | null {
  const prices = listings
    .map((l) => l.asking_price_usd)
    .filter((p): p is number => p != null);
  if (prices.length === 0) return null;
  return Math.min(...prices);
}

/**
 * Get the highest asking price from source listings
 */
export function getHighestPrice(
  listings: { asking_price_usd: number | null }[]
): number | null {
  const prices = listings
    .map((l) => l.asking_price_usd)
    .filter((p): p is number => p != null);
  if (prices.length === 0) return null;
  return Math.max(...prices);
}

/**
 * Format a price range from source listings
 */
export function formatPriceRange(
  listings: { asking_price_usd: number | null }[]
): string {
  const low = getLowestPrice(listings);
  const high = getHighestPrice(listings);
  if (low == null) return 'Price TBD';
  if (low === high) return formatUSD(low);
  return `${formatUSD(low)} – ${formatUSD(high)}`;
}

/**
 * Get verification status display properties
 */
export function getVerificationDisplay(status: string) {
  switch (status) {
    case 'verified':
      return { label: 'Verified', icon: '✓', className: 'verified', color: 'var(--success-600)' };
    case 'pending':
      return { label: 'Pending', icon: '⏳', className: 'pending', color: 'var(--warning-600)' };
    case 'disputed':
      return { label: 'Disputed', icon: '⚠', className: 'disputed', color: 'var(--danger-600)' };
    default:
      return { label: 'Unverified', icon: '○', className: 'unverified', color: 'var(--neutral-500)' };
  }
}

/**
 * Get status display properties for houses
 */
export function getStatusDisplay(status: string) {
  switch (status) {
    case 'active':
      return { label: 'Active', color: 'var(--success-600)' };
    case 'sold':
      return { label: 'Sold', color: 'var(--danger-600)' };
    case 'pending_review':
      return { label: 'Pending Review', color: 'var(--warning-600)' };
    default:
      return { label: 'Unlisted', color: 'var(--neutral-500)' };
  }
}

/**
 * Truncate text to a maximum length
 */
export function truncateText(text: string | null | undefined, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '…';
}
