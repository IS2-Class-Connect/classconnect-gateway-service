import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";

@Injectable()
export class GatewayTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.headers['authorization']?.split('Bearer ')[1];
    return token === (process.env.GATEWAY_TOKEN ?? 'gateway-token');
  }
}
