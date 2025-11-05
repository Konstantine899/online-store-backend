import { ApiProperty } from '@nestjs/swagger';

/**
 * Response класс для подтверждения кода верификации email/телефона
 * Возвращает результат верификации
 */
export class ConfirmVerificationCodeResponse {
    @ApiProperty({
        example: 'Email успешно подтверждён',
        description: 'Сообщение о результате верификации',
    })
    declare readonly message: string;

    @ApiProperty({
        example: true,
        description: 'Флаг успешной верификации',
    })
    declare readonly verified: boolean;
}
