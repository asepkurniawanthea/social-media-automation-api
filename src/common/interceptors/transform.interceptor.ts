import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Mendefinisikan struktur standar untuk response sukses
export interface Response<T> {
  statusCode: number;
  message: string;
  data: T;
}

type ResponsePayload = Record<string, unknown>;

const isResponsePayload = (value: unknown): value is ResponsePayload =>
  typeof value === 'object' && value !== null;

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  Response<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<{ statusCode: number }>();
    const request = ctx.getRequest<{ method: string }>();

    const statusCode = response.statusCode;

    // Menentukan pesan bahasa Inggris secara dinamis berdasarkan metode HTTP
    let defaultMessage = 'Success';
    if (request.method === 'POST')
      defaultMessage = 'Resource created successfully';
    if (request.method === 'GET')
      defaultMessage = 'Data retrieved successfully';
    if (request.method === 'PATCH' || request.method === 'PUT')
      defaultMessage = 'Resource updated successfully';
    if (request.method === 'DELETE')
      defaultMessage = 'Resource deleted successfully';

    // next.handle() adalah data asli yang di-return dari Controller/Service
    return next.handle().pipe(
      map((data: unknown): Response<T> => {
        const payload = isResponsePayload(data) ? data : undefined;
        const message =
          typeof payload?.message === 'string'
            ? payload.message
            : defaultMessage;

        return {
          statusCode,
          message, // Gunakan pesan dari Service jika ada, atau gunakan default
          data: payload?.data ? (payload.data as T) : (data as T), // Hindari nested 'data.data' jika response sudah memiliki properti data
        };
      }),
    );
  }
}
