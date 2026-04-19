import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import User from '../models/User';
import Tenant from '../models/Tenant';
import { sendError } from '../utils/response';

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken as string;
    }

    if (!token) {
      sendError(res, 'Not authorized. No token provided.', 401);
      return;
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      sendError(res, 'Not authorized. User not found or inactive.', 401);
      return;
    }

    req.user = user;
    req.tenantId = user.tenantId?.toString();

    // For tenant users (not saas_admin), enforce institution status and subscription.
    if (user.role !== 'saas_admin' && user.tenantId) {
      const tenant = await Tenant.findById(user.tenantId)
        .select('status subscription')
        .lean();

      if (!tenant) {
        sendError(res, 'Institution not found.', 403);
        return;
      }

      if (tenant.status === 'inactive') {
        sendError(res, 'Your institution account has been suspended. Please contact support.', 403);
        return;
      }

      if (tenant.subscription?.status === 'suspended') {
        sendError(res, 'Your institution subscription has been suspended due to non-payment. Please contact the administrator.', 403);
        return;
      }

      if (tenant.subscription?.expiresAt && new Date() > new Date(tenant.subscription.expiresAt)) {
        sendError(res, 'Your institution subscription has expired. Please contact the administrator to renew.', 403);
        return;
      }
    }

    next();
  } catch {
    sendError(res, 'Not authorized. Invalid token.', 401);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      sendError(res, `Role '${req.user?.role}' is not authorized for this action.`, 403);
      return;
    }
    next();
  };
};
