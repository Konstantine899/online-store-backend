import { RatingModel } from '@app/domain/models';
import { ApiProperty } from '@nestjs/swagger';

export class RatingResponse extends RatingModel {
    @ApiProperty({ example: 1, description: 'Идентификатор пользователя' })
    declare user_id: number;

    @ApiProperty({ example: 1, description: 'Идентификатор продукта' })
    declare product_id: number;

    @ApiProperty({ example: 5, description: 'Рейтинг продукта' })
    declare rating: number;
}
