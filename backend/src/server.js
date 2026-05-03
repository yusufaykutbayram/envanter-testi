import app from './app.js';
import logger from './utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  logger.info(`✓ Backend running on http://localhost:${PORT}`);
  if (!process.env.OPENAI_API_KEY) logger.warn('⚠  OPENAI_API_KEY tanımlı değil.');
  if (!process.env.JWT_SECRET) logger.warn('⚠  JWT_SECRET tanımlı değil, varsayılan kullanılıyor.');
});
