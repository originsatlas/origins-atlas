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
    const { name, source_platform, contact_email, contact_phone, website_url, logo_url, is_verified } = body;

    if (!name) {
      return NextResponse.json({ error: 'Agent name is required' }, { status: 400 });
    }

    const supabase = getAdminSupabaseClient();
    const basePayload = {
      name,
      source_platform: source_platform || null,
      contact_email: contact_email || null,
      contact_phone: contact_phone || null,
      website_url: website_url || null,
      logo_url: logo_url || null,
      is_verified: is_verified ?? false,
    };

    let { data, error } = await supabase
      .from('agents')
      .insert({
        ...basePayload,
        is_archived: false,
        created_by: session.email,
        updated_by: session.email,
      } as any)
      .select()
      .single();

    // Fallback if Stage 1 columns have not yet been migrated in Supabase
    if (error && (error.message?.includes('created_by') || error.message?.includes('is_archived'))) {
      const fallback = await supabase
        .from('agents')
        .insert(basePayload as any)
        .select()
        .single();
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logAuditEvent({
      tableName: 'agents',
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
    const { id, name, source_platform, contact_email, contact_phone, website_url, logo_url, is_verified } = body;

    if (!id || !name) {
      return NextResponse.json({ error: 'Agent ID and name are required' }, { status: 400 });
    }

    const supabase = getAdminSupabaseClient();
    const { data: existing } = await supabase.from('agents').select('*').eq('id', id).single();

    const baseUpdate = {
      name,
      source_platform: source_platform || null,
      contact_email: contact_email || null,
      contact_phone: contact_phone || null,
      website_url: website_url || null,
      logo_url: logo_url || null,
      is_verified: is_verified ?? false,
      updated_at: new Date().toISOString(),
    };

    let { data, error } = await supabase
      .from('agents')
      .update({
        ...baseUpdate,
        updated_by: session.email,
      } as any)
      .eq('id', id)
      .select()
      .single();

    if (error && error.message?.includes('updated_by')) {
      const fallback = await supabase
        .from('agents')
        .update(baseUpdate as any)
        .eq('id', id)
        .select()
        .single();
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logAuditEvent({
      tableName: 'agents',
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
    const { data: existing } = await supabase.from('agents').select('*').eq('id', id).single();

    // Soft delete (archive)
    let { data, error } = await supabase
      .from('agents')
      .update({
        is_archived: true,
        archived_at: new Date().toISOString(),
        archived_by: session.email,
        updated_by: session.email,
      } as any)
      .eq('id', id)
      .select()
      .single();

    // Fallback if is_archived column does not exist yet
    if (error && error.message?.includes('is_archived')) {
      const fallback = await supabase
        .from('agents')
        .delete()
        .eq('id', id);
      if (fallback.error) {
        return NextResponse.json({ error: fallback.error.message }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: 'Deleted' });
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logAuditEvent({
      tableName: 'agents',
      recordId: id,
      action: 'ARCHIVE',
      changedBy: session.email,
      oldValues: existing,
      newValues: data,
      notes: 'Agent archived via soft-delete',
    });

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

