import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize, Transaction } from 'sequelize';
import { catchError, Observable, tap, throwError } from 'rxjs';

@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  constructor(
    @InjectConnection()
    private readonly sequelize: Sequelize,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();
    const transaction: Transaction = await this.sequelize.transaction();
    request.transaction = transaction;
    return next.handle().pipe(
      tap(() => {
        transaction.commit();
      }),
      catchError((error) => {
        transaction.rollback();
        return throwError(error);
      }),
    );
  }
}
