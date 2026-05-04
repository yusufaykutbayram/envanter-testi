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

app.set('trust proxy', 1); // Required for rate limiting behind Vercel proxy

// Security Headers
app.use(helmet());

// CORS Configuration
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : true; // Allow all origins in development/unset environments

app.use(cors({
  origin: allowedOrigins,
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

const apiRouter = express.Router();
apiRouter.use('/admin', adminRouter);
apiRouter.use('/', analyzeRouter);

app.use('/api', apiRouter);
app.use('/', (req, res, next) => {
  if (req.url.startsWith('/api')) return next();
  apiRouter(req, res, next);
});

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
