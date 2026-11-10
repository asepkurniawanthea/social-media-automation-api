import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorator';

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data?: T;
  meta?: Record<string, unknown>;
}

interface Paginated {
  data: unknown[];
  meta: Record<string, unknown>;
}

// Hanya hasil paginasi (array + meta) yang dipecah. Objek lain dibiarkan utuh,
// jadi field bernama "message" atau "data" milik record tidak ikut terambil.
const isPaginated = (value: unknown): value is Paginated => {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return Array.isArray(v.data) && typeof v.meta === 'object' && v.meta !== null;
};

const DEFAULT_MESSAGES: Record<string, string> = {
  GET: 'Data retrieved successfully',
  POST: 'Resource created successfully',
  PATCH: 'Resource updated successfully',
  PUT: 'Resource updated successfully',
  DELETE: 'Resource deleted successfully',
};

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const http = context.switchToHttp();
    const { statusCode } = http.getResponse<{ statusCode: number }>();
    const { method } = http.getRequest<{ method: string }>();

    const message =
      this.reflector.get<string | undefined>(
        RESPONSE_MESSAGE_KEY,
        context.getHandler(),
      ) ??
      DEFAULT_MESSAGES[method] ??
      'Success';

    return next.handle().pipe(
      map((result: unknown): ApiResponse<T> => {
        if (isPaginated(result)) {
          return {
            statusCode,
            message,
            data: result.data as T,
            meta: result.meta,
          };
        }
        return { statusCode, message, data: result as T };
      }),
    );
  }
}
