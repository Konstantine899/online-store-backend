import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    NotFoundException,
} from '@nestjs/common';
import { Request, Response } from 'express';
@Catch(NotFoundException)
export class CustomNotFoundExceptionFilter implements ExceptionFilter {
    catch(exception: NotFoundException, host: ArgumentsHost): void {
        const context = host.switchToHttp();
        const request = context.getRequest<Request>();
        const response = context.getResponse<Response>();
        const { url, path } = request;
        const statusCode = exception.getStatus();
        const { message, name } = exception;

        response.status(statusCode).json({
            statusCode,
            url,
            path,
            name,
            message,
        });
    }
}
