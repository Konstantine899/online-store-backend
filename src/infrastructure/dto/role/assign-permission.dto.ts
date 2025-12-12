import { ApiProperty } from '@nestjs/swagger';
import {
    IsInt,
    IsNotEmpty,
    IsObject,
    IsOptional,
    IsPositive,
    IsString,
    MaxLength,
} from 'class-validator';

/**
 * DTO для назначения разрешения роли
 *
 * @example
 * {
 *   "roleId": 5,
 *   "resource": "products",
 *   "action": "create",
 *   "conditions": { "own_tenant_only": true }
 * }
 */
export class AssignPermissionDto {
    @ApiProperty({
        description: 'ID роли, которой назначается разрешение',
        example: 5,
        type: Number,
    })
    @IsInt({ message: 'roleId должен быть целым числом' })
    @IsPositive({ message: 'roleId должен быть положительным числом' })
    declare readonly roleId: number;

    @ApiProperty({
        description: 'Ресурс для доступа',
        example: 'products',
        maxLength: 100,
        type: String,
    })
    @IsString({ message: 'resource должен быть строкой' })
    @IsNotEmpty({ message: 'resource не может быть пустым' })
    @MaxLength(100, {
        message: 'resource не может быть длиннее 100 символов',
    })
    declare readonly resource: string;

    @ApiProperty({
        description: 'Действие над ресурсом',
        example: 'create',
        enum: ['create', 'read', 'update', 'delete', 'manage'],
        type: String,
    })
    @IsString({ message: 'action должен быть строкой' })
    @IsNotEmpty({ message: 'action не может быть пустым' })
    @MaxLength(50, { message: 'action не может быть длиннее 50 символов' })
    declare readonly action: string;

    @ApiProperty({
        description: 'Условия доступа (JSONB)',
        example: { own_tenant_only: true, status: 'active' },
        required: false,
        type: Object,
    })
    @IsOptional()
    @IsObject({ message: 'conditions должен быть объектом' })
    declare readonly conditions?: Record<string, unknown>;
}
