import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    NotFoundException,
} from '@nestjs/common';
import { Request, Response } from 'express';
@Catch(NotFoundException)
export class CustomNotFoundExceptionFilter implements ExceptionFilter {
    catch(exception: NotFoundException, host: ArgumentsHost) {
        const context = host.switchToHttp();
        const { url, path } = context.getRequest<Request>();
        const response = context.getResponse<Response>();
        const statusCode = exception.getStatus();
        const { message, name } = exception;

        response.status(statusCode).json({
            statusCode: statusCode,
            url: url,
            path: path,
            name: name,
            message: message,
        });
    }
}
