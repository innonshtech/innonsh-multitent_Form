import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_crm_jwt_secret_token';

/**
 * Hash a plain text password using bcrypt
 * @param {string} password 
 * @returns {Promise<string>} hashed password
 */
export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare plain password with stored hashed password
 * @param {string} password 
 * @param {string} hashedPassword 
 * @returns {Promise<boolean>} match status
 */
export async function comparePassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Sign a new JWT session token
 * @param {object} payload - user data like id, email, role
 * @returns {string} signed JWT token
 */
export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d', // Session valid for 7 days
  });
}

/**
 * Verify a JWT session token
 * @param {string} token 
 * @returns {object|null} decoded payload or null if invalid
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Extracts and verifies JWT from Next.js request headers or cookies
 * @param {Request} req - Next.js App Router Request object
 * @returns {object|null} Decoded user object or null if unauthorized
 */
export function getUserFromRequest(req) {
  try {
    let decoded = null;

    // 1. Check Authorization Header (Bearer token)
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      decoded = verifyToken(token);
    } else {
      // 2. Check HTTP-only cookies
      const cookieHeader = req.headers.get('cookie') || '';
      const cookies = Object.fromEntries(
        cookieHeader.split(';').map((c) => c.trim().split('='))
      );
      const token = cookies['token'];

      if (token) {
        decoded = verifyToken(token);
      }
    }

    if (decoded) {
      // STRICT MULTI-TENANT ISOLATION GATING:
      // Non-superadmins must have a valid orgId inside their session token to access any API.
      // If it is a legacy single-tenant session token without orgId, invalidate it immediately.
      if (!decoded.isSuperAdmin && !decoded.orgId) {
        console.warn(`⚠️ Security Alert: Rejected legacy token without orgId for user ${decoded.email}`);
        return null;
      }
      return decoded;
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Verifies if the requester has active access to a specific CRM module
 * @param {object} decodedUser - Decoded JWT payload
 * @param {string} moduleName - Name of module to gate
 * @returns {boolean} Access status
 */
export function checkModuleAccess(decodedUser, moduleName) {
  if (!decodedUser) return false;
  if (decodedUser.isSuperAdmin) return true; // Super Admins bypass all module checks
  if (!decodedUser.enabledModules) return true; // Fallback for backward compatibility
  return decodedUser.enabledModules.includes(moduleName);
}

/**
 * Verifies if a user has read access to a lead based on creator role and ownership rules
 * @param {object} lead - Lead object
 * @param {object} user - Decoded JWT user object
 * @returns {boolean} Visibility status
 */
export function checkLeadVisibility(lead, user, rolesPermissions = null) {
  if (!user) return false;
  if (user.isSuperAdmin) return true;

  const isPublic = lead.is_public || lead.isPublic || false;
  if (isPublic) return true;

  const userId = user.id || user._id;
  const userRole = user.role;

  // Extract creator and assignee details (handling both Mongo and Supabase shape)
  const leadCreatedBy = lead.createdBy || lead.created_by;
  const leadCreatedByRole = lead.createdByRole || lead.created_by_role;
  const leadAssignedTo = lead.assignedTo || lead.assigned_to;

  const creatorId = (leadCreatedBy && typeof leadCreatedBy === 'object') ? (leadCreatedBy.id || leadCreatedBy._id) : leadCreatedBy;
  const assigneeId = (leadAssignedTo && typeof leadAssignedTo === 'object') ? (leadAssignedTo.id || leadAssignedTo._id) : leadAssignedTo;

  // Rule 1: Creator or Assignee can always see the lead
  if (creatorId && creatorId.toString() === userId.toString()) return true;
  if (assigneeId && assigneeId.toString() === userId.toString()) return true;

  // Check dynamic permissions if provided
  if (rolesPermissions && rolesPermissions[userRole]) {
    const rolePerms = rolesPermissions[userRole];
    // Find permissions array for Leads Directory module
    const leadsPerm = Array.isArray(rolePerms) 
      ? rolePerms.find(p => p.module === 'Leads Directory')
      : rolePerms['Leads Directory'];

    if (leadsPerm) {
      const readScope = leadsPerm.read; // e.g. 'Global', 'Assigned Only', 'Personal Only', 'Team List only', 'No'
      if (readScope === 'Global') return true;
      if (readScope === 'No') return false;
      if (readScope === 'Team List only') {
        // Can see if they are the creator or assignee
        if (creatorId && creatorId.toString() === userId.toString()) return true;
        if (assigneeId && assigneeId.toString() === userId.toString()) return true;
        // Or if it was created by a sales rep or sales manager
        if (leadCreatedByRole === 'sales_rep' || leadCreatedByRole === 'sales_admin') return true;
        return false;
      }
      // If 'Assigned Only' or 'Personal Only', they are checked via Rule 1 (creatorId/assigneeId === userId)
      if (readScope === 'Assigned Only') return false;
    }
  }

  // Rule 2: Legacy leads (created_by is null)
  if (!creatorId) {
    if (userRole !== 'sales_rep') {
      return true; // Owners and managers see all legacy leads
    }
    // Sales reps see legacy leads if assigned to them or unassigned
    return !assigneeId || assigneeId.toString() === userId.toString();
  }

  // Rule 3: If created by a sales rep, owners and managers can see it, but other sales reps cannot (unless assigned)
  if (leadCreatedByRole === 'sales_rep') {
    return userRole === 'owner' || userRole === 'sales_admin';
  }

  // Rule 4: If created by a manager (sales_admin), owners and managers can see it, but sales reps cannot
  if (leadCreatedByRole === 'sales_admin') {
    return userRole === 'owner' || userRole === 'sales_admin';
  }

  // Rule 5: If created by an owner, other owners, managers and sales reps cannot see it (unless assigned)
  if (leadCreatedByRole === 'owner') {
    return false; // already checked creatorId === userId
  }

  return false;
}

/**
 * Verifies if a user has edit/delete access to a lead based on creator role and ownership rules
 * @param {object} lead - Lead object
 * @param {object} user - Decoded JWT user object
 * @param {object} [rolesPermissions] - Dynamic organization permission settings
 * @returns {boolean} Edit permission status
 */
export function checkLeadEditPermission(lead, user, rolesPermissions = null) {
  if (!user) return false;
  if (user.isSuperAdmin) return true;

  const userId = user.id || user._id;
  const userRole = user.role;

  // Check dynamic permissions if provided
  if (rolesPermissions && rolesPermissions[userRole]) {
    const rolePerms = rolesPermissions[userRole];
    const leadsPerm = Array.isArray(rolePerms) 
      ? rolePerms.find(p => p.module === 'Leads Directory')
      : rolePerms['Leads Directory'];

    if (leadsPerm) {
      const writeScope = leadsPerm.write; // 'Yes' or 'No'
      if (writeScope === 'No') return false;
      // If writeScope is Yes, we still check if they can see the lead
      return checkLeadVisibility(lead, user, rolesPermissions);
    }
  }

  // Owners and managers can edit/delete any lead they can see
  if (userRole === 'owner' || userRole === 'sales_admin') {
    return checkLeadVisibility(lead, user, rolesPermissions);
  }

  // Sales reps
  const leadCreatedBy = lead.createdBy || lead.created_by;
  const leadAssignedTo = lead.assignedTo || lead.assigned_to;

  const creatorId = (leadCreatedBy && typeof leadCreatedBy === 'object') ? (leadCreatedBy.id || leadCreatedBy._id) : leadCreatedBy;
  const assigneeId = (leadAssignedTo && typeof leadAssignedTo === 'object') ? (leadAssignedTo.id || leadAssignedTo._id) : leadAssignedTo;

  // Sales Rep can edit if they are creator or assignee
  if (creatorId && creatorId.toString() === userId.toString()) return true;
  if (assigneeId && assigneeId.toString() === userId.toString()) return true;

  // Sales Rep can edit if unassigned and visible
  if (!assigneeId) {
    return checkLeadVisibility(lead, user, rolesPermissions);
  }

  return false;
}


