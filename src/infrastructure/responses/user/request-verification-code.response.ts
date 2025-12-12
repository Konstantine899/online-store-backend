import { ApiProperty } from '@nestjs/swagger';

/**
 * Response класс для запроса кода верификации email/телефона
 * Возвращает подтверждение отправки кода и время истечения
 */
export class RequestVerificationCodeResponse {
    @ApiProperty({
        example: 'Код подтверждения отправлен на ваш email',
        description: 'Сообщение об успешной отправке кода',
    })
    declare readonly message: string;

    @ApiProperty({
        example: '2025-11-05T12:20:00.000Z',
        description: 'Время истечения кода (ISO 8601 format)',
    })
    declare readonly expiresAt: string;
}
