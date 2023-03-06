import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { DatabaseError } from 'sequelize';
import { Request, Response } from 'express';
@Catch(DatabaseError)
export class SequelizeDatabaseErrorExceptionFilter implements ExceptionFilter {
  catch(exception: DatabaseError, host: ArgumentsHost) {
	const context = host.switchToHttp();
	const response = context.getResponse<Response>();
	const { url, path } = context.getRequest<Request>();
	const { name, message } = exception;

	const errorResponse = {
		url: url,
		path: path,
		type: message,
		name: name,
		timestamp: new Date().toISOString(),
	};

	response.status(HttpStatus.BAD_REQUEST).json(errorResponse);
  }
}
