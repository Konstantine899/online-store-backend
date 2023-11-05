import { CreateRatingResponse } from '@app/infrastructure/responses';
import { RatingModel } from '@app/domain/models';

export interface IRatingRepository {
    createRating(
        userId: number,
        productId: number,
        rating: number,
    ): Promise<CreateRatingResponse>;

    findVote(
        user_id: number,
        product_id: number,
        rating: number,
    ): Promise<RatingModel>;

    countRating(product_id: number): Promise<number>;

    ratingsSum(product_id: number): Promise<number>;
}
