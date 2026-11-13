import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';

export const THB_TO_USD_EXCHANGE_RATE = 0.0271; // 1 THB = ~0.0271 USD (approx 36.9 THB per USD)

/**
 * Get an administrative Supabase client for secure server-side mutations.
 * Strictly requires SUPABASE_SERVICE_ROLE_KEY with NO fallback to the anon key.
 */
export function getAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('SECURITY CONFIGURATION ERROR: Missing NEXT_PUBLIC_SUPABASE_URL in server environment.');
  }

  if (!serviceKey) {
    throw new Error(
      'SECURITY CONFIGURATION ERROR: SUPABASE_SERVICE_ROLE_KEY is required for administrative mutations. ' +
      'Fallback to the public anon key has been strictly disabled to ensure all database writes execute exclusively through the service role.'
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createClient<any>(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Record an entry into the audit_logs table for tracking modifications.
 */
export async function logAuditEvent({
  tableName,
  recordId,
  action,
  changedBy = 'admin',
  oldValues = null,
  newValues = null,
  notes = null,
}: {
  tableName: string;
  recordId: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'ARCHIVE' | 'RESTORE';
  changedBy?: string;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  notes?: string | null;
}) {
  try {
    const supabase = getAdminSupabaseClient();
    await supabase.from('audit_logs').insert({
      table_name: tableName,
      record_id: recordId,
      action,
      changed_by: changedBy,
      old_values: oldValues,
      new_values: newValues,
      notes,
    } as any);
  } catch (error) {
    // Non-blocking catch to ensure mutation completes even if audit write has transient issues
    console.warn('[AuditLog] Warning recording audit event:', error);
  }
}

/**
 * Derive USD from Thai Baht using standard rate.
 */
export function deriveUsdFromThb(thb: number | null | undefined): number | null {
  if (thb == null || isNaN(thb)) return null;
  return Math.round(thb * THB_TO_USD_EXCHANGE_RATE * 100) / 100;
}

/**
 * Derive Thai Baht from USD if needed.
 */
export function deriveThbFromUsd(usd: number | null | undefined): number | null {
  if (usd == null || isNaN(usd)) return null;
  return Math.round((usd / THB_TO_USD_EXCHANGE_RATE) * 100) / 100;
}
