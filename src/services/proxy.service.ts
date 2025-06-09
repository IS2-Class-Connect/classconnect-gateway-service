
import {
  HttpStatus,
  Logger,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Request, Response } from 'express';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';

@Injectable()
export class ProxyService {
  private readonly serviceMap: Record<string, string> = {
    users: process.env.USERS_URL ?? 'http://localhost:3001',
    courses: process.env.EDUCATION_URL ?? 'http://localhost:3002',
    evaluations: process.env.EDUCATION_URL ?? 'http://localhost:3002',
    admins: process.env.ADMINS_URL ?? 'http://localhost:3004',
  };

  constructor(private readonly http: HttpService) { }

  /**
    * Reroutes a given request to the correct service.
    *
    * @param req     - The request to be rerouted.
    * @param res     - The response object to return the request's result.
    * @param onError - An error handler, it's called right after rerouting throws.
    *
    * @throws {HttpException} if there's an error in the communication.
    */
  async reRoute(req: Request, res: Response, onError?: (error: Error) => any): Promise<void> {
    try {
      const response = await this.tryReRoute(req);
      res.status(response.status).send(response.data);
    } catch (error) {
      if (onError) {
        await onError(error);
      }
      res.status(error.response.status)
        .set(error.response.headers)
        .send(error.response.data);
    }
  }

  /**
    * Does the actual rerouting of the requests.
    *
    * @param req - The request to be rerouted.
    *
    * @returns The response of the request.
    *
    * @throws {HttpException} - If the service is invalid, not provided or the actual request fails.
    */
  private async tryReRoute(req: Request): Promise<AxiosResponse> {
    const parts = req.path.split('/');
    if (parts.length < 2) {
      throw new HttpException('No service was provided', HttpStatus.BAD_REQUEST);
    }

    const service = parts[1];
    const serviceBaseUrl = this.serviceMap[service];
    if (!serviceBaseUrl) {
      throw new HttpException(`Unknown service: ${service}`, HttpStatus.BAD_REQUEST);
    }

    const targetUrl = `${serviceBaseUrl}${req.path}`;
    const { host, connection, 'content-length': _, ...safeHeaders } = req.headers;

    logger.log(`Sending a request to url ${targetUrl}`);
    return await firstValueFrom(
      this.http.request({
        method: req.method,
        url: targetUrl,
        data: req.body,
        params: req.query,
        headers: safeHeaders,
      }),
    );
  }
}

const logger = new Logger(ProxyService.name);

