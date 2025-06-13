import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";

@Injectable()
export class GatewayTokenGuard implements CanActivate {

  /**
    * Validates a request using the gateway token.
    *
    * @param context - The context of execution.
    *
    * @return true if the request was successfully validated.
    */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.headers['authorization']?.split('Bearer ')[1];
    return token === (process.env.GATEWAY_TOKEN ?? 'gateway-token');
  }
}
