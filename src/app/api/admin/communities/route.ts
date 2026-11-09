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
    const { name, slug, description, location, city, province, country, total_units, community_type, amenities } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const supabase = getAdminSupabaseClient();
    const { data, error } = await supabase
      .from('communities')
      .insert({
        name,
        slug,
        description: description || null,
        location: location || null,
        city: city || null,
        province: province || null,
        country: country || 'TH',
        total_units: total_units ? parseInt(total_units) : null,
        community_type: community_type || 'gated_community',
        amenities: Array.isArray(amenities) ? amenities : [],
        created_by: session.email,
        updated_by: session.email,
        is_archived: false,
      } as any)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logAuditEvent({
      tableName: 'communities',
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
    const { id, name, slug, description, location, city, province, country, total_units, community_type, amenities } = body;

    if (!id || !name || !slug) {
      return NextResponse.json({ error: 'ID, name, and slug are required' }, { status: 400 });
    }

    const supabase = getAdminSupabaseClient();

    // Fetch existing for audit log
    const { data: existing } = await supabase.from('communities').select('*').eq('id', id).single();

    const { data, error } = await supabase
      .from('communities')
      .update({
        name,
        slug,
        description: description || null,
        location: location || null,
        city: city || null,
        province: province || null,
        country: country || 'TH',
        total_units: total_units ? parseInt(total_units) : null,
        community_type: community_type || 'gated_community',
        amenities: Array.isArray(amenities) ? amenities : [],
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
      tableName: 'communities',
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
    const { data: existing } = await supabase.from('communities').select('*').eq('id', id).single();

    // Soft delete (archive)
    const { data, error } = await supabase
      .from('communities')
      .update({
        is_archived: true,
        archived_at: new Date().toISOString(),
        archived_by: session.email,
        updated_by: session.email,
      } as any)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logAuditEvent({
      tableName: 'communities',
      recordId: id,
      action: 'ARCHIVE',
      changedBy: session.email,
      oldValues: existing,
      newValues: data,
      notes: 'Community archived via soft-delete',
    });

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
