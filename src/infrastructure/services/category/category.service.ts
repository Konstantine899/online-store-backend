import {
    ConflictException,
    HttpStatus,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto, SearchDto, SortingDto } from '@app/infrastructure/dto';
import { CategoryRepository } from '@app/infrastructure/repositories';
import {
    CreateCategoryResponse,
    ListAllCategoriesResponse,
    CategoryResponse,
    UpdateCategoryResponse,
    RemoveCategoryResponse,
} from '@app/infrastructure/responses';
import { GetListCategoriesV2Response } from '@app/infrastructure/responses/category/get-list-categories-v2.response';
import { MetaData } from '@app/infrastructure/paginate';
import { SortingEnum } from '@app/domain/dto';
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
        const categories =
            await this.categoryRepository.findListAllCategories();
        return categories; // Всегда возвращаем массив, даже пустой
    }

    // SAAS-003: V2 with pagination support
    public async getListCategoriesV2(
        searchQuery: SearchDto,
        sortQuery: SortingDto,
        page: number,
        size: number,
    ): Promise<GetListCategoriesV2Response> {
        const { search } = searchQuery;
        const { sort = SortingEnum.DESC } = sortQuery;
        const { limit, offset } = this.getPaginate(page, size);

        const categories = await this.categoryRepository.findListAllCategoriesV2(
            search,
            sort,
            limit,
            offset,
        );

        const metaData = this.getMetadata(categories.count, page, limit);

        return {
            data: categories.rows,
            meta: metaData,
        };
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
        const updatedNameImage = await this.fileService.updateFile(
            prevImage,
            image,
        );
        // Получаем ORM-модель для обновления без использования any
        const repoWithModel = this.categoryRepository as unknown as {
            categoryModel: typeof CategoryModel;
        };
        const categoryModel = await repoWithModel.categoryModel.findByPk(id);
        if (!categoryModel) {
            this.notFound('Категория товара не найдена');
        }
        return this.categoryRepository.updateCategory(
            dto,
            categoryModel!,
            updatedNameImage,
        );
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

    // SAAS-003: Pagination helper methods
    private getPaginate(
        page: number,
        size: number,
    ): {
        limit: number;
        offset: number;
    } {
        const limit = size;
        // Исправляем page=0 на page=1 для корректного offset
        const correctedPage = Math.max(1, page);
        const offset = (correctedPage - 1) * limit;
        return {
            limit,
            offset,
        };
    }

    private getMetadata(count: number, page: number, limit: number): MetaData {
        return {
            totalCount: count,
            lastPage: Math.ceil(count / limit),
            currentPage: page,
            nextPage: page + 1,
            previousPage: page - 1,
            limit,
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
