import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ProductPropertyModel } from './product-property.model';
import { CreateProductPropertyDto } from './dto/create-product-property.dto';
import { CreateProductPropertyResponse } from './responses/create-product-property.response';
import { GetProductPropertyResponse } from './responses/get-product-property.response';
import { GetListProductPropertyResponse } from './responses/get-list-product-property.response';
import { UpdateProductPropertyResponse } from './decorators/update-product-property.response';

@Injectable()
export class ProductPropertyRepository {
    constructor(
        @InjectModel(ProductPropertyModel)
        private productPropertyModel: typeof ProductPropertyModel,
    ) {}

    public async create(
        productId,
        dto,
    ): Promise<CreateProductPropertyResponse> {
        return this.productPropertyModel.create({
            productId,
            ...dto,
        });
    }

    public async findOneProductProperty(
        productId,
        id,
    ): Promise<GetProductPropertyResponse> {
        return this.productPropertyModel.findOne({
            where: { productId, id },
        });
    }

    public async findListProductProperty(
        productId: number,
    ): Promise<GetListProductPropertyResponse[]> {
        return this.productPropertyModel.findAll({
            where: { productId },
        });
    }

    public async updateProductProperty(
        property: ProductPropertyModel,
        dto: CreateProductPropertyDto,
    ): Promise<UpdateProductPropertyResponse> {
        return property.update({ ...dto, name: dto.name, value: dto.value });
    }

    public async removeProductProperty(id: number): Promise<number> {
        return this.productPropertyModel.destroy({ where: { id } });
    }
}
