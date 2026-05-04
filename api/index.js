// Vercel Serverless Function entry point
// This file must be in /api directory for Vercel to recognize it as a function

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import dotenv from 'dotenv';

// Load env vars from backend directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../backend/.env') });
dotenv.config(); // Also try root .env

// Now import the app
import app from '../backend/src/app.js';

export default app;
