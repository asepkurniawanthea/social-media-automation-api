import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

// 1. Kamus pesan standar dalam Bahasa Inggris yang lebih rapi
const EN_MESSAGES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]:
    'Bad Request. The provided data is invalid or incomplete.',
  [HttpStatus.UNAUTHORIZED]:
    'Unauthorized. Please log in to access this resource.',
  [HttpStatus.FORBIDDEN]:
    'Forbidden. You do not have permission to access this resource.',
  [HttpStatus.NOT_FOUND]:
    'Not Found. The requested resource could not be found.',
  [HttpStatus.CONFLICT]:
    'Conflict. The data you are trying to save already exists.',
  [HttpStatus.INTERNAL_SERVER_ERROR]:
    'Internal Server Error. Please try again later.',
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // 2. Gunakan pesan dari kamus, atau default fallback
    let message: string | string[] =
      EN_MESSAGES[status] || 'An unexpected error occurred.';

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resMessage =
          'message' in exceptionResponse
            ? exceptionResponse.message
            : undefined;

        // 3a. Jika dari DTO class-validator (misal: ["title should not be empty"])
        if (Array.isArray(resMessage)) {
          message = resMessage;
        }
        // 3b. Jika Anda melempar pesan spesifik dari Service
        // (misal: throw new NotFoundException('Task ID 99 not found'))
        else if (
          typeof resMessage === 'string' &&
          resMessage !== exception.name
        ) {
          message = resMessage;
        }
      }
    } else if (exception instanceof Error) {
      // 3c. Untuk error sistem yang tidak tertangkap sebagai HttpException
      console.error('System Error:', exception); // Log ke console untuk debugging
    }

    // 4. Kembalikan format JSON yang seragam
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: message,
    });
  }
}
