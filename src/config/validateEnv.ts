export function validateEnv() {
    const requiredVars = [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_PRIVATE_KEY',
      'DATABASE_URL',
      'JWT_SECRET',
      'USERS_URL',
      'EDUCATION_URL',
    ];
  
    const missing = requiredVars.filter((key) => !process.env[key]);
  
    if (missing.length > 0) {
      console.error('❌ Missing environment variables:', missing);
      process.exit(1);
    }
  
    console.log('✅ All required environment variables are set.');
  }
  