import { IApplyCouponDto } from '@app/domain/dto';
import { IsSanitizedString } from '@app/infrastructure/common/validators';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * DTO для применения промокода к корзине
 */
export class ApplyCouponDto implements IApplyCouponDto {
    @ApiProperty({
        example: 'SALE2024',
        description: 'Код промокода',
        minLength: 3,
        maxLength: 50,
    })
    @IsNotEmpty({ message: 'Укажите код промокода' })
    @IsString({ message: 'Код промокода должен быть строкой' })
    @MinLength(3, {
        message: 'Код промокода должен содержать минимум 3 символа',
    })
    @MaxLength(50, {
        message: 'Код промокода не может быть длиннее 50 символов',
    })
    @IsSanitizedString({
        message: 'Код промокода содержит недопустимые символы',
    })
    declare readonly code: string;
}
