import {
    Controller,
    All,
    Req,
    Res,
    Param,
    HttpStatus,
    UseGuards,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Request, Response } from 'express';
import { firstValueFrom } from 'rxjs';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';

@Controller('')
export class ProxyController {
    serviceMap: Object;

    constructor(private readonly http: HttpService) {
        this.serviceMap = {
            user: process.env.USER_URL ?? 'http://localhost:3001',
            education: process.env.EDUCATION_URL ?? 'http://localhost:3002',
        };
    }

    @UseGuards(FirebaseAuthGuard)
    @All('*')
    async proxy(
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const service = req.path.split('/')[1];
        const serviceBaseUrl = this.serviceMap[service];
        if (!serviceBaseUrl) {
            return res
                .status(HttpStatus.BAD_REQUEST)
                .send({ error: `Unknown service: ${service}` });
        }

        const targetUrl = `${serviceBaseUrl}${req.path}`;

        try {
            const response = await firstValueFrom(
                this.http.request({
                    method: req.method,
                    url: targetUrl,
                    data: req.body,
                    params: req.query,
                    headers: req.headers,
                }),
            );
            res.status(response.status).send(response.data);
        } catch (error) {
            const status = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
            const data = error.response?.data || { message: 'Internal server error' };
            res.status(status).send(data);
        }
    }
}

