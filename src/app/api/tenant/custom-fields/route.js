import { getUserFromRequest } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/tenant/custom-fields?module=leads
// Returns all custom field definitions for the calling org+module
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const moduleName = searchParams.get('module') || 'leads';

    const { data, error } = await supabase
      .from('custom_field_definitions')
      .select('*')
      .eq('org_id', user.orgId)
      .eq('module', moduleName)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, fields: data || [] });
  } catch (err) {
    console.error('GET custom-fields error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/tenant/custom-fields
// Add a new custom field definition (owner only)
// Body: { module, field_key, field_label, field_type, options, is_required }
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    if (user.role !== 'owner') {
      return NextResponse.json({ error: 'Only organization owners can manage custom fields.' }, { status: 403 });
    }

    const body = await req.json();
    const { module: moduleName = 'leads', field_key, field_label, field_type, options = [], is_required = false, placeholder = '', icon_name = null } = body;

    if (!field_key || !field_label || !field_type) {
      return NextResponse.json({ error: 'field_key, field_label, and field_type are required.' }, { status: 400 });
    }

    // Sanitize field_key: lowercase, underscores only
    const cleanKey = field_key.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    if (!cleanKey) {
      return NextResponse.json({ error: 'Invalid field key. Use letters and underscores only.' }, { status: 400 });
    }

    // Get current max sort_order for this org+module
    const { data: existing } = await supabase
      .from('custom_field_definitions')
      .select('sort_order')
      .eq('org_id', user.orgId)
      .eq('module', moduleName)
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextOrder = existing && existing.length > 0 ? (existing[0].sort_order + 1) : 0;

    const { data, error } = await supabase
      .from('custom_field_definitions')
      .insert([{
        org_id: user.orgId,
        module: moduleName,
        field_key: cleanKey,
        field_label: field_label.trim(),
        field_type,
        options: Array.isArray(options) ? options : [],
        is_required: Boolean(is_required),
        placeholder: placeholder ? placeholder.trim() : '',
        icon_name: icon_name ? icon_name.trim() : null,
        sort_order: nextOrder,
      }])
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: `A field with key "${cleanKey}" already exists for this module.` }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, field: data }, { status: 201 });
  } catch (err) {
    console.error('POST custom-fields error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/tenant/custom-fields
// Update a custom field definition (owner only)
// Body: { id, field_label, options, is_required }
// ─────────────────────────────────────────────────────────────────────────────
export async function PUT(req) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    if (user.role !== 'owner') {
      return NextResponse.json({ error: 'Only organization owners can manage custom fields.' }, { status: 403 });
    }

    const { id, field_label, options, is_required, placeholder, icon_name } = await req.json();
    if (!id) return NextResponse.json({ error: 'Field id is required.' }, { status: 400 });

    const updatePayload = {};
    if (field_label !== undefined) updatePayload.field_label = field_label.trim();
    if (options !== undefined) updatePayload.options = Array.isArray(options) ? options : [];
    if (is_required !== undefined) updatePayload.is_required = Boolean(is_required);
    if (placeholder !== undefined) updatePayload.placeholder = placeholder ? placeholder.trim() : '';
    if (icon_name !== undefined) updatePayload.icon_name = icon_name ? icon_name.trim() : null;

    const { data, error } = await supabase
      .from('custom_field_definitions')
      .update(updatePayload)
      .eq('id', id)
      .eq('org_id', user.orgId) // Ensure isolation
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, field: data });
  } catch (err) {
    console.error('PUT custom-fields error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/tenant/custom-fields?id=<uuid>
// Delete a custom field definition (owner only)
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(req) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    if (user.role !== 'owner') {
      return NextResponse.json({ error: 'Only organization owners can manage custom fields.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Field id is required.' }, { status: 400 });

    const { error } = await supabase
      .from('custom_field_definitions')
      .delete()
      .eq('id', id)
      .eq('org_id', user.orgId);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Custom field deleted.' });
  } catch (err) {
    console.error('DELETE custom-fields error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
