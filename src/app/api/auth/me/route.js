import { getUserFromRequest, comparePassword, hashPassword } from '@/lib/auth';
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/lib/models/User';
import { supabase } from '@/lib/supabaseClient';
import { mapUserToFrontend } from '@/lib/dbMapper';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    // 1. Get decoded user from token
    const decodedUser = getUserFromRequest(req);

    if (!decodedUser) {
      return NextResponse.json(
        { error: 'Unauthorized. No active session found.' },
        { status: 401 }
      );
    }

    let user = null;
    let userId = null;
    let userName = null;
    let userEmail = null;
    let userRole = null;
    let userIsActive = true;
    let userIsSuperAdmin = false;
    let userCompanyName = '';
    let userOrgId = null;
    let userGstin = '';
    let userEnabledModules = ['leads', 'deals', 'contacts', 'tasks', 'emails', 'calls', 'meetings', 'products', 'quotations', 'invoices', 'reports', 'analytics', 'users', 'roles', 'teams'];

    let userSectorId = 'SOFTWARE_SERVICES';
    let userSectorName = 'Software Services';
    let sectorConfig = {
      leadTerm: 'Lead',
      productTerm: 'Product',
      dealTerm: 'Deal',
      pipelineStages: ['Lead Capture', 'Demo Call', 'Negotiation', 'Won', 'Lost']
    };

    // 2. FRESH FETCH FROM DB
    if (supabase) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', decodedUser.id)
        .maybeSingle();

      if (error) {
        console.error('Supabase get-me fetch error:', error);
      } else if (data) {
        user = mapUserToFrontend(data);
        userId = data.id;
        userName = data.name;
        userEmail = data.email;
        userRole = data.role;
        userIsActive = data.is_active;
        userIsSuperAdmin = data.is_super_admin || data.role === 'superadmin';
        userOrgId = data.org_id;

        // Fetch organization details
        if (data.org_id && !data.is_super_admin) {
          const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .select('name, enabled_modules, gstin, sector')
            .eq('id', data.org_id)
            .maybeSingle();
          if (orgError) {
            console.error('Supabase organization fetch error:', orgError);
          } else if (orgData) {
            userCompanyName = orgData.name;
            userEnabledModules = orgData.enabled_modules || [];
            userGstin = orgData.gstin || '';
            const sectorIdVal = orgData.sector || 'SOFTWARE_SERVICES';

            // Fetch sector config details
            const { data: sectData } = await supabase
              .from('saas_sectors_config')
              .select('*')
              .eq('id', sectorIdVal)
              .maybeSingle();

            if (sectData) {
              userSectorId = sectData.id;
              userSectorName = sectData.name;
              sectorConfig = {
                leadTerm: sectData.lead_term || 'Lead',
                productTerm: sectData.product_term || 'Product',
                dealTerm: sectData.deal_term || 'Deal',
                pipelineStages: sectData.pipeline_stages || []
              };
            }
          }
        }
      }
    } else {
      await connectToDatabase();
      const mongoUser = await User.findById(decodedUser.id);
      if (mongoUser) {
        user = mongoUser;
        userId = mongoUser._id;
        userName = mongoUser.name;
        userEmail = mongoUser.email;
        userRole = mongoUser.role;
        userIsActive = mongoUser.isActive;
        userIsSuperAdmin = mongoUser.isSuperAdmin || mongoUser.role === 'superadmin';
        userOrgId = mongoUser.orgId || mongoUser.org_id || null;
      }
    }

    if (!user || !userIsActive) {
      return NextResponse.json(
        { error: 'User not found or deactivated.' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: userId,
        name: userName,
        email: userEmail,
        role: userRole,
        companyName: userCompanyName,
        isSuperAdmin: userIsSuperAdmin,
        orgId: userOrgId,
        enabledModules: userEnabledModules,
        gstin: userGstin,
        sectorId: userSectorId,
        sectorName: userSectorName,
        sectorConfig,
      },
    });
  } catch (error) {
    console.error('Check-session error:', error);
    return NextResponse.json(
      { error: 'Internal server error while verifying session.' },
      { status: 500 }
    );
  }
}

// PUT /api/auth/me - Update profile settings & secure password change
export async function PUT(req) {
  try {
    const decodedUser = getUserFromRequest(req);

    if (!decodedUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let user = null;
    let userId = null;
    let userName = null;
    let userEmail = null;
    let userRole = null;
    let userIsActive = true;
    let userHashedPassword = '';

    if (supabase) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', decodedUser.id)
        .maybeSingle();

      if (error) {
        console.error('Supabase fetch-me-put error:', error);
      } else if (data) {
        user = data;
        userId = data.id;
        userName = data.name;
        userEmail = data.email;
        userRole = data.role;
        userIsActive = data.is_active;
        userHashedPassword = data.password;
      }
    } else {
      await connectToDatabase();
      const mongoUser = await User.findById(decodedUser.id).select('+password');
      if (mongoUser) {
        user = mongoUser;
        userId = mongoUser._id;
        userName = mongoUser.name;
        userEmail = mongoUser.email;
        userRole = mongoUser.role;
        userIsActive = mongoUser.isActive;
        userHashedPassword = mongoUser.password;
      }
    }

    if (!user || !userIsActive) {
      return NextResponse.json({ error: 'User session not found or deactivated.' }, { status: 403 });
    }

    const { name, currentPassword, newPassword, gstin } = await req.json();

    let updatedName = userName;
    let updatedPassword = userHashedPassword;

    // 1. Update Name
    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json({ error: 'Profile name cannot be left blank.' }, { status: 400 });
      }
      updatedName = name.trim();
    }

    // 2. Securely Change Password using Bcrypt verification
    if (currentPassword && newPassword) {
      const isMatch = await comparePassword(currentPassword, userHashedPassword);
      if (!isMatch) {
        return NextResponse.json({ error: 'Incorrect current password.' }, { status: 400 });
      }

      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters long.' }, { status: 400 });
      }

      updatedPassword = await hashPassword(newPassword);
    }

    let updatedGstin = '';

    // 3. Update GSTIN (Only Organization Owners / Managers)
    if (gstin !== undefined && (userRole === 'owner' || userRole === 'sales_admin')) {
      if (supabase && decodedUser.orgId) {
        const { error: orgErr } = await supabase
          .from('organizations')
          .update({ gstin: gstin.trim() })
          .eq('id', decodedUser.orgId);
        if (orgErr) {
          console.error('Supabase organization gstin update error:', orgErr);
          throw orgErr;
        }
        updatedGstin = gstin.trim();
      }
    }

    // Save Updates
    if (supabase) {
      const { data, error } = await supabase
        .from('users')
        .update({
          name: updatedName,
          password: updatedPassword,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select('*')
        .single();

      if (error) {
        console.error('Supabase user profile update error:', error);
        throw error;
      }

      userName = data.name;

      // If GSTIN wasn't updated in this request, fetch current one to return
      if (gstin === undefined && data.org_id) {
        const { data: orgData } = await supabase
          .from('organizations')
          .select('gstin')
          .eq('id', data.org_id)
          .maybeSingle();
        if (orgData) {
          updatedGstin = orgData.gstin || '';
        }
      }
    } else {
      user.name = updatedName;
      user.password = updatedPassword;
      await user.save();
      userName = user.name;
    }

    return NextResponse.json({
      success: true,
      message: 'Profile settings updated successfully!',
      user: {
        id: userId,
        name: userName,
        email: userEmail,
        role: userRole,
        orgId: decodedUser.orgId,
        gstin: updatedGstin
      }
    });
  } catch (error) {
    console.error('Update profile settings API error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
