import {
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BrandModel } from './brand.model';
import { CreateBrandDto } from './dto/create-brand.dto';
import { BrandRepository } from './brand.repository';

@Injectable()
export class BrandService {
  constructor(private readonly brandRepository: BrandRepository) {}

  public async createBrand(dto: CreateBrandDto): Promise<BrandModel> {
	return this.brandRepository.createBrand(dto);
  }

  public async findAllBrands(): Promise<BrandModel[]> {
	const brands = await this.brandRepository.findAllBrands();
	if (!brands.length) {
		this.notFound('К сожалению по вашему запросу ничего не найдено');
	}
	return brands;
  }

  public async findOneBrand(id: number): Promise<BrandModel> {
	const brand = await this.brandRepository.findOneBrand(id);
	if (!brand) {
		this.notFound(`Бренд не найден`);
	}
	return brand;
  }

  public async updateBrand(
	id: number,
	dto: CreateBrandDto,
  ): Promise<BrandModel> {
	const brand = await this.findOneBrand(id);
	const updatedBrand = await this.brandRepository.updateBrand(dto, brand);
	if (!updatedBrand) {
		this.conflict('Произошел конфликт при обновлении бренда');
	}
	return brand;
  }

  public async remove(id: number): Promise<boolean> {
	const brand = await this.findOneBrand(id);
	const removedBrand = await this.brandRepository.removeBrand(brand.id);
	if (!removedBrand) {
		this.conflict('При удалении бренда произошел конфликт');
	}
	return true;
  }

  private conflict(message: string): void {
	throw new ConflictException({
		status: HttpStatus.CONFLICT,
		message,
	});
  }

  private notFound(message: string): void {
	throw new NotFoundException({
		status: HttpStatus.NOT_FOUND,
		message,
	});
  }
}
