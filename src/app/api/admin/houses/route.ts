import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth';
import { getAdminSupabaseClient, logAuditEvent } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Admin session required' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      community_id,
      house_number,
      address,
      property_type,
      bedrooms,
      bathrooms,
      parking_spaces,
      house_size_sqm,
      land_size_sqm,
      floors,
      year_built,
      features,
      description,
      main_image_url,
      image_urls,
      status,
      is_new_listing,
      has_price_reduction,
    } = body;

    if (!community_id) {
      return NextResponse.json({ error: 'Community is required' }, { status: 400 });
    }

    const supabase = getAdminSupabaseClient();
    const { data, error } = await supabase
      .from('houses')
      .insert({
        community_id,
        house_number: house_number || null,
        address: address || null,
        property_type: property_type || 'detached_house',
        bedrooms: bedrooms ? parseInt(bedrooms) : null,
        bathrooms: bathrooms ? parseInt(bathrooms) : null,
        parking_spaces: parking_spaces ? parseInt(parking_spaces) : null,
        house_size_sqm: house_size_sqm ? parseFloat(house_size_sqm) : null,
        land_size_sqm: land_size_sqm ? parseFloat(land_size_sqm) : null,
        floors: floors ? parseInt(floors) : null,
        year_built: year_built ? parseInt(year_built) : null,
        features: Array.isArray(features) ? features : [],
        description: description || null,
        main_image_url: main_image_url || null,
        image_urls: Array.isArray(image_urls) ? image_urls : [],
        status: status || 'active',
        is_new_listing: is_new_listing ?? true,
        has_price_reduction: has_price_reduction ?? false,
        is_archived: false,
        created_by: session.email,
        updated_by: session.email,
      } as any)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logAuditEvent({
      tableName: 'houses',
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
      community_id,
      house_number,
      address,
      property_type,
      bedrooms,
      bathrooms,
      parking_spaces,
      house_size_sqm,
      land_size_sqm,
      floors,
      year_built,
      features,
      description,
      main_image_url,
      image_urls,
      status,
      is_new_listing,
      has_price_reduction,
    } = body;

    if (!id || !community_id) {
      return NextResponse.json({ error: 'House ID and Community are required' }, { status: 400 });
    }

    const supabase = getAdminSupabaseClient();
    const { data: existing } = await supabase.from('houses').select('*').eq('id', id).single();

    const { data, error } = await supabase
      .from('houses')
      .update({
        community_id,
        house_number: house_number || null,
        address: address || null,
        property_type: property_type || 'detached_house',
        bedrooms: bedrooms ? parseInt(bedrooms) : null,
        bathrooms: bathrooms ? parseInt(bathrooms) : null,
        parking_spaces: parking_spaces ? parseInt(parking_spaces) : null,
        house_size_sqm: house_size_sqm ? parseFloat(house_size_sqm) : null,
        land_size_sqm: land_size_sqm ? parseFloat(land_size_sqm) : null,
        floors: floors ? parseInt(floors) : null,
        year_built: year_built ? parseInt(year_built) : null,
        features: Array.isArray(features) ? features : [],
        description: description || null,
        main_image_url: main_image_url || null,
        image_urls: Array.isArray(image_urls) ? image_urls : [],
        status: status || 'active',
        is_new_listing: is_new_listing ?? true,
        has_price_reduction: has_price_reduction ?? false,
        updated_by: session.email,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logAuditEvent({
      tableName: 'houses',
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
    const { data: existing } = await supabase.from('houses').select('*').eq('id', id).single();

    // Soft delete (archive) — Archive is the exclusive deletion behavior
    const { data, error } = await supabase
      .from('houses')
      .update({
        is_archived: true,
        archived_at: new Date().toISOString(),
        archived_by: session.email,
        updated_by: session.email,
        status: 'archived',
      } as any)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logAuditEvent({
      tableName: 'houses',
      recordId: id,
      action: 'ARCHIVE',
      changedBy: session.email,
      oldValues: existing,
      newValues: data,
      notes: 'House archived via soft-delete',
    });

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

