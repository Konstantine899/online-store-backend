import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RatingRepository } from './rating.repository';
import { ProductRepository } from '../product/product.repository';
import { UserRepository } from '../user/user.repository';
import { RatingModel } from './rating.model';

export class IRating {
  ratingsSum: number;
  votes: number;
  rating: number;
}

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
  ): Promise<RatingModel> {
	const product = await this.productRepository.fidProductByPkId(productId);
	if (!product) {
		throw new NotFoundException({
		status: HttpStatus.NOT_FOUND,
		message: 'Продукт не найден',
		});
	}
	const user = await this.userRepository.findUserByPkId(userId);
	if (!user) {
		throw new NotFoundException({
		status: HttpStatus.NOT_FOUND,
		message: 'Пользователь не найден',
		});
	}
	const reviewVote = await this.ratingRepository.findVote(
		userId,
		productId,
		rating,
	);
	if (reviewVote) {
		throw new BadRequestException({
		status: HttpStatus.BAD_REQUEST,
		message: `Оценка рейтинга выми была выставлена ранее`,
		});
	}
	return this.ratingRepository.createRating(user.id, product.id, rating);
  }

  public async getRating(productId: number): Promise<IRating> {
	const product = await this.productRepository.fidProductByPkId(productId);
	if (!product) {
		throw new NotFoundException({
		status: HttpStatus.NOT_FOUND,
		message: 'Продукт не найден',
		});
	}
	const votes = await this.ratingRepository.countRating(productId);
	if (!votes) { return { ratingsSum: 0, votes: 0, rating: 0 }; }
	const ratingsSum = await this.ratingRepository.ratingsSum(productId);
	return { ratingsSum, votes, rating: ratingsSum / votes };
  }
}
