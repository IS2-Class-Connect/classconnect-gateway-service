import { Global, Module } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Global()
@Module({
  providers: [
    {
      provide: 'FIREBASE_ADMIN',
      useFactory: () => {
        try {
          const projectId = process.env.FIREBASE_PROJECT_ID;
          const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
          const privateKey = process.env.FIREBASE_PRIVATE_KEY;

          if (!projectId || !clientEmail || !privateKey) {
            throw new Error('Firebase admin credentials are not fully set in environment variables.');
          }

          if (!admin.apps.length) {
            return admin.initializeApp({
              credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey: privateKey.replace(/\\n/g, '\n'),
              }),
            });
          }

          return admin.app();
        } catch (error) {
          console.error('❌ Firebase initialization error:', error);
          throw error;
        }
      },
    },
  ],
  exports: ['FIREBASE_ADMIN'],
})
export class FirebaseModule {}