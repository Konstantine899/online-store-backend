import { UniqueConstraintError } from 'sequelize';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(UniqueConstraintError)
export class SequelizeUniqueConstraintExceptionFilter
  implements ExceptionFilter
{
  catch(exception: UniqueConstraintError, host: ArgumentsHost) {
	const context = host.switchToHttp();
	const response = context.getResponse<Response>();
	const request = context.getRequest<Request>();
	const { url, path } = request;
	const { name, message, fields } = exception;
	const errorResponse = {
		url: url,
		path: path,
		type: message,
		name: name,
		fields: fields,
		timestamp: new Date().toISOString(),
	};

	response.status(HttpStatus.BAD_REQUEST).json(errorResponse);
  }
}
