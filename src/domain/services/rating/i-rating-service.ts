import {
    CreateRatingResponse,
    GetRatingResponse,
} from '@app/infrastructure/responses';

export interface IRatingService {
    createRating(
        userId: number,
        productId: number,
        rating: number,
    ): Promise<CreateRatingResponse>;

    getRating(productId: number): Promise<GetRatingResponse>;
}
