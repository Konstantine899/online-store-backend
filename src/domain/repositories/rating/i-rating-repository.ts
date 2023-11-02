import { CreateRatingResponse } from '../../../infrastructure/responses/rating/create-rating.response';
import { RatingModel } from '../../models/rating.model';

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
