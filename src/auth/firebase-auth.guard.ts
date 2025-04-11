import {
    CanActivate,
    ExecutionContext,
    Inject,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {

    constructor(@Inject('FIREBASE_ADMIN') private readonly firebaseApp) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest<Request>();
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            throw new UnauthorizedException('Missing or invalid token');
        }

        const token = authHeader.split('Bearer ')[1];
        try {
            const decoded = await this.firebaseApp.auth().verifyIdToken(token);
            req['user'] = {
                uid: decoded.uid,
                email: decoded.email,
                name: decoded.name,
                picture: decoded.picture,
            };
            return true;
        } catch (error) {
            throw new UnauthorizedException('Invalid token');
        }
    }
}
