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
	return productRating.save();
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

  public async countRating(productId: number): Promise<number> {
	return this.ratingModel.count({
		where: { productId },
	});
  }

  public async ratingsSum(productId: number): Promise<number> {
	return this.ratingModel.sum('rating', { where: { productId } });
  }
}
