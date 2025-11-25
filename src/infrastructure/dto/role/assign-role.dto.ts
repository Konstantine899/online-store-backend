import { ApiProperty } from '@nestjs/swagger';
import {
    IsDateString,
    IsInt,
    IsObject,
    IsOptional,
    IsPositive,
} from 'class-validator';
import {
    IsDateNotPast,
    IsValidMetadataSize,
} from '@app/infrastructure/common/validators';

/**
 * DTO для назначения роли пользователю
 *
 * @example
 * {
 *   "userId": 123,
 *   "roleId": 5,
 *   "tenantId": 1,
 *   "expiresAt": "2025-12-31T23:59:59Z",
 *   "metadata": { "reason": "Promotion to manager" }
 * }
 */
export class AssignRoleDto {
    @ApiProperty({
        description: 'ID пользователя, которому назначается роль',
        example: 123,
        type: Number,
    })
    @IsInt({ message: 'userId должен быть целым числом' })
    @IsPositive({ message: 'userId должен быть положительным числом' })
    declare readonly userId: number;

    @ApiProperty({
        description: 'ID роли для назначения',
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

    @ApiProperty({
        description: 'Дата истечения роли в ISO формате. NULL = бессрочно',
        example: '2025-12-31T23:59:59Z',
        required: false,
        type: String,
    })
    @IsOptional()
    @IsDateString({}, { message: 'expiresAt должен быть датой в ISO формате' })
    @IsDateNotPast({ message: 'Дата истечения не может быть в прошлом' })
    declare readonly expiresAt?: string;

    @ApiProperty({
        description: 'Дополнительные метаданные назначения роли',
        example: { reason: 'Promotion to manager', department: 'Sales' },
        required: false,
        type: Object,
    })
    @IsOptional()
    @IsObject({ message: 'metadata должен быть объектом' })
    @IsValidMetadataSize({
        message:
            'metadata не может содержать более 20 ключей, глубина вложенности не более 3 уровней',
    })
    declare readonly metadata?: Record<string, unknown>;
}
