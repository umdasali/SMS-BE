import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import User from '../models/User';
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
    // Set tenantId for multi-tenancy filters. saas_admin may not have one.
    req.tenantId = user.tenantId?.toString();
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
