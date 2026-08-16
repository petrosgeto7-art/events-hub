import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { ForbiddenError, UnauthorizedError } from '../shared/errors';

/**
 * Role-Based Access Control middleware.
 * Usage: authorize(Role.ADMIN, Role.SUPER_ADMIN)
 */
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }

    next();
  };
}

/**
 * Ensure user can only access their own resources or is admin.
 */
export function authorizeOwnerOrAdmin(userIdParam: string = 'id') {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    const targetUserId = req.params[userIdParam];
    const isOwner = req.user.id === targetUserId;
    const isAdmin = ([Role.ADMIN, Role.SUPER_ADMIN] as Role[]).includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return next(new ForbiddenError('Access denied'));
    }

    next();
  };
}
