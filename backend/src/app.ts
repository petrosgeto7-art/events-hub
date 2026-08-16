import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import path from 'path';
import fs from 'fs';

import { env } from './config/env';
import { generalLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { initializeSocket } from './socket';
import logger from './shared/logger';
import { startAutoCertificateCron } from './cron/auto-certificates';

// Import routes
import authRoutes from './modules/auth/auth.routes';
import eventsRoutes from './modules/events/events.routes';
import registrationsRoutes from './modules/registrations/registrations.routes';
import attendanceRoutes from './modules/attendance/attendance.routes';
import feedbackRoutes from './modules/feedback/feedback.routes';
import usersRoutes from './modules/users/users.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import categoriesRoutes from './modules/categories/categories.routes';
import certificatesRoutes from './modules/certificates/certificates.routes';
import paymentsRoutes from './modules/payments/payments.routes';
import commissionsRoutes from './modules/commissions/commissions.routes';

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
const io = initializeSocket(httpServer);
app.set('io', io);

// Start background cron jobs
startAutoCertificateCron();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(generalLimiter);

// Static file serving for uploads
app.use('/uploads', express.static(uploadsDir));

// ============================================================
// API ROUTES
// ============================================================

app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api', registrationsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api', feedbackRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/certificates', certificatesRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/commissions', commissionsRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.1.0',
    uptime: Math.floor(process.uptime()),
    environment: env.NODE_ENV,
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use(errorHandler);

// ============================================================
// START SERVER (only when not running as serverless on Vercel)
// ============================================================

if (!process.env.VERCEL) {
  httpServer.listen(env.PORT, () => {
    logger.info(`🚀 EventHub API running on http://localhost:${env.PORT}`);
    logger.info(`📡 Socket.io ready for connections`);
    logger.info(`🌍 Environment: ${env.NODE_ENV}`);
  });
}

export default app;
