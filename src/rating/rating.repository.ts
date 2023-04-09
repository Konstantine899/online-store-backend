import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { RatingModel } from './rating.model';

@Injectable()
export class RatingRepository {
  constructor(
	@InjectModel(RatingModel) private ratingModel: typeof RatingModel,
  ) {}

  public async createRating(
	userId: number,
	productId: number,
	rating: number,
  ): Promise<RatingModel> {
	const productRating = new RatingModel();
	productRating.userId = userId;
	productRating.productId = productId;
	productRating.rating = rating;
	await productRating.save();
	return productRating;
  }

  public async findVote(
	userId: number,
	productId: number,
	rating: number,
  ): Promise<RatingModel> {
	return this.ratingModel.findOne({
		where: { userId, productId, rating },
	});
  }
}
