import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { normalizePayload } from '../helpers/normalize.helper';

/**
 * Interceptor global que normaliza todas as strings do body
 * de requisições para caixa alta sem acentuação.
 *
 * Exceções definidas em CASE_SENSITIVE_FIELDS (normalize.helper.ts).
 * Aplica-se apenas a métodos que possuem body (POST, PUT, PATCH).
 */
@Injectable()
export class NormalizeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    if (request.body && typeof request.body === 'object') {
      request.body = normalizePayload(request.body);
    }

    return next.handle();
  }
}
