import { Controller, Get, Query, UseGuards, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthGuard } from '@app/infrastructure/common/guards';
import { LoginHistoryService } from '@app/infrastructure/services/login-history/login-history.service';
import { GetLoginHistoryDto } from '@app/infrastructure/dto/login-history/get-login-history.dto';
import { GetLoginHistoryResponse, UserLoginStatsResponse } from '@app/infrastructure/responses/login-history/login-history.response';
import { GetLoginHistorySwaggerDecorator, GetUserLoginStatsSwaggerDecorator } from '@app/infrastructure/common/decorators/swagger/login-history/get-login-history.swagger';
import { IDecodedAccessToken } from '@app/domain/jwt';

@ApiTags('История входов')
@Controller('login-history')
@UseGuards(AuthGuard)
export class LoginHistoryController {
    constructor(
        private readonly loginHistoryService: LoginHistoryService,
    ) {}

    @GetLoginHistorySwaggerDecorator()
    @HttpCode(HttpStatus.OK)
    @Get()
    async getLoginHistory(
        @Req() request: Request,
        @Query() query: GetLoginHistoryDto,
    ): Promise<GetLoginHistoryResponse> {
        const user = request.user as IDecodedAccessToken;
        const { limit = 10, offset = 0 } = query;
        
        const loginHistory = await this.loginHistoryService.getUserLoginHistory(
            Number(user.sub),
            limit,
            offset,
        );

        const total = await this.loginHistoryService.getUserLoginStats(Number(user.sub));

        return {
            data: loginHistory.map(record => ({
                id: record.id,
                ipAddress: record.ipAddress,
                userAgent: record.userAgent,
                success: record.success,
                failureReason: record.failureReason,
                loginAt: record.loginAt,
            })),
            total: total.totalLogins,
        };
    }

    @GetUserLoginStatsSwaggerDecorator()
    @HttpCode(HttpStatus.OK)
    @Get('stats')
    async getUserLoginStats(
        @Req() request: Request,
    ): Promise<UserLoginStatsResponse> {
        const user = request.user as IDecodedAccessToken;
        const stats = await this.loginHistoryService.getUserLoginStats(Number(user.sub));
        
        return {
            totalLogins: stats.totalLogins,
            successfulLogins: stats.successfulLogins,
            failedLogins: stats.failedLogins,
            lastLoginAt: stats.lastLoginAt,
        };
    }
}
