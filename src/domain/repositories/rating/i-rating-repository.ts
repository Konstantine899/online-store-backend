import { RatingModel } from '@app/domain/models';
import { RatingResponse } from '@app/infrastructure/responses';

export interface IRatingRepository {
    createRating(
        userId: number,
        productId: number,
        rating: number,
    ): Promise<RatingResponse>;

    findVote(
        user_id: number,
        product_id: number,
        rating: number,
    ): Promise<RatingModel>;

    countRating(product_id: number): Promise<number>;

    ratingsSum(product_id: number): Promise<number>;

    removeRatingsListByProductId(productId: number): Promise<number>;
}
