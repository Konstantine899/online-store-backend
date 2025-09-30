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
import { CategoryModel } from '@app/domain/models';

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
        const category = await this.categoryRepository.findCategory(id);
        if (!category) {
            this.notFound('Категория товара не найдена');
        }
        const prevImage = category.image ?? '';
        const updatedNameImage = await this.fileService.updateFile(prevImage, image);
        // Получаем ORM-модель для обновления без использования any
        const repoWithModel = this.categoryRepository as unknown as { categoryModel: typeof CategoryModel };
        const categoryModel = await repoWithModel.categoryModel.findByPk(id);
        if (!categoryModel) {
            this.notFound('Категория товара не найдена');
        }
        return this.categoryRepository.updateCategory(dto, categoryModel!, updatedNameImage);
    }

    public async removeCategory(id: number): Promise<RemoveCategoryResponse> {
        const category = await this.categoryRepository.findCategory(id);
        if (!category) {
            this.notFound('Категория товара не найдена');
        }
        const toRemove = category.image ?? '';
        const removedFile = await this.fileService.removeFile(toRemove);

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
