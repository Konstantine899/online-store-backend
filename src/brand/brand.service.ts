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
	const brand = await this.brandRepository.createBrand(dto);
	if (!brand) {
		throw new ConflictException({
		status: HttpStatus.CONFLICT,
		message: 'При создании бренда произошел конфликт',
		});
	}
	return brand;
  }

  public async findAllBrands(): Promise<BrandModel[]> {
	const brands = await this.brandRepository.findAllBrands();
	if (!brands) {
		throw new NotFoundException({
		status: HttpStatus.NOT_FOUND,
		message: 'Бренды не найдены',
		});
	}
	return brands;
  }

  public async findOneBrand(id: number): Promise<BrandModel> {
	const brand = await this.brandRepository.findOneBrand(id);
	if (!brand) {
		throw new NotFoundException({
		status: HttpStatus.NOT_FOUND,
		message: 'Бренд не найден',
		});
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
		throw new ConflictException({
		status: HttpStatus.CONFLICT,
		message: 'Произошел конфликт при обновлении бренда',
		});
	}
	return brand;
  }

  public async remove(id: number): Promise<boolean> {
	const brand = await this.findOneBrand(id);
	const removedBrand = await this.brandRepository.removeBrand(brand.id);
	if (!removedBrand) {
		throw new ConflictException({
		status: HttpStatus.CONFLICT,
		message: 'При удалении бренда произошел конфликт',
		});
	}
	return true;
  }
}
