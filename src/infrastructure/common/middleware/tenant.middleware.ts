import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NestMiddleware,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantContext } from '../context';
import { InjectModel } from '@nestjs/sequelize';
import { TenantModel } from '@app/domain/models/tenant.model';

// Extend Express Request для tenant данных
declare module 'express' {
    interface Request {
        tenantId?: number;
        tenant?: TenantModel;
    }
}

/**
 * TenantMiddleware - Извлекает и валидирует tenant ID из запроса
 *
 * Поддерживает два способа определения тенанта:
 * 1. Header `x-tenant-id` (приоритет)
 * 2. Subdomain (например, nike.mystore.com → tenant.subdomain='nike')
 *
 * Валидирует:
 * - Tenant ID обязателен (иначе 400)
 * - Tenant существует (иначе 403)
 * - Tenant активен (status='active', иначе 403)
 *
 * Устанавливает tenant ID в TenantContext для использования в repositories.
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
    constructor(
        @InjectModel(TenantModel)
        private readonly tenantModel: typeof TenantModel,
        private readonly tenantContext: TenantContext,
    ) {}

    async use(req: Request, res: Response, next: NextFunction): Promise<void> {
        // 1. Resolve tenant ID
        const tenantId = this.resolveTenantId(req);

        if (!tenantId) {
            throw new BadRequestException({
                statusCode: 400,
                message:
                    'x-tenant-id header обязателен для multi-tenant режима',
                error: 'Bad Request',
            });
        }

        // 2. Validate tenant exists and active
        const tenant = await this.tenantModel.findByPk(tenantId);

        if (!tenant) {
            throw new ForbiddenException({
                statusCode: 403,
                message: `Tenant с ID ${tenantId} не найден`,
                error: 'Forbidden',
            });
        }

        if (tenant.status !== 'active') {
            throw new ForbiddenException({
                statusCode: 403,
                message: `Tenant ${tenant.name} неактивен (статус: ${tenant.status})`,
                error: 'Forbidden',
            });
        }

        // 3. Attach tenant ID to request context
        this.tenantContext.setTenantId(tenantId);

        // Also attach to request for convenience
        req.tenantId = tenantId;
        req.tenant = tenant;

        next();
    }

    /**
     * Извлекает tenant ID из request
     * @param req - HTTP request
     * @returns tenant ID или null
     */
    private resolveTenantId(req: Request): number | null {
        // Приоритет 1: x-tenant-id header
        const headerTenantId = req.headers['x-tenant-id'] as string;
        if (headerTenantId) {
            const parsed = parseInt(headerTenantId, 10);
            return isNaN(parsed) ? null : parsed;
        }

        // Приоритет 2: subdomain (например, nike.mystore.com)
        // TODO: Implement subdomain resolution when needed
        // const subdomain = this.extractSubdomain(req.hostname);
        // if (subdomain) {
        //   return this.findTenantBySubdomain(subdomain);
        // }

        return null;
    }

    /**
     * Извлекает subdomain из hostname
     * @param hostname - например, "nike.mystore.com"
     * @returns subdomain - например, "nike"
     */
    // private extractSubdomain(hostname: string): string | null {
    //     const parts = hostname.split('.');
    //     if (parts.length >= 3) {
    //         return parts[0]; // nike.mystore.com -> "nike"
    //     }
    //     return null;
    // }
}

