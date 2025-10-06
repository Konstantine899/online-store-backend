import { ApiProperty } from '@nestjs/swagger';

export class LoginHistoryItemResponse {
    @ApiProperty({ example: 1, description: 'Идентификатор записи' })
    declare readonly id: number;

    @ApiProperty({
        example: '192.168.1.1',
        description: 'IP адрес',
        nullable: true,
    })
    declare readonly ipAddress: string | null;

    @ApiProperty({
        example: 'Mozilla/5.0...',
        description: 'User Agent',
        nullable: true,
    })
    declare readonly userAgent: string | null;

    @ApiProperty({ example: true, description: 'Успешность входа' })
    declare readonly success: boolean;

    @ApiProperty({
        example: 'Invalid password',
        description: 'Причина неудачи',
        nullable: true,
    })
    declare readonly failureReason: string | null;

    @ApiProperty({
        example: '2024-01-15T10:30:00Z',
        description: 'Время входа',
    })
    declare readonly loginAt: Date;
}

export class GetLoginHistoryResponse {
    @ApiProperty({
        type: [LoginHistoryItemResponse],
        description: 'История входов пользователя',
    })
    declare readonly data: LoginHistoryItemResponse[];

    @ApiProperty({ example: 25, description: 'Общее количество записей' })
    declare readonly total: number;
}

export class UserLoginStatsResponse {
    @ApiProperty({ example: 150, description: 'Общее количество входов' })
    declare readonly totalLogins: number;

    @ApiProperty({ example: 145, description: 'Количество успешных входов' })
    declare readonly successfulLogins: number;

    @ApiProperty({ example: 5, description: 'Количество неудачных входов' })
    declare readonly failedLogins: number;

    @ApiProperty({
        example: '2024-01-15T10:30:00Z',
        description: 'Время последнего входа',
        nullable: true,
    })
    declare readonly lastLoginAt: Date | null;
}
