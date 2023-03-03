import { UniqueConstraintError } from 'sequelize';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(UniqueConstraintError)
export class SequelizeUniqueConstraintException implements ExceptionFilter {
  catch(exception: UniqueConstraintError, host: ArgumentsHost) {
	const context = host.switchToHttp();
	const response = context.getResponse<Response>();
	const request = context.getRequest<Request>();
	const { url } = request;
	const { name } = exception;
	const errorResponse = {
		path: url,
		timestamp: new Date().toISOString(),
		message: name,
	};

	response.status(HttpStatus.BAD_REQUEST).json(errorResponse);
  }
}
