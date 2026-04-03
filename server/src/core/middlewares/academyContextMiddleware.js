import { supabaseAdmin } from '../../config/supabase.js';
import { AppError } from '../errors/AppError.js';

export async function academyContextMiddleware(req, _res, next) {
  try {
    const academyId = req.params.academyId || req.headers['x-academy-id'];

    if (!academyId) {
      throw new AppError('Academy context required', 400, 'MISSING_ACADEMY_CONTEXT');
    }

    if (req.context.platformRole === 'super_admin') {
      req.context.activeAcademyId = academyId;
      req.context.academyRole = 'super_admin';
      req.context.permissions = ['*'];
      return next();
    }

    const { data: membership, error } = await supabaseAdmin
      .from('academy_memberships')
      .select('id, role_code, status')
      .eq('academy_id', academyId)
      .eq('profile_id', req.context.profileId)
      .eq('status', 'active')
      .maybeSingle();

    if (error || !membership) {
      throw new AppError('No active membership in this academy', 403, 'NO_ACADEMY_ACCESS');
    }

    const { data: rolePermissions } = await supabaseAdmin
      .from('academy_role_permissions')
      .select('permission_code')
      .eq('role_code', membership.role_code);

    req.context.activeAcademyId = academyId;
    req.context.academyRole = membership.role_code;
    req.context.permissions = rolePermissions?.map((p) => p.permission_code) || [];

    next();
  } catch (err) {
    next(err);
  }
}
