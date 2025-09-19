import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { RatingModel } from '@app/domain/models';
import { RatingResponse } from '@app/infrastructure/responses';
import { IRatingRepository } from '@app/domain/repositories';

@Injectable()
export class RatingRepository implements IRatingRepository {
    constructor(
        @InjectModel(RatingModel) private ratingModel: typeof RatingModel,
    ) {}

    public async createRating(
        userId: number,
        productId: number,
        rating: number,
    ): Promise<RatingResponse> {
        const productRating = new RatingModel();
        productRating.user_id = userId;
        productRating.product_id = productId;
        productRating.rating = rating;
        return productRating.save();
    }

    public async removeRatingsListByProductId(
        productId: number,
    ): Promise<number> {
        return this.ratingModel.destroy({ where: { product_id: productId } });
    }

    public async findVote(
        user_id: number,
        product_id: number,
        rating: number,
    ): Promise<RatingModel> {
        return this.ratingModel.findOne({
            where: {
                user_id,
                product_id,
                rating,
            },
        }) as Promise<RatingModel>;
    }

    public async countRating(product_id: number): Promise<number> {
        return this.ratingModel.count({
            where: { product_id },
        });
    }

    public async ratingsSum(product_id: number): Promise<number> {
        return this.ratingModel.sum('rating', { where: { product_id } });
    }
}
