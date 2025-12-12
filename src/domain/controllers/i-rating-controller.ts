import type { Request } from 'express';
import type {
    RatingResponse,
    GetRatingResponse,
} from '@app/infrastructure/responses';

export interface IRatingController {
    createRating(
        request: Request,
        productId: number,
        rating: number,
    ): Promise<RatingResponse>;

    getRating(productId: number): Promise<GetRatingResponse>;
}
