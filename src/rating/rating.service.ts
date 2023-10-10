import {
    BadRequestException,
    HttpStatus,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { RatingRepository } from './rating.repository';
import { ProductRepository } from '../product/product.repository';
import { UserRepository } from '../user/user.repository';
import { CreateRatingResponse } from './responses/create-rating.response';
import { GetRatingResponse } from './responses/get-rating.response';

@Injectable()
export class RatingService {
    constructor(
        private readonly ratingRepository: RatingRepository,
        private readonly productRepository: ProductRepository,
        private readonly userRepository: UserRepository,
    ) {}

    public async createRating(
        userId: number,
        productId: number,
        rating: number,
    ): Promise<CreateRatingResponse> {
        const product =
            await this.productRepository.fidProductByPkId(productId);
        if (!product) {
            this.notFound('Продукт не найден');
        }
        const user = await this.userRepository.findUserByPkId(userId);
        if (!user) {
            this.notFound('Пользователь не найден');
        }
        const reviewVote = await this.ratingRepository.findVote(
            userId,
            productId,
            rating,
        );
        if (reviewVote) {
            this.badRequest('Оценка рейтинга выми была выставлена ранее');
        }
        return this.ratingRepository.createRating(user.id, product.id, rating);
    }

    public async getRating(productId: number): Promise<GetRatingResponse> {
        const product =
            await this.productRepository.fidProductByPkId(productId);
        if (!product) {
            this.notFound('Продукт не найден');
        }
        const votes = await this.ratingRepository.countRating(productId);
        if (!votes) {
            return { ratingsSum: 0, votes: 0, rating: 0 };
        }
        const ratingsSum = await this.ratingRepository.ratingsSum(productId);
        return { ratingsSum, votes, rating: ratingsSum / votes };
    }

    private notFound(message: string): void {
        throw new NotFoundException({
            status: HttpStatus.NOT_FOUND,
            message,
        });
    }
    private badRequest(message: string): void {
        throw new BadRequestException({
            status: HttpStatus.BAD_REQUEST,
            message,
        });
    }
}
