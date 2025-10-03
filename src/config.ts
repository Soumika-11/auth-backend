import { Secret } from 'jsonwebtoken';

const config = {
  PORT: parseInt(process.env.PORT || '4000', 10),
  MONGO_URI: process.env.MONGO_URI || '',
  JWT_ACCESS_SECRET: (process.env.JWT_ACCESS_SECRET || 'your-access-secret') as Secret,
  JWT_REFRESH_SECRET: (process.env.JWT_REFRESH_SECRET || 'your-refresh-secret') as Secret,
  ACCESS_TOKEN_EXPIRES: process.env.ACCESS_TOKEN_EXPIRES || '15m',
  REFRESH_TOKEN_EXPIRES: process.env.REFRESH_TOKEN_EXPIRES || '7d',
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  COOKIE: {
    REFRESH_TOKEN_NAME: 'refreshToken',
    MAX_AGE: 7 * 24 * 60 * 60 * 1000,
    HTTP_ONLY: true,
    SECURE: process.env.NODE_ENV === 'production',
    SAME_SITE: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  } as const,
};

export default config;
