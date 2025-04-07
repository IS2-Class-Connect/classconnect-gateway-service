import {
    Controller,
    All,
    Req,
    Res,
    Param,
    HttpStatus,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Request, Response } from 'express';
import { firstValueFrom } from 'rxjs';

@Controller('')
export class ProxyController {
    serviceMap: Object;

    constructor(private readonly http: HttpService) {
        this.serviceMap = {
            users: process.env.USERS_URL ?? 'http://localhost:3001',
            education: process.env.EDUCATION_URL ?? 'http://localhost:3002',
        };
    }

    @All('/:service/*')
    async proxy(
        @Req() req: Request,
        @Res() res: Response,
        @Param('service') service: string,
    ) {
        const serviceBaseUrl = this.serviceMap[service];
        if (!serviceBaseUrl) {
            return res
                .status(HttpStatus.BAD_REQUEST)
                .send({ error: `Unknown service: ${service}` });
        }

        const targetPath = req.originalUrl.replace(`/${service}`, '');
        const targetUrl = `${serviceBaseUrl}${targetPath}`;

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

