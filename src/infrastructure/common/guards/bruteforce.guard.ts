import { Injectable, Logger } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerRequest, ThrottlerException } from '@nestjs/throttler';
import { Request } from 'express';

@Injectable()
export class BruteforceGuard extends ThrottlerGuard {
    private readonly logger = new Logger(BruteforceGuard.name);

    protected async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
        const { context } = requestProps;
        const request = context.switchToHttp().getRequest<Request>();
        
        // В тестовом окружении отключаем rate limiting для всех роутов
        if (process.env.NODE_ENV === 'test') {
            return true;
        }
        
        // Специальная логика для auth роутов
        if (request.url.includes('/auth/login')) {
            return this.handleLoginAttempt(requestProps);
        }
        
        if (request.url.includes('/auth/refresh')) {
            return this.handleRefreshAttempt(requestProps);
        }
        
        if (request.url.includes('/auth/registration')) {
            return this.handleRegistrationAttempt(requestProps);
        }
        
        // Для всех остальных роутов разрешаем проход без ограничений
        return true;
    }
    
    private async handleLoginAttempt(
        requestProps: ThrottlerRequest,
    ): Promise<boolean> {
        // Создаем новый requestProps с конфигурацией для логина
        const loginRequestProps = {
            ...requestProps,
            throttler: { name: 'login', ttl: 15 * 60 * 1000, limit: 5 }
        };
        
        const canProceed = await super.handleRequest(loginRequestProps);
        
        if (!canProceed) {
            const request = requestProps.context.switchToHttp().getRequest<Request>();
            
            // Логирование блокировки на уровне warn с метаданными
            this.logger.warn('Login rate limit exceeded', {
                ip: request.ip,
                userAgent: request.get('User-Agent'),
                correlationId: request.headers['x-request-id'],
            });
            
            throw new ThrottlerException('Слишком много попыток входа. Попробуйте через 15 минут.');
        }
        
        return true;
    }
    
    private async handleRefreshAttempt(
        requestProps: ThrottlerRequest,
    ): Promise<boolean> {
        const refreshRequestProps = {
            ...requestProps,
            throttler: { name: 'refresh', ttl: 5 * 60 * 1000, limit: 10 }
        };
        
        const canProceed = await super.handleRequest(refreshRequestProps);
        
        if (!canProceed) {
            const request = requestProps.context.switchToHttp().getRequest<Request>();
            
            this.logger.warn('Refresh rate limit exceeded', {
                ip: request.ip,
                userAgent: request.get('User-Agent'),
                correlationId: request.headers['x-request-id'],
            });
            
            throw new ThrottlerException('Слишком много попыток обновления токена. Попробуйте через 5 минут.');
        }
        
        return true;
    }
    
    private async handleRegistrationAttempt(
        requestProps: ThrottlerRequest,
    ): Promise<boolean> {
        const registrationRequestProps = {
            ...requestProps,
            throttler: { name: 'registration', ttl: 60 * 1000, limit: 3 }
        };
        
        const canProceed = await super.handleRequest(registrationRequestProps);
        
        if (!canProceed) {
            const request = requestProps.context.switchToHttp().getRequest<Request>();
            
            this.logger.warn('Registration rate limit exceeded', {
                ip: request.ip,
                userAgent: request.get('User-Agent'),
                correlationId: request.headers['x-request-id'],
            });
            
            throw new ThrottlerException('Слишком много попыток регистрации. Попробуйте через минуту.');
        }
        
        return true;
    }
}