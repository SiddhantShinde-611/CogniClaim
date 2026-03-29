import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';

export const requireRole = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthenticated' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Insufficient permissions. Required: ${roles.join(' or ')}`,
      });
      return;
    }
    next();
  };
};

export const requireAdmin = requireRole('ADMIN');
export const requireManager = requireRole('ADMIN', 'MANAGER');
export const requireEmployee = requireRole('ADMIN', 'MANAGER', 'EMPLOYEE');
