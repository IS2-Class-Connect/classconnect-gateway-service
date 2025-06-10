import {
  HttpStatus,
  Logger,
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
    */
  async reRoute(req: Request, res: Response, onError?: (error: Error) => any): Promise<void> {
    try {
      const response = await this.tryReRoute(req);
      res.status(response.status).send(response.data);
    } catch (error) {
      if (onError) {
        await onError(error);
      }

      if (error.response) {
        const status = error.response.status;
        logger.warn(`An error occurred with status ${status}`);
        res.status(status)
          .set(error.response.headers)
          .send(error.response.data);
      } else {
        logger.warn(`An error occurred, status is unknown, defaulting to 500`)
        res.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .send({ message: 'An unexpected error occurred', error: error.message });
      }
    }
  }

  /**
    * Does the actual rerouting of the requests.
    *
    * @param req - The request to be rerouted.
    *
    * @returns The response of the request.
    *
    * @throws {Object} - If the service is invalid, not provided or the actual request fails.
    */
  private async tryReRoute(req: Request): Promise<AxiosResponse> {
    const parts = req.path.split('/');
    const service = parts[1];

    if (service.length === 0) {
      throw {
        response: {
          status: HttpStatus.BAD_REQUEST,
          data: { message: "No service was provided" },
          headers: {}
        }
      }
    }

    const serviceBaseUrl = this.serviceMap[service];
    if (!serviceBaseUrl) {
      throw {
        response: {
          status: HttpStatus.BAD_REQUEST,
          data: { message: `Unknown service: ${service}` },
          headers: {}
        }
      }
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

