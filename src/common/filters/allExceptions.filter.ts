import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { formatDate } from '@/common/utils/date';
import { Result } from '@/common/result';

// @Catch()
// export class AllExceptionsFilter<T> implements ExceptionFilter {
//   catch(exception: HttpException, host: ArgumentsHost) {
//     const ctx = host.switchToHttp();
//     const response = ctx.getResponse();
//     const request = ctx.getRequest();
//     const exceptionRes: any = exception.getResponse() || 'inter server error';
//     const message = exceptionRes?.message ? (Array.isArray(exceptionRes) ? exceptionRes['message'][0] : exceptionRes['message']) : exceptionRes;
//     const statusCode = exception.getStatus() || 400;
//     const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
//     response.status(status);
//     response.header('Content-Type', 'application/json; charset=utf-8');
//     response.send(Result.fail(statusCode, Array.isArray(message) ? message[0] : message));
//   }
// }

@Catch()
export class AllExceptionsFilter<T> implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let exceptionRes: any = 'inter server error';
    let statusCode = 400;
    let status = HttpStatus.INTERNAL_SERVER_ERROR;

    if (exception instanceof HttpException) {
      exceptionRes = exception.getResponse();
      statusCode = exception.getStatus();
      status = exception.getStatus();
    }

    const message = exceptionRes?.message ? (Array.isArray(exceptionRes) ? exceptionRes['message'][0] : exceptionRes['message']) : exceptionRes;

    try {
      response.status(status);
      response.header('Content-Type', 'application/json; charset=utf-8');
      response.send(Result.fail(statusCode, Array.isArray(message) ? message[0] : message));
    } catch (error) {
      // 处理发送响应时的异常
      console.error('Failed to send response:', error);
    }
  }
}
