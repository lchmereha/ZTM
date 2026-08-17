import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { CookieOptions, Response } from 'express';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);

    // Set JWT as httpOnly cookie (inaccessible to JavaScript)
    // rememberMe=true  → persistent cookie with maxAge (survives browser close)
    // rememberMe=false → session cookie without maxAge (dies on browser close)
    const rememberMe = loginDto.rememberMe !== false; // default true
    const cookieOptions = this.buildCookieOptions();

    if (rememberMe) {
      cookieOptions.maxAge = this.parseTtlToMs(
        this.config.get<string>('JWT_EXPIRES_IN', '1d'),
      );
    }

    res.cookie('access_token', result.access_token, cookieOptions);

    // Return user data in body (not sensitive like the token)
    return { user: result.user };
  }

  @Get('me/filiais')
  getMyFiliais(@Req() req: AuthenticatedRequest) {
    return this.authService.getMyFiliais(req.user.sub, req.user.regra);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', this.buildCookieOptions());
    return { message: 'Logout realizado com sucesso' };
  }

  /**
   * Opções do cookie de sessão.
   *
   * `COOKIE_SAMESITE` precisa ser `none` quando o frontend e a API ficam em
   * domínios registráveis diferentes (ex.: app.exemplo.com.br chamando
   * api.outrodominio.com) — com `lax` o browser não envia o cookie em XHR
   * cross-site e a autenticação simplesmente não funciona. Subdomínios do
   * mesmo domínio continuam sendo same-site, e aí `lax` basta.
   *
   * `SameSite=None` só é aceito pelos browsers junto de `Secure`, então essa
   * combinação é forçada aqui em vez de depender de duas variáveis coerentes.
   */
  private buildCookieOptions(): CookieOptions {
    const sameSite = this.config
      .get<string>('COOKIE_SAMESITE', 'lax')
      .toLowerCase() as CookieOptions['sameSite'];
    const secure =
      sameSite === 'none' ||
      this.config.get<string>('COOKIE_SECURE', 'false') === 'true';

    return { httpOnly: true, secure, sameSite, path: '/' };
  }

  /**
   * Converte duração JWT (ex: "1d", "12h", "30m") em milissegundos para maxAge do cookie.
   */
  private parseTtlToMs(ttl: string): number {
    const match = ttl.match(/^(\d+)([smhd])$/);
    if (!match) return 86400000; // fallback: 1 dia

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return value * (multipliers[unit] ?? 86400000);
  }
}
