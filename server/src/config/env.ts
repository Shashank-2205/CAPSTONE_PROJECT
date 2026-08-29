import dotenv from 'dotenv';
import path from 'node:path';

const envPath = path.resolve(process.cwd(), '..', '.env');
dotenv.config({ path: envPath });

export const env = {
  port: Number(process.env.PORT || 5000),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-key',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/resqnet',
};
