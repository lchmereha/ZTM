import { BadRequestException, Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import 'dotenv/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { NormalizeInterceptor } from './common/interceptors/normalize.interceptor';
import { IntegracaoModule } from './integracao/integracao.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  // Atrás do Traefik/ALB todo request chega com o IP do proxy. Sem isso o
  // ThrottlerGuard trata a planta inteira como um único cliente e derruba a
  // operação quando vários coletores leem lotes em paralelo.
  const trustedProxyHops = Number(
    config.get<string>('TRUSTED_PROXY_HOPS', '0'),
  );
  if (trustedProxyHops > 0) {
    app.set('trust proxy', trustedProxyHops);
  }

  const isSecure = config.get<string>('COOKIE_SECURE', 'false') === 'true';

  // Security headers (Helmet)
  // Em ambientes HTTP (rede local), desabilita upgrade-insecure-requests
  // para evitar que o browser bloqueie assets do Swagger e demais recursos.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          ...(isSecure ? {} : { 'upgrade-insecure-requests': null }),
        },
      },
    }),
  );
  app.use(cookieParser());

  // CORS — env-driven
  const allowedOrigins = config
    .get<string>('ALLOWED_ORIGINS', '')
    .split(',')
    .filter(Boolean);
  const isProduction = config.get<string>('NODE_ENV') === 'production';

  app.enableCors({
    origin: isProduction
      ? (
          origin: string | undefined,
          callback: (err: Error | null, allow?: boolean) => void,
        ) => {
          if (
            !origin ||
            allowedOrigins.includes('*') ||
            allowedOrigins.includes(origin)
          ) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        }
      : true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders:
      'Content-Type,Accept,Authorization,X-Requested-With,x-api-key',

    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.useGlobalInterceptors(new NormalizeInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        const details = errors.map((err) => {
          const constraints = err.constraints
            ? Object.values(err.constraints)
            : ['Valor inválido'];
          return {
            campo: err.property,
            erros: constraints,
          };
        });
        return new BadRequestException({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Erro de validação nos dados enviados.',
          detalhes: details,
        });
      },
    }),
  );

  // Swagger — available in all environments (used for external API docs)
  const swaggerConfig = new DocumentBuilder()
    .setTitle('ZTM API')
    .setDescription(
      'API de integração — documentação de endpoints para sistemas externos.',
    )
    .setVersion('1.0')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-api-key',
        in: 'header',
        description: 'Chave de API vinculada a uma filial.',
      },
      'api-key',
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig, {
    include: [IntegracaoModule],
  });
  SwaggerModule.setup('docs', app, document);

  app.enableShutdownHooks();

  const port = config.get<number>('PORT', 3000);
  await app.listen(port, '0.0.0.0');
  Logger.log(`Application is running on: http://0.0.0.0:${port}`, 'Bootstrap');
}
void bootstrap();
