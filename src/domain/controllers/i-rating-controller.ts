import { Request } from 'express';
import {
    CreateRatingResponse,
    GetRatingResponse,
} from '@app/infrastructure/responses';

export interface IRatingController {
    createRating(
        request: Request,
        productId: number,
        rating: number,
    ): Promise<CreateRatingResponse>;

    getRating(productId: number): Promise<GetRatingResponse>;
}
