import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ProductPropertyModel } from '../../../domain/models/product-property.model';
import { CreateProductPropertyDto } from '../../dto/product-property/create-product-property.dto';
import { CreateProductPropertyResponse } from '../../responses/product-property/create-product-property.response';
import { GetProductPropertyResponse } from '../../responses/product-property/get-product-property.response';
import { GetListProductPropertyResponse } from '../../responses/product-property/get-list-product-property.response';
import { UpdateProductPropertyResponse } from '../../responses/product-property/update-product-property.response';
import { IProductPropertyRepository } from '../../../domain/repositories/product-property/i-product-property-repository';

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
}
