import { supabaseAnon, supabaseAdmin } from '../../config/supabase.js';
import { AppError } from '../errors/AppError.js';

export async function authMiddleware(req, _res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Missing or invalid authorization header', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.slice(7);
    const { data: { user }, error } = await supabaseAnon.auth.getUser(token);

    if (error || !user) {
      throw new AppError('Invalid or expired token', 401, 'UNAUTHORIZED');
    }

    // Load profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, status, last_active_academy_id')
      .eq('auth_user_id', user.id)
      .single();

    if (profileError || !profile) {
      throw new AppError('Profile not found', 401, 'PROFILE_NOT_FOUND');
    }

    if (profile.status === 'blocked') {
      throw new AppError('Account is blocked', 403, 'ACCOUNT_BLOCKED');
    }

    // Load platform role
    const { data: platformRoleRow } = await supabaseAdmin
      .from('profile_platform_roles')
      .select('platform_roles(code)')
      .eq('profile_id', profile.id)
      .maybeSingle();

    req.context.userId = user.id;
    req.context.profileId = profile.id;
    req.context.platformRole = platformRoleRow?.platform_roles?.code || null;

    next();
  } catch (err) {
    next(err);
  }
}
