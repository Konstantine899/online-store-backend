import { ApiProperty } from '@nestjs/swagger';
import { IGetRatingResponse } from '@app/domain/responses';

export class GetRatingResponse implements IGetRatingResponse {
    @ApiProperty({
        example: 10,
        description: 'Сумма рейтингов',
    })
    declare ratingsSum: number;

    @ApiProperty({
        example: 2,
        description: 'Количество голосов',
    })
    declare votes: number;

    @ApiProperty({
        example: 5,
        description: 'Сумма рейтингов / Количество голосов',
    })
    declare rating: number;
}
