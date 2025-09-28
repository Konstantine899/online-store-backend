import {
    ConflictException,
    HttpStatus,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from '@app/infrastructure/dto';
import { CategoryRepository } from '@app/infrastructure/repositories';
import {
    CreateCategoryResponse,
    ListAllCategoriesResponse,
    CategoryResponse,
    UpdateCategoryResponse,
    RemoveCategoryResponse,
} from '@app/infrastructure/responses';
import { ICategoryService } from '@app/domain/services';
import { FileService } from '@app/infrastructure/services/file/file.service';

@Injectable()
export class CategoryService implements ICategoryService {
    constructor(
        private readonly categoryRepository: CategoryRepository,
        private readonly fileService: FileService,
    ) {}

    public async createCategory(
        dto: CreateCategoryDto,
        image: Express.Multer.File,
    ): Promise<CreateCategoryResponse> {
        const imageName = await this.fileService.createFile(image);
        return this.categoryRepository.createCategory(dto, imageName);
    }

    public async getListAllCategories(): Promise<ListAllCategoriesResponse[]> {
        const categories = await this.categoryRepository.findListAllCategories();
        return categories; // Всегда возвращаем массив, даже пустой
    }

    public async getCategory(id: number): Promise<CategoryResponse> {
        const category = await this.categoryRepository.findCategory(id);
        if (!category) {
            this.notFound('Категория товара не найдена');
        }
        return category;
    }

    public async updateCategory(
        id: number,
        dto: CreateCategoryDto,
        image: Express.Multer.File,
    ): Promise<UpdateCategoryResponse> {
        const category = await this.getCategory(id);
        const updatedNameImage = await this.fileService.updateFile(
            category.image,
            image,
        );
        return this.categoryRepository.updateCategory(
            dto,
            category,
            updatedNameImage,
        );
    }

    public async removeCategory(id: number): Promise<RemoveCategoryResponse> {
        const category = await this.getCategory(id);
        if (!category) {
            this.notFound('Категория товара не найдена');
        }
        const removedFile = await this.fileService.removeFile(category.image);

        await this.categoryRepository.removeCategory(category.id);
        if (!removedFile) {
            this.conflict('Произошел конфликт во время удаления файла');
        }
        return {
            status: HttpStatus.OK,
            message: 'success',
        };
    }

    private notFound(message: string): void {
        throw new NotFoundException({
            status: HttpStatus.NOT_FOUND,
            message,
        });
    }

    private conflict(message: string): void {
        throw new ConflictException({
            status: HttpStatus.CONFLICT,
            message,
        });
    }
}
