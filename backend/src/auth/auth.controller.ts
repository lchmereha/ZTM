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
import { Response } from 'express';
import {
  ONE_DAY_MS,
  buildSessionCookieOptions,
  parseDurationToMs,
} from '../common/helpers/session.helper';
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
    const cookieOptions = buildSessionCookieOptions(this.config);

    if (rememberMe) {
      cookieOptions.maxAge = parseDurationToMs(
        this.config.get<string>('JWT_EXPIRES_IN', '1d'),
        ONE_DAY_MS,
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
    res.clearCookie('access_token', buildSessionCookieOptions(this.config));
    return { message: 'Logout realizado com sucesso' };
  }
}
