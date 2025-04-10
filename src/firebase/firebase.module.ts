import { Global, Module } from '@nestjs/common';
import admin from 'firebase-admin';
var serviceAccount = require('./firebase-admin.json')

@Global()
@Module({
    providers: [
        {
            provide: 'FIREBASE_ADMIN',
            useFactory: () => {
                return admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                });
            },
        },
    ],
    exports: ['FIREBASE_ADMIN'],
})
export class FirebaseModule { }
