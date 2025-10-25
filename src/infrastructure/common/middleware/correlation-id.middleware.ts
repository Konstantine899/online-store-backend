import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
    use(
        req: Request & { correlationId?: string },
        res: Response,
        next: NextFunction,
    ) {
        const headerId = req.headers['x-request-id'] as string | undefined;
        req.correlationId = headerId || randomUUID();
        res.setHeader('x-request-id', req.correlationId);
        next();
    }
}
