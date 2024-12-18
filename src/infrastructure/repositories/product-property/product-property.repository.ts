import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ProductPropertyModel } from '@app/domain/models';
import { CreateProductPropertyDto } from '@app/infrastructure/dto';
import {
    CreateProductPropertyResponse,
    GetProductPropertyResponse,
    GetListProductPropertyResponse,
    UpdateProductPropertyResponse,
} from '@app/infrastructure/responses';
import { IProductPropertyRepository } from '@app/domain/repositories';

@Injectable()
export class ProductPropertyRepository implements IProductPropertyRepository {
    constructor(
        @InjectModel(ProductPropertyModel)
        private productPropertyModel: typeof ProductPropertyModel,
    ) {}

    public async create(
        product_id: number,
        dto: CreateProductPropertyDto,
    ): Promise<CreateProductPropertyResponse> {
        return this.productPropertyModel.create({
            product_id,
            ...dto,
        });
    }

    public async findOneProductProperty(
        product_id: number,
        id: number,
    ): Promise<GetProductPropertyResponse> {
        return this.productPropertyModel.findOne({
            where: {
                product_id,
                id,
            },
        });
    }

    public async findListProductProperty(
        product_id: number,
    ): Promise<GetListProductPropertyResponse[]> {
        return this.productPropertyModel.findAll({
            where: { product_id },
        });
    }

    public async updateProductProperty(
        property: ProductPropertyModel,
        dto: CreateProductPropertyDto,
    ): Promise<UpdateProductPropertyResponse> {
        return property.update({
            ...dto,
            name: dto.name,
            value: dto.value,
        });
    }

    public async removeProductProperty(id: number): Promise<number> {
        return this.productPropertyModel.destroy({ where: { id } });
    }

    public async removeProductPropertiesListByProductId(
        productId: number,
    ): Promise<number> {
        return this.productPropertyModel.destroy({
            where: { product_id: productId },
        });
    }
}
