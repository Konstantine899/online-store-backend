import {
    GetRatingResponse,
    RatingResponse,
} from '@app/infrastructure/responses';

export interface IRatingService {
    createRating(
        userId: number,
        productId: number,
        rating: number,
    ): Promise<RatingResponse>;

    getRating(productId: number): Promise<GetRatingResponse>;

    removeAllRatingsByProductId(productId: number): Promise<number>;
}
