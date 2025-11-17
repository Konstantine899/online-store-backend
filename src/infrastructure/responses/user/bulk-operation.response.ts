import { ApiProperty } from '@nestjs/swagger';

/**
 * Response для массовых операций с пользователями
 * Возвращает количество обработанных записей
 */
export class BulkOperationResponse {
    @ApiProperty({
        description: 'Количество успешно обработанных пользователей',
        example: 5,
    })
    declare readonly affectedCount: number;

    @ApiProperty({
        description: 'Сообщение о результате операции',
        example: 'Успешно активировано 5 пользователей',
    })
    declare readonly message: string;
}
