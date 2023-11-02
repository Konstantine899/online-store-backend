import { CreateRatingResponse } from '../../../infrastructure/responses/rating/create-rating.response';
import { GetRatingResponse } from '../../../infrastructure/responses/rating/get-rating.response';

export interface IRatingService {
    createRating(
        userId: number,
        productId: number,
        rating: number,
    ): Promise<CreateRatingResponse>;

    getRating(productId: number): Promise<GetRatingResponse>;
}
