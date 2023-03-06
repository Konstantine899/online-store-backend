import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BrandModel } from './brand.model';
import { CreateBrandDto } from './dto/create-brand.dto';

@Injectable()
export class BrandService {
  constructor(
	@InjectModel(BrandModel) private brandRepository: typeof BrandModel,
  ) {}

  async create(dto: CreateBrandDto): Promise<BrandModel> {
	const brand = await this.brandRepository.create(dto);
	if (!brand) {
		throw new HttpException(
		'Внутренняя ошибка сервера',
		HttpStatus.INTERNAL_SERVER_ERROR,
		);
	}
	return brand;
  }

  async findAll(): Promise<BrandModel[]> {
	const brands = await this.brandRepository.findAll();
	if (!brands) {
		throw new NotFoundException('Не найдено');
	}
	return brands;
  }

  async findOne(id: number): Promise<BrandModel> {
	const brand = await this.brandRepository.findByPk(id);
	if (!brand) {
		throw new NotFoundException('Не найдено');
	}
	return brand;
  }

  async update(id: number, dto: CreateBrandDto): Promise<BrandModel> {
	const brand = await this.brandRepository.findByPk(id);
	if (!brand) {
		throw new NotFoundException('Не найдено');
	}
	const updatedBrand = await brand.update({ ...dto, name: dto.name });
	if (!updatedBrand) {
		throw new HttpException(
		'Внутренняя ошибка сервера',
		HttpStatus.INTERNAL_SERVER_ERROR,
		);
	}
	return brand;
  }

  async remove(id: number): Promise<boolean> {
	const brand = await this.brandRepository.findByPk(id);
	if (!brand) {
		throw new NotFoundException('Не найдено');
	}
	const removedBrand = await this.brandRepository.destroy({ where: { id } });
	if (!removedBrand) {
		throw new HttpException(
		'Внутренняя ошибка сервера',
		HttpStatus.INTERNAL_SERVER_ERROR,
		);
	}
	return true;
  }
}
