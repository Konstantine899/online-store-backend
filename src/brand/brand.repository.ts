import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BrandModel } from './brand.model';
import { CreateBrandDto } from './dto/create-brand.dto';

@Injectable()
export class BrandRepository {
  constructor(@InjectModel(BrandModel) private brandModel: typeof BrandModel) {}

  public async createBrand(dto: CreateBrandDto): Promise<BrandModel> {
	const brand = new BrandModel();
	brand.name = dto.name;
	return brand.save();
  }

  public async findAllBrands(): Promise<BrandModel[]> {
	return this.brandModel.findAll();
  }

  public async findOneBrand(id: number): Promise<BrandModel> {
	return this.brandModel.findByPk(id);
  }

  public async updateBrand(dto: CreateBrandDto, brand: BrandModel) {
	return brand.update({ ...dto, name: dto.name });
  }

  public async removeBrand(id: number): Promise<number> {
	return this.brandModel.destroy({ where: { id } });
  }
}
