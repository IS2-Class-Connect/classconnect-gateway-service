import { Global, Module } from '@nestjs/common';
import admin from 'firebase-admin';
import serviceAccount from './firebase-admin.json';

@Global()
@Module({
    providers: [
        {
            provide: 'FIREBASE_ADMIN',
            useFactory: () => {
                return admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
                });
            },
        },
    ],
    exports: ['FIREBASE_ADMIN'],
})
export class FirebaseModule { }
