import { supabaseAdmin, supabaseAnon } from '../supabaseClient.js';

export async function requireAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Missing bearer token' });
    }

    const { data, error } = await supabaseAnon.auth.getUser(token);
    if (error || !data.user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = data.user;
    req.accessToken = token;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(allowedRoles = ['admin', 'super_admin']) {
  return async (req, res, next) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('admin_roles')
        .select('role')
        .eq('user_id', req.user.id)
        .maybeSingle();

      if (error) return next(error);
      const role = data?.role;

      if (!role || !allowedRoles.includes(role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      req.userRole = role;
      next();
    } catch (error) {
      next(error);
    }
  };
}
