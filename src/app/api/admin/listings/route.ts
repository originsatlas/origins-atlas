import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth';
import { getAdminSupabaseClient, logAuditEvent, deriveUsdFromThb, deriveThbFromUsd } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Admin session required' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      house_id,
      agent_id,
      source_url,
      source_listing_id,
      asking_price_thb,
      asking_price_usd,
      price_per_sqm_thb,
      price_per_sqm_usd,
      listing_date,
      last_seen_date,
      is_active,
      listing_description,
      listing_images,
    } = body;

    if (!house_id || !agent_id) {
      return NextResponse.json({ error: 'House and Agent selections are required' }, { status: 400 });
    }

    // Determine THB as primary, derive USD
    let finalThb = asking_price_thb ? parseFloat(asking_price_thb) : null;
    let finalUsd = asking_price_usd ? parseFloat(asking_price_usd) : null;

    if (finalThb && !finalUsd) {
      finalUsd = deriveUsdFromThb(finalThb);
    } else if (finalUsd && !finalThb) {
      finalThb = deriveThbFromUsd(finalUsd);
    }

    const supabase = getAdminSupabaseClient();
    const { data, error } = await supabase
      .from('source_listings')
      .insert({
        house_id,
        agent_id,
        source_url: source_url || null,
        source_listing_id: source_listing_id || null,
        asking_price_thb: finalThb,
        asking_price_usd: finalUsd,
        price_per_sqm_thb: price_per_sqm_thb ? parseFloat(price_per_sqm_thb) : null,
        price_per_sqm_usd: price_per_sqm_usd ? parseFloat(price_per_sqm_usd) : null,
        listing_date: listing_date || null,
        last_seen_date: last_seen_date || null,
        is_active: is_active ?? true,
        listing_description: listing_description || null,
        listing_images: Array.isArray(listing_images) ? listing_images : [],
        is_archived: false,
        created_by: session.email,
        updated_by: session.email,
      } as any)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Note: The database trigger `trg_record_listing_price_change` automatically
    // creates the initial append-only record in `price_history`.

    await logAuditEvent({
      tableName: 'source_listings',
      recordId: data.id,
      action: 'INSERT',
      changedBy: session.email,
      newValues: data,
    });

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Admin session required' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      id,
      house_id,
      agent_id,
      source_url,
      source_listing_id,
      asking_price_thb,
      asking_price_usd,
      price_per_sqm_thb,
      price_per_sqm_usd,
      listing_date,
      last_seen_date,
      is_active,
      listing_description,
      listing_images,
    } = body;

    if (!id || !house_id || !agent_id) {
      return NextResponse.json({ error: 'ID, House, and Agent are required' }, { status: 400 });
    }

    let finalThb = asking_price_thb != null && asking_price_thb !== '' ? parseFloat(asking_price_thb) : null;
    let finalUsd = asking_price_usd != null && asking_price_usd !== '' ? parseFloat(asking_price_usd) : null;

    if (finalThb != null && finalUsd == null) {
      finalUsd = deriveUsdFromThb(finalThb);
    } else if (finalUsd != null && finalThb == null) {
      finalThb = deriveThbFromUsd(finalUsd);
    }

    const supabase = getAdminSupabaseClient();
    const { data: existing } = await supabase.from('source_listings').select('*').eq('id', id).single();

    const { data, error } = await supabase
      .from('source_listings')
      .update({
        house_id,
        agent_id,
        source_url: source_url || null,
        source_listing_id: source_listing_id || null,
        asking_price_thb: finalThb,
        asking_price_usd: finalUsd,
        price_per_sqm_thb: price_per_sqm_thb ? parseFloat(price_per_sqm_thb) : null,
        price_per_sqm_usd: price_per_sqm_usd ? parseFloat(price_per_sqm_usd) : null,
        listing_date: listing_date || null,
        last_seen_date: last_seen_date || null,
        is_active: is_active ?? true,
        listing_description: listing_description || null,
        listing_images: Array.isArray(listing_images) ? listing_images : [],
        updated_by: session.email,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Note: The database trigger `trg_record_listing_price_change` automatically
    // catches any change in price and writes an immutable record to `price_history`.

    await logAuditEvent({
      tableName: 'source_listings',
      recordId: id,
      action: 'UPDATE',
      changedBy: session.email,
      oldValues: existing,
      newValues: data,
    });

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Admin session required' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID parameter is required' }, { status: 400 });
    }

    const supabase = getAdminSupabaseClient();
    const { data: existing } = await supabase.from('source_listings').select('*').eq('id', id).single();

    // Soft delete (archive)
    const { data, error } = await supabase
      .from('source_listings')
      .update({
        is_archived: true,
        archived_at: new Date().toISOString(),
        archived_by: session.email,
        updated_by: session.email,
        is_active: false,
      } as any)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logAuditEvent({
      tableName: 'source_listings',
      recordId: id,
      action: 'ARCHIVE',
      changedBy: session.email,
      oldValues: existing,
      newValues: data,
      notes: 'Listing archived via soft-delete; historical prices preserved',
    });

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
