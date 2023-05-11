import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { BrandModel } from './brand.model';
import { CreateBrandDto } from './dto/create-brand.dto';
import { BrandRepository } from './brand.repository';

@Injectable()
export class BrandService {
  constructor(private readonly brandRepository: BrandRepository) {}

  public async createBrand(dto: CreateBrandDto): Promise<BrandModel> {
	return this.brandRepository.createBrand(dto);
  }

  public async getListAllBrands(): Promise<BrandModel[]> {
	const brands = await this.brandRepository.findListAllBrands();
	if (!brands.length) {
		this.notFound('К сожалению по вашему запросу ничего не найдено');
	}
	return brands;
  }

  public async getBrand(id: number): Promise<BrandModel> {
	const brand = await this.brandRepository.findBrand(id);
	if (!brand) {
		this.notFound(`Бренд не найден`);
	}
	return brand;
  }

  public async updateBrand(
	id: number,
	dto: CreateBrandDto,
  ): Promise<BrandModel> {
	const brand = await this.getBrand(id);
	return this.brandRepository.updateBrand(dto, brand);
  }

  public async removeBrand(id: number): Promise<number> {
	const brand = await this.getBrand(id);
	return this.brandRepository.removeBrand(brand.id);
  }

  private notFound(message: string): void {
	throw new NotFoundException({
		status: HttpStatus.NOT_FOUND,
		message,
	});
  }
}
