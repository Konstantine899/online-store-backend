import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive } from 'class-validator';

/**
 * DTO для отзыва роли у пользователя
 *
 * @example
 * {
 *   "userId": 123,
 *   "roleId": 5,
 *   "tenantId": 1
 * }
 */
export class RevokeRoleDto {
    @ApiProperty({
        description: 'ID пользователя, у которого отзывается роль',
        example: 123,
        type: Number,
    })
    @IsInt({ message: 'userId должен быть целым числом' })
    @IsPositive({ message: 'userId должен быть положительным числом' })
    declare readonly userId: number;

    @ApiProperty({
        description: 'ID роли для отзыва',
        example: 5,
        type: Number,
    })
    @IsInt({ message: 'roleId должен быть целым числом' })
    @IsPositive({ message: 'roleId должен быть положительным числом' })
    declare readonly roleId: number;

    @ApiProperty({
        description:
            'ID тенанта (контекст роли). Опционально для системных ролей',
        example: 1,
        required: false,
        type: Number,
    })
    @IsOptional()
    @IsInt({ message: 'tenantId должен быть целым числом' })
    @IsPositive({ message: 'tenantId должен быть положительным числом' })
    declare readonly tenantId?: number;
}
