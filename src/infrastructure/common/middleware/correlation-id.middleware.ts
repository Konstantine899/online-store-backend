import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
    use(
        req: Request & { correlationId?: string },
        res: Response,
        next: NextFunction,
    ): void {
        const headerId = req.headers['x-request-id'] as string | undefined;
        // Генерируем новый UUID если заголовок отсутствует, null, undefined или пустая строка
        req.correlationId =
            headerId && headerId.trim() ? headerId.trim() : randomUUID();
        res.setHeader('x-request-id', req.correlationId);
        next();
    }
}
