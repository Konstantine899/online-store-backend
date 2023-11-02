import { ApiProperty } from '@nestjs/swagger';
import { IGetRatingResponse } from '../../../domain/responses/rating/i-get-rating-response';

export class GetRatingResponse implements IGetRatingResponse {
    @ApiProperty({
        example: 10,
        description: 'Сумма рейтингов',
    })
    ratingsSum: number;

    @ApiProperty({
        example: 2,
        description: 'Количество голосов',
    })
    votes: number;

    @ApiProperty({
        example: 5,
        description: 'Сумма рейтингов / Количество голосов',
    })
    rating: number;
}
