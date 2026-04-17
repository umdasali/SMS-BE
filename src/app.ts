import express from 'express';
import cors from 'cors';
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
import publicRoutes from './routes/public';

const app = express();
const configuredOrigins = process.env.FRONTEND_URL || 'http://localhost:3000';

// const allowedOrigins = new Set(configuredOrigins);
// const localOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
console.log(configuredOrigins, 'before')
// Security middleware
// app.use(helmet());
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://10.222.209.148:3000'
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    // methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    // allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
// app.options('/', cors());

console.log(configuredOrigins, 'after')

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
app.use(`${API}/public`, publicRoutes);

// 404
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use(errorHandler);

export default app;
