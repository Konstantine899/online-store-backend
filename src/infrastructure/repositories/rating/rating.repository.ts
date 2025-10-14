import { RatingModel } from '@app/domain/models';
import { IRatingRepository } from '@app/domain/repositories';
import { TenantContext } from '@app/infrastructure/common/context';
import { RatingResponse } from '@app/infrastructure/responses';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

@Injectable()
export class RatingRepository implements IRatingRepository {
    constructor(
        @InjectModel(RatingModel) private ratingModel: typeof RatingModel,
        private readonly tenantContext: TenantContext,
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
        productRating.tenant_id = this.tenantContext.getTenantIdOrNull() || 1;
        return productRating.save();
    }

    public async removeRatingsListByProductId(
        productId: number,
    ): Promise<number> {
        const tenantId = this.tenantContext.getTenantIdOrNull() || 1;
        return this.ratingModel.destroy({
            where: { product_id: productId, tenant_id: tenantId },
        });
    }

    public async findVote(
        user_id: number,
        product_id: number,
        rating: number,
    ): Promise<RatingModel> {
        const tenantId = this.tenantContext.getTenantIdOrNull() || 1;
        return this.ratingModel.findOne({
            where: {
                user_id,
                product_id,
                rating,
                tenant_id: tenantId,
            },
        }) as Promise<RatingModel>;
    }

    public async countRating(product_id: number): Promise<number> {
        const tenantId = this.tenantContext.getTenantIdOrNull() || 1;
        return this.ratingModel.count({
            where: { product_id, tenant_id: tenantId },
        });
    }

    public async ratingsSum(product_id: number): Promise<number> {
        const tenantId = this.tenantContext.getTenantIdOrNull() || 1;
        return this.ratingModel.sum('rating', {
            where: { product_id, tenant_id: tenantId },
        });
    }
}
