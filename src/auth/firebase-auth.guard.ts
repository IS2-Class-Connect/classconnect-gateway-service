import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { OAuth2Client } from 'google-auth-library';

const GOOGLE_CLIENT_ID = process.env.CLIENT_ID|| 'client_it'; 

@Injectable()
export class MultiAuthGuard implements CanActivate {
  private googleClient: OAuth2Client;

  constructor(@Inject('FIREBASE_ADMIN') private readonly firebaseApp) {
    this.googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
  }

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
        provider: 'firebase',
      };
      return true;
    } catch (firebaseError) {
    }

    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: token,
        audience: GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();

      if (!payload || !payload.sub) {
        throw new UnauthorizedException('Invalid Google token');
      }

      req['user'] = {
        uid: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        provider: 'google',
      };
      return true;
    } catch (googleError) {
      throw new UnauthorizedException('Invalid token (Firebase or Google)');
    }
  }
}
