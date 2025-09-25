import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerRequest } from '@nestjs/throttler';
import { Request } from 'express';

@Injectable()
export class BruteforceGuard extends ThrottlerGuard {
    protected async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
        const { context } = requestProps;
        const request = context.switchToHttp().getRequest<Request>();
        
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
        
        // Стандартная обработка для других роутов
        return super.handleRequest(requestProps);
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
            throw new UnauthorizedException(
                'Too many login attempts. Please try again in 15 minutes.',
            );
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
            throw new UnauthorizedException(
                'Too many refresh attempts. Please try again in 5 minutes.',
            );
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
            throw new UnauthorizedException(
                'Too many registration attempts. Please try again in 1 minute.',
            );
        }
        
        return true;
    }
}