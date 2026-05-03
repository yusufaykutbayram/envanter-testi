import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import dotenv from 'dotenv';
import analyzeRouter from './routes/analyze.js';
import adminRouter from './routes/admin.js';
import logger from './utils/logger.js';

dotenv.config();

const app = express();

// Security Headers
app.use(helmet());

// CORS Configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Çok fazla istek gönderildi, lütfen daha sonra tekrar deneyiniz.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

app.use(express.json({ limit: '50kb' }));

// Request logging middleware
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

app.use('/api', analyzeRouter);
app.use('/api/admin', adminRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  const message = err.message || 'Sunucu hatası oluştu';
  logger.error(`${status} — ${message}`, { stack: err.stack });
  res.status(status).json({ error: message });
});

export default app;
