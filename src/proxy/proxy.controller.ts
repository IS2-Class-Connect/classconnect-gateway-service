import {
  Controller,
  All,
  Req,
  Res,
  HttpStatus,
  UseGuards,
  Post,
  Get,
  Patch,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Request, Response } from 'express';
import { firstValueFrom } from 'rxjs';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';

@Controller('')
export class ProxyController {
  private readonly serviceMap: Record<string, string>;

  constructor(private readonly http: HttpService) {
    this.serviceMap = {
      users: process.env.USERS_URL ?? 'http://localhost:3001',
      education: process.env.EDUCATION_URL ?? 'http://localhost:3002',
    };
  }

  // (unprotected)
  @Get('/users/*/check-lock-status')
  async usersCheckLockStatus(@Req() req: Request, @Res() res: Response) {
    logger.log('Attempting to check-lock-status');
    return this.reRoute(req, res);
  }

  // (unprotected)
  @Patch('/users/*/failed-attempts')
  async usersFailedAttempts(@Req() req: Request, @Res() res: Response) {
    logger.log('Attempting to modify failed-attempts');
    return this.reRoute(req, res);
  }

  // (unprotected)
  @Post('/users')
  async usersCreate(@Req() req: Request, @Res() res: Response) {
    logger.log('Attempting to post a new user');
    return this.reRoute(req, res);
  }

  @All('*')
  @UseGuards(FirebaseAuthGuard)
  async proxy(@Req() req: Request, @Res() res: Response) {
    return this.reRoute(req, res);
  }

  async reRoute(req: Request, res: Response) {
    const parts = req.path.split('/');
    if (parts.length < 2) {
      return res.status(HttpStatus.BAD_REQUEST).send({ message: 'No service was provided' });
    }

    const service = parts[1];
    const serviceBaseUrl = this.serviceMap[service];
    if (!serviceBaseUrl) {
      logger.error('Service path nor recognized');
      return res.status(HttpStatus.BAD_REQUEST).send({ error: `Unknown service: ${service}` });
    }

    const targetUrl = `${serviceBaseUrl}${req.path}`;
    const { host, connection, 'content-length': _, ...safeHeaders } = req.headers;
    try {
      logger.log(`Sending a request to url ${targetUrl}`);
      const response = await firstValueFrom(
        this.http.request({
          method: req.method,
          url: targetUrl,
          data: req.body,
          params: req.query,
          headers: safeHeaders,
        }),
      );
      return res.status(response.status).send(response.data);
    } catch (error) {
      logger.error(
        error instanceof Error ? error.message : 'Unexpected error while sending a request',
      );
      const status = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
      const data = error.response?.data || { message: 'Internal server error' };
      res.status(status).send(data);
    }
  }
}

const logger = new Logger(ProxyController.name);
