import { getUserFromRequest } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/superadmin/sectors - Retrieve all sectors
export async function GET(req) {
  try {
    const decodedUser = getUserFromRequest(req);
    if (!decodedUser || !decodedUser.isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized. Super Admin access only.' }, { status: 403 });
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 500 });
    }

    const { data: sectors, error } = await supabase
      .from('saas_sectors_config')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, sectors: sectors || [] });
  } catch (error) {
    console.error('Superadmin GET sectors error:', error);
    return NextResponse.json({ error: 'Failed to retrieve sectors.' }, { status: 500 });
  }
}

// POST /api/superadmin/sectors - Create a new sector
export async function POST(req) {
  try {
    const decodedUser = getUserFromRequest(req);
    if (!decodedUser || !decodedUser.isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized. Super Admin access only.' }, { status: 403 });
    }

    const { id, name, lead_term, product_term, deal_term, pipeline_stages } = await req.json();

    if (!id || !name || !lead_term || !product_term || !deal_term || !pipeline_stages) {
      return NextResponse.json({ error: 'Missing required parameters.' }, { status: 400 });
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 500 });
    }

    const sectorIdClean = id.trim().toUpperCase().replace(/\s+/g, '_');

    // Check if sector already exists
    const { data: existing } = await supabase
      .from('saas_sectors_config')
      .select('id')
      .eq('id', sectorIdClean)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: `Sector ID "${sectorIdClean}" already exists.` }, { status: 400 });
    }

    const { data: inserted, error: insertError } = await supabase
      .from('saas_sectors_config')
      .insert([
        {
          id: sectorIdClean,
          name: name.trim(),
          lead_term: lead_term.trim(),
          product_term: product_term.trim(),
          deal_term: deal_term.trim(),
          pipeline_stages: pipeline_stages || []
        }
      ])
      .select('*')
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ success: true, message: 'Sector created successfully.', sector: inserted }, { status: 201 });
  } catch (error) {
    console.error('Superadmin POST sector error:', error);
    return NextResponse.json({ error: 'Failed to create sector.' }, { status: 500 });
  }
}

// PUT /api/superadmin/sectors - Update an existing sector
export async function PUT(req) {
  try {
    const decodedUser = getUserFromRequest(req);
    if (!decodedUser || !decodedUser.isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized. Super Admin access only.' }, { status: 403 });
    }

    const { id, name, lead_term, product_term, deal_term, pipeline_stages } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Sector ID is required for update.' }, { status: 400 });
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 500 });
    }

    const { data: updated, error: updateError } = await supabase
      .from('saas_sectors_config')
      .update({
        name: name ? name.trim() : undefined,
        lead_term: lead_term ? lead_term.trim() : undefined,
        product_term: product_term ? product_term.trim() : undefined,
        deal_term: deal_term ? deal_term.trim() : undefined,
        pipeline_stages: pipeline_stages || undefined
      })
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, message: 'Sector updated successfully.', sector: updated });
  } catch (error) {
    console.error('Superadmin PUT sector error:', error);
    return NextResponse.json({ error: 'Failed to update sector.' }, { status: 500 });
  }
}

// DELETE /api/superadmin/sectors - Delete a sector
export async function DELETE(req) {
  try {
    const decodedUser = getUserFromRequest(req);
    if (!decodedUser || !decodedUser.isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized. Super Admin access only.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Sector ID is required for deletion.' }, { status: 400 });
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 500 });
    }

    const { error: deleteError } = await supabase
      .from('saas_sectors_config')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true, message: `Sector "${id}" deleted successfully.` });
  } catch (error) {
    console.error('Superadmin DELETE sector error:', error);
    return NextResponse.json({ error: 'Failed to delete sector.' }, { status: 500 });
  }
}
