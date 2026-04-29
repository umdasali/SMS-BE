import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth';
import onboardingRoutes from './routes/onboarding';
import tenantRoutes from './routes/tenants';
import studentRoutes from './routes/students';
import teacherRoutes from './routes/teachers';
import classRoutes from './routes/classes';
import subjectRoutes from './routes/subjects';
import routineRoutes from './routes/routines';
import attendanceRoutes from './routes/attendance';
import examRoutes from './routes/exams';
import certificateRoutes from './routes/certificates';
import dashboardRoutes from './routes/dashboard';
import profileRoutes from './routes/profile';
import financeRoutes from './routes/finance';
import assetRoutes from './routes/assets';
import announcementRoutes from './routes/announcements';
import publicRoutes from './routes/public';

const app = express();

// Build allowed origins from env var (comma-separated).
// In development, always allow localhost variants.
const envOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const devOrigins =
  process.env.NODE_ENV !== 'production'
    ? ['http://localhost:3000', 'http://127.0.0.1:3000']
    : [];

const allowedOrigins = Array.from(new Set([...devOrigins, ...envOrigins]));

// Security middleware
app.use(helmet());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body & cookie parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
const API = '/api/v1';
app.use(`${API}/auth`, authRoutes);
app.use(`${API}/onboarding`, onboardingRoutes);
app.use(`${API}/tenants`, tenantRoutes);
app.use(`${API}/students`, studentRoutes);
app.use(`${API}/teachers`, teacherRoutes);
app.use(`${API}/classes`, classRoutes);
app.use(`${API}/subjects`, subjectRoutes);
app.use(`${API}/routines`, routineRoutes);
app.use(`${API}/attendance`, attendanceRoutes);
app.use(`${API}/exams`, examRoutes);
app.use(`${API}/certificates`, certificateRoutes);
app.use(`${API}/dashboard`, dashboardRoutes);
app.use(`${API}/profile`, profileRoutes);
app.use(`${API}/finance`, financeRoutes);
app.use(`${API}/assets`, assetRoutes);
app.use(`${API}/announcements`, announcementRoutes);
app.use(`${API}/public`, publicRoutes);

// 404
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use(errorHandler);

export default app;
