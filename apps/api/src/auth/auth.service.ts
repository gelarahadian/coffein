import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import type { AdminLoginInput } from "@coffein/shared";
import bcrypt from "bcryptjs";

interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: AdminLoginInput): Promise<{ accessToken: string }> {
    const admin = await this.prisma.adminUser.findUnique({
      where: { email: dto.email },
    });
    if (!admin) {
      throw new UnauthorizedException("Email atau password salah");
    }

    const valid = await bcrypt.compare(dto.password, admin.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("Email atau password salah");
    }

    const payload: JwtPayload = { sub: admin.id, email: admin.email };
    const accessToken = await this.jwt.signAsync(payload);
    return { accessToken };
  }

  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      return await this.jwt.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException("Token tidak valid atau kedaluwarsa");
    }
  }
}
