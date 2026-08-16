import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import prisma from '../../shared/prisma';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { sendSuccess, sendPaginated, parsePagination } from '../../shared/helpers';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { chapaService } from '../../shared/chapa';
import { env } from '../../config/env';

const router = Router();

// Get all users (admin only)
router.get(
  '/',
  authenticate,
  authorize(Role.ADMIN, Role.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, skip } = parsePagination(req.query as any);
      const search = req.query.search as string | undefined;
      const role = req.query.role as Role | undefined;

      const where: any = {};
      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }
      if (role) where.role = role;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true, email: true, firstName: true, lastName: true,
            role: true, avatar: true, department: true, studentId: true,
            isActive: true, isVerified: true, streakCount: true,
            createdAt: true, lastLoginAt: true,
            _count: { select: { registrations: true, attendance: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.user.count({ where }),
      ]);

      sendPaginated(res, users, total, page, limit);
    } catch (error) {
      next(error);
    }
  }
);

// Get user by ID
router.get(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.params.id },
        select: {
          id: true, email: true, firstName: true, lastName: true,
          role: true, avatar: true, department: true, bio: true,
          interests: true, streakCount: true, badges: true,
          studentId: true, createdAt: true,
          university: { select: { id: true, name: true } },
          _count: {
            select: { registrations: true, attendance: true, certificates: true, feedback: true },
          },
        },
      });

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }
);

// Update user profile
router.put(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Users can only update their own profile unless admin
      if (req.user!.id !== req.params.id && !['ADMIN', 'SUPER_ADMIN'].includes(req.user!.role)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }

      const { firstName, lastName, department, bio, phone, interests, avatar } = req.body;

      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(department !== undefined && { department }),
          ...(bio !== undefined && { bio }),
          ...(phone !== undefined && { phone }),
          ...(interests && { interests }),
          ...(avatar && { avatar }),
        },
        select: {
          id: true, email: true, firstName: true, lastName: true,
          role: true, avatar: true, department: true, bio: true,
          interests: true, phone: true,
        },
      });

      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }
);

// Change user role (super admin only)
router.patch(
  '/:id/role',
  authenticate,
  authorize(Role.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { role } = req.body;
      if (!['STUDENT', 'ORGANIZER', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid role' });
      }

      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: { role },
        select: { id: true, email: true, firstName: true, lastName: true, role: true },
      });

      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }
);

// Activate (approve) a vendor/organizer — Super Admin only
router.patch(
  '/:id/activate',
  authenticate,
  authorize(Role.SUPER_ADMIN, Role.ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: { isActive: true, isVerified: true },
        select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, isVerified: true },
      });
      sendSuccess(res, user, 200, { message: 'User activated successfully' });
    } catch (error) {
      next(error);
    }
  }
);

// Suspend a user — Super Admin only
router.patch(
  '/:id/suspend',
  authenticate,
  authorize(Role.SUPER_ADMIN, Role.ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: { isActive: false },
        select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true },
      });
      sendSuccess(res, user, 200, { message: 'User suspended successfully' });
    } catch (error) {
      next(error);
    }
  }
);

// Get pending vendors (ORGANIZER role, not yet verified/active)
router.get(
  '/pending/vendors',
  authenticate,
  authorize(Role.SUPER_ADMIN, Role.ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const vendors = await prisma.user.findMany({
        where: { role: Role.ORGANIZER, isVerified: false },
        select: {
          id: true, email: true, firstName: true, lastName: true,
          department: true, createdAt: true, isActive: true, isVerified: true,
          _count: { select: { organizedEvents: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      sendSuccess(res, vendors);
    } catch (error) {
      next(error);
    }
  }
);

// Initialize Vendor Workspace Payment
router.post(
  '/workspace/pay',
  authenticate,
  authorize(Role.ORGANIZER),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      if (user.hasPaidWorkspace) {
        return res.status(400).json({ success: false, message: 'Workspace already paid' });
      }

      const txRef = `wrk_${user.id}_${Date.now()}`;

      await prisma.user.update({
        where: { id: user.id },
        data: { workspaceTxRef: txRef }
      });

      const checkoutUrl = await chapaService.initialize({
        amount: 1000, // Workspace subscription fee
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        tx_ref: txRef,
        callback_url: `${env.FRONTEND_URL}/api/payments/verify-workspace/${txRef}`,
        return_url: `${env.FRONTEND_URL}/dashboard/organizer`,
        customization: {
          title: 'EventHub DBU Vendor Workspace',
          description: 'Payment for Organizer Workspace Activation',
        }
      });

      sendSuccess(res, { checkoutUrl });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
