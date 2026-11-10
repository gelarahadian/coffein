import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { AuthService } from "./auth.service";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const header = req.headers["authorization"];
    if (!header || !header.startsWith("Bearer ")) {
      throw new UnauthorizedException("Token tidak disertakan");
    }
    const payload = await this.authService.verifyToken(header.slice("Bearer ".length));
    // Attach payload untuk penggunaan di controller bila diperlukan
    (req as Request & { user?: unknown }).user = payload;
    return true;
  }
}
