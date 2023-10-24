import { RatingModel } from '../rating.model';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRatingResponse extends RatingModel {
    @ApiProperty({ example: 1, description: 'Идентификатор пользователя' })
    user_id: number;

    @ApiProperty({ example: 1, description: 'Идентификатор продукта' })
    product_id: number;

    @ApiProperty({ example: 5, description: 'Рейтинг продукта' })
    rating: number;
}
