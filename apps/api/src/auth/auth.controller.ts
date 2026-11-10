import { Body, Controller, Post, UsePipes } from "@nestjs/common";
import { AdminLoginInputSchema } from "@coffein/shared";
import { AuthService } from "./auth.service";
import { ZodValidationPipe } from "../common/zod-validation.pipe";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @UsePipes(new ZodValidationPipe(AdminLoginInputSchema))
  async login(@Body() dto: { email: string; password: string }) {
    return this.authService.login(dto);
  }
}
