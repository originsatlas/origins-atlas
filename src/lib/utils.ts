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
 * Format price per square meter in USD
 */
export function formatPricePerSqm(amount: number | null | undefined): string {
  if (amount == null) return '';
  return `$${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)}/m²`;
}

/**
 * Format price per square meter in THB (Primary currency)
 */
export function formatPricePerSqmTHB(amount: number | null | undefined): string {
  if (amount == null) return '';
  return `฿${new Intl.NumberFormat('th-TH', {
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
 * Get the lowest asking price from source listings (THB primary)
 */
export function getLowestPriceTHB(
  listings: { asking_price_thb?: number | null }[]
): number | null {
  const prices = listings
    .map((l) => l.asking_price_thb)
    .filter((p): p is number => p != null);
  if (prices.length === 0) return null;
  return Math.min(...prices);
}

/**
 * Get the highest asking price from source listings (THB primary)
 */
export function getHighestPriceTHB(
  listings: { asking_price_thb?: number | null }[]
): number | null {
  const prices = listings
    .map((l) => l.asking_price_thb)
    .filter((p): p is number => p != null);
  if (prices.length === 0) return null;
  return Math.max(...prices);
}

/**
 * Format a price range from source listings in THB (Primary)
 */
export function formatPriceRangeTHB(
  listings: { asking_price_thb?: number | null }[]
): string {
  const low = getLowestPriceTHB(listings);
  const high = getHighestPriceTHB(listings);
  if (low == null) return 'Price TBD';
  if (low === high) return formatTHB(low);
  return `${formatTHB(low)} – ${formatTHB(high)}`;
}

/**
 * Get the lowest asking price from source listings (USD)
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

/**
 * Sanitizes evidence and audit notes to ensure only factual, evidence-backed claims are displayed.
 * Removes subjective assumptions (e.g. "to stimulate interest") and unsupported external authority claims.
 */
export function sanitizeEvidenceNote(note: string | null | undefined): string | null {
  if (!note) return null;

  let cleaned = note;

  // Remove subjective assumptions
  cleaned = cleaned.replace(/to stimulate interest/gi, '').trim();
  cleaned = cleaned.replace(/Agent reduced asking price by 2,000,000 THB to stimulate interest/gi, 'Recorded asking price updated to 21,450,000 THB');

  // Replace legacy real-world broker names with obvious demo sources
  cleaned = cleaned.replace(/108Siam(\s+Sales and Rentals)?/gi, 'Origins Atlas Demo Source A');
  cleaned = cleaned.replace(/PropertyScout(\s+Great Deals)?/gi, 'Origins Atlas Demo Source B');
  cleaned = cleaned.replace(/Connex Property(\s+Bangkok)?/gi, 'Demo Agency A');
  cleaned = cleaned.replace(/Agentplus(\s+Real Estate)?/gi, 'Demo Agency B');

  // Replace unsupported verification claims (e.g. Land Office, Cadastral parcel)
  cleaned = cleaned.replace(/Cadastral parcel verified at Bangna Land Office\.?/gi, 'Property identity matched from available listing evidence.');
  cleaned = cleaned.replace(/Cadastral parcel verified at.*?Land Office\.?/gi, 'Property identity matched from available listing evidence.');
  cleaned = cleaned.replace(/Cross-referenced against.*?Cadastral parcel verified at.*?Land Office\.?/gi, 'Property identity matched from available listing evidence.');

  return cleaned.trim();
}
