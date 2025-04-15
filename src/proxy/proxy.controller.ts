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
            courses: process.env.EDUCATION_URL ?? 'http://localhost:3002',
        };
    }

    // (unprotected)
    @Get('/users/*/check-lock-status')
    async usersCheckLockStatus(@Req() req: Request, @Res() res: Response) {
        return this.reRoute(req, res)
    }

    // (unprotected)
    @Patch('/users/*/failed-attempts')
    async usersFailedAttempts(@Req() req: Request, @Res() res: Response) {
        return this.reRoute(req, res)
    }

    // (unprotected)
    @Post('/users')
    async usersCreate(@Req() req: Request, @Res() res: Response) {
        return this.reRoute(req, res)
    }

    @All('*')
    @UseGuards(FirebaseAuthGuard)
    async proxy(@Req() req: Request, @Res() res: Response) {
        return this.reRoute(req, res);
    }

    async reRoute(req: Request, res: Response) {
        const parts = req.path.split('/');
        if (parts.length < 2) {
            return res
                .status(HttpStatus.BAD_REQUEST)
                .send({ message: 'No service was provided' });
        }

        const service = parts[1];
        const serviceBaseUrl = this.serviceMap[service];
        if (!serviceBaseUrl) {
            return res
                .status(HttpStatus.BAD_REQUEST)
                .send({ error: `Unknown service: ${service}` });
        }

        const targetUrl = `${serviceBaseUrl}${req.path}`
        const { host, connection, 'content-length': _, ...safeHeaders } = req.headers;
        try {
            const response = await firstValueFrom(
                this.http.request({
                    method: req.method,
                    url: targetUrl,
                    data: req.body,
                    params: req.query,
                    headers: safeHeaders,
                })
            );
            return res.status(response.status).send(response.data);
        } catch (error) {
            const status = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
            const data = error.response?.data || { message: 'Internal server error' };
            res.status(status).send(data);
        }
    }
}

