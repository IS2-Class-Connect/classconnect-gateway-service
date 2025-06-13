import { Logger } from '@nestjs/common';

const logger = new Logger('Env Validator');

export function validateEnv() {
  const requiredVars = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
    'JWT_SECRET',
    'USERS_URL',
    'EDUCATION_URL',
    'ADMINS_URL',
    'GATEWAY_TOKEN',
    'EMAIL_PRIVATE_KEY',
    'CLIENT_ID',
  ];

  const missing = requiredVars.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    logger.error('❌ Missing environment variables:', missing);
    process.exit(1);
  }

  logger.log('✅ All required environment variables are set.');
}
