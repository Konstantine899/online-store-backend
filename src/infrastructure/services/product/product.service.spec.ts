import { Test, TestingModule } from '@nestjs/testing';
import {
    ConflictException,
    HttpStatus,
    NotFoundException,
} from '@nestjs/common';
import { ProductService } from './product.service';
import {
    ProductRepository,
    ProductPropertyRepository,
} from '@app/infrastructure/repositories';
import { RatingService } from '../rating/rating.service';
import { FileService } from '../file/file.service';
import {
    CreateProductDto,
    SearchDto,
    SortingDto,
} from '@app/infrastructure/dto';
import { SortingEnum } from '@app/domain/dto';
import {
    CreateProductResponse,
    GetProductResponse,
    UpdateProductResponse,
    RemoveProductResponse,
} from '@app/infrastructure/responses';
import { BrandModel, CategoryModel } from '@app/domain/models';
import { ProductInfo } from '@app/infrastructure/paginate';

const mockBrand: BrandModel = {
    id: 1,
    name: 'Test Brand',
    description: 'Test Brand Description',
} as unknown as BrandModel;

const mockCategory: CategoryModel = {
    id: 1,
    name: 'Test Category',
    description: 'Test Category Description',
} as unknown as CategoryModel;

const mockFile: Express.Multer.File = {
    fieldname: 'image',
    originalname: 'test.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024,
    buffer: Buffer.from('test'),
    stream: null,
    destination: '',
    filename: '',
    path: '',
} as unknown as Express.Multer.File;

const mockCreateProductDto: CreateProductDto = {
    name: 'Test Product',
    price: 1000,
    brandId: 1,
    categoryId: 1,
    image: mockFile,
};

const mockSearchDto: SearchDto = {
    search: 'test',
};

const mockSortingDto: SortingDto = {
    sort: SortingEnum.DESC,
};

const mockProductInfo: ProductInfo = {
    id: 1,
    name: 'Test Product',
    price: 1000,
    image: 'test-image.jpg',
    brand: mockBrand,
    category: mockCategory,
} as unknown as ProductInfo;

const mockCreateProductResponse: CreateProductResponse = {
    id: 1,
    name: 'Test Product',
    price: 1000,
    image: 'test-image.jpg',
    brand_id: 1,
    category_id: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
} as unknown as CreateProductResponse;

const mockGetProductResponse: GetProductResponse = {
    id: 1,
    name: 'Test Product',
    price: 1000,
    image: 'test-image.jpg',
    brand: mockBrand,
    category: mockCategory,
    productProperties: [],
    ratings: [],
} as unknown as GetProductResponse;

const mockUpdateProductResponse: UpdateProductResponse = {
    id: 1,
    name: 'Updated Product',
    price: 1500,
    image: 'updated-image.jpg',
    brand_id: 1,
    category_id: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
} as unknown as UpdateProductResponse;

const mockRemoveProductResponse: RemoveProductResponse = {
    status: HttpStatus.OK,
    message: 'success',
};

describe('ProductService', () => {
    let service: ProductService;
    let productRepository: jest.Mocked<ProductRepository>;
    let productPropertyRepository: jest.Mocked<ProductPropertyRepository>;
    let ratingService: jest.Mocked<RatingService>;
    let fileService: jest.Mocked<FileService>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProductService,
                {
                    provide: ProductRepository,
                    useValue: {
                        create: jest.fn(),
                        findProductProperty: jest.fn(),
                        findListProduct: jest.fn(),
                        findListProductByBrandId: jest.fn(),
                        findListProductByCategoryId: jest.fn(),
                        findAllByBrandIdAndCategoryId: jest.fn(),
                        removedProduct: jest.fn(),
                        updateProduct: jest.fn(),
                    },
                },
                {
                    provide: ProductPropertyRepository,
                    useValue: {
                        removeProductPropertiesListByProductId: jest.fn(),
                    },
                },
                {
                    provide: RatingService,
                    useValue: {
                        removeAllRatingsByProductId: jest.fn(),
                    },
                },
                {
                    provide: FileService,
                    useValue: {
                        createFile: jest.fn(),
                        removeFile: jest.fn(),
                        updateFile: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<ProductService>(ProductService);
        productRepository = module.get(ProductRepository);
        productPropertyRepository = module.get(ProductPropertyRepository);
        ratingService = module.get(RatingService);
        fileService = module.get(FileService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('productCreate', () => {
        it('должен успешно создать товар с изображением', async () => {
            const imageName = 'generated-image-name.jpg';
            fileService.createFile.mockResolvedValue(imageName);
            productRepository.create.mockResolvedValue(
                mockCreateProductResponse,
            );

            const result = await service.productCreate(
                mockCreateProductDto,
                mockFile,
            );

            expect(result).toBe(mockCreateProductResponse);
            expect(fileService.createFile).toHaveBeenCalledWith(mockFile);
            expect(productRepository.create).toHaveBeenCalledWith(
                mockCreateProductDto,
                imageName,
            );
        });

        it('должен пробросить ошибку если FileService.createFile выбрасывает исключение', async () => {
            const error = new Error('File creation failed');
            fileService.createFile.mockRejectedValue(error);

            await expect(
                service.productCreate(mockCreateProductDto, mockFile),
            ).rejects.toThrow(error);
        });

        it('должен пробросить ошибку если ProductRepository.create выбрасывает исключение', async () => {
            const imageName = 'generated-image-name.jpg';
            fileService.createFile.mockResolvedValue(imageName);
            const error = new Error('Database error');
            productRepository.create.mockRejectedValue(error);

            await expect(
                service.productCreate(mockCreateProductDto, mockFile),
            ).rejects.toThrow(error);
        });
    });

    describe('getProduct', () => {
        it('должен успешно получить товар по ID', async () => {
            productRepository.findProductProperty.mockResolvedValue(
                mockGetProductResponse,
            );

            const result = await service.getProduct(1);

            expect(result).toBe(mockGetProductResponse);
            expect(productRepository.findProductProperty).toHaveBeenCalledWith(
                1,
            );
        });

        it('должен выбросить NotFoundException если товар не найден', async () => {
            (
                productRepository.findProductProperty as jest.Mock
            ).mockResolvedValue(null);

            await expect(service.getProduct(999)).rejects.toThrow(
                new NotFoundException({
                    status: HttpStatus.NOT_FOUND,
                    message: 'Продукт не найден',
                }),
            );
        });

        it('должен пробросить ошибку если ProductRepository.findProductProperty выбрасывает исключение', async () => {
            const error = new Error('Database error');
            productRepository.findProductProperty.mockRejectedValue(error);

            await expect(service.getProduct(1)).rejects.toThrow(error);
        });
    });

    describe('getListProductV2', () => {
        it('должен успешно получить список товаров с поиском и сортировкой', async () => {
            const mockProducts = {
                rows: [mockProductInfo],
                count: 1,
            };
            productRepository.findListProduct.mockResolvedValue(mockProducts);

            const result = await service.getListProductV2(
                mockSearchDto,
                mockSortingDto,
                1,
                5,
            );

            expect(result).toEqual({
                data: mockProducts.rows,
                meta: expect.objectContaining({
                    totalCount: 1,
                    currentPage: 1,
                    limit: 5,
                }),
            });
            expect(productRepository.findListProduct).toHaveBeenCalledWith(
                mockSearchDto.search,
                mockSortingDto.sort,
                5,
                0,
            );
        });

        it('должен использовать значения по умолчанию для сортировки', async () => {
            const mockProducts = { rows: [], count: 0 };
            productRepository.findListProduct.mockResolvedValue(mockProducts);
            const emptySortingDto = {} as SortingDto;

            await service.getListProductV2(
                mockSearchDto,
                emptySortingDto,
                1,
                5,
            );

            expect(productRepository.findListProduct).toHaveBeenCalledWith(
                mockSearchDto.search,
                SortingEnum.DESC,
                5,
                0,
            );
        });

        it('должен корректно обработать page=0', async () => {
            const mockProducts = { rows: [], count: 0 };
            productRepository.findListProduct.mockResolvedValue(mockProducts);

            await service.getListProductV2(mockSearchDto, mockSortingDto, 0, 5);

            expect(productRepository.findListProduct).toHaveBeenCalledWith(
                mockSearchDto.search,
                mockSortingDto.sort,
                5,
                0, // offset должен быть 0 для page=0
            );
        });
    });

    describe('getListProductByBrandIdV2', () => {
        it('должен успешно получить товары по бренду', async () => {
            const mockProducts = {
                rows: [mockProductInfo],
                count: 1,
            };
            productRepository.findListProductByBrandId.mockResolvedValue(
                mockProducts,
            );

            const result = await service.getListProductByBrandIdV2(
                1,
                mockSearchDto,
                mockSortingDto,
                1,
                5,
            );

            expect(result.data).toBe(mockProducts.rows);
            expect(result.meta).toEqual(
                expect.objectContaining({
                    totalCount: 1,
                    currentPage: 1,
                    limit: 5,
                }),
            );
            expect(
                productRepository.findListProductByBrandId,
            ).toHaveBeenCalledWith(
                1,
                mockSearchDto.search,
                mockSortingDto.sort,
                5,
                0,
            );
        });

        it('должен пробросить ошибку если ProductRepository.findListProductByBrandId выбрасывает исключение', async () => {
            const error = new Error('Database error');
            productRepository.findListProductByBrandId.mockRejectedValue(error);

            await expect(
                service.getListProductByBrandIdV2(
                    1,
                    mockSearchDto,
                    mockSortingDto,
                    1,
                    5,
                ),
            ).rejects.toThrow(error);
        });
    });

    describe('getListProductByCategoryIdV2', () => {
        it('должен успешно получить товары по категории', async () => {
            const mockProducts = {
                rows: [mockProductInfo],
                count: 1,
            };
            productRepository.findListProductByCategoryId.mockResolvedValue(
                mockProducts,
            );

            const result = await service.getListProductByCategoryIdV2(
                1,
                mockSearchDto,
                mockSortingDto,
                1,
                5,
            );

            expect(result.data).toBe(mockProducts.rows);
            expect(result.meta).toEqual(
                expect.objectContaining({
                    totalCount: 1,
                    currentPage: 1,
                    limit: 5,
                }),
            );
            expect(
                productRepository.findListProductByCategoryId,
            ).toHaveBeenCalledWith(
                1,
                mockSearchDto.search,
                mockSortingDto.sort,
                5,
                0,
            );
        });
    });

    describe('getAllByBrandIdAndCategoryIdV2', () => {
        it('должен успешно получить товары по бренду и категории', async () => {
            const mockProducts = {
                rows: [mockProductInfo],
                count: 1,
            };
            productRepository.findAllByBrandIdAndCategoryId.mockResolvedValue(
                mockProducts,
            );

            const result = await service.getAllByBrandIdAndCategoryIdV2(
                1,
                1,
                mockSearchDto,
                mockSortingDto,
                1,
                5,
            );

            expect(result.data).toBe(mockProducts.rows);
            expect(result.meta).toEqual(
                expect.objectContaining({
                    totalCount: 1,
                    currentPage: 1,
                    limit: 5,
                }),
            );
            expect(
                productRepository.findAllByBrandIdAndCategoryId,
            ).toHaveBeenCalledWith(
                1,
                1,
                mockSearchDto.search,
                mockSortingDto.sort,
                5,
                0,
            );
        });
    });

    describe('removeProduct', () => {
        it('должен успешно удалить товар', async () => {
            productRepository.findProductProperty.mockResolvedValue(
                mockGetProductResponse,
            );
            fileService.removeFile.mockResolvedValue(true);
            ratingService.removeAllRatingsByProductId.mockResolvedValue(1);
            productPropertyRepository.removeProductPropertiesListByProductId.mockResolvedValue(
                1,
            );
            productRepository.removedProduct.mockResolvedValue(1);

            const result = await service.removeProduct(1);

            expect(result).toEqual(mockRemoveProductResponse);
            expect(productRepository.findProductProperty).toHaveBeenCalledWith(
                1,
            );
            expect(fileService.removeFile).toHaveBeenCalledWith(
                mockGetProductResponse.image,
            );
            expect(
                ratingService.removeAllRatingsByProductId,
            ).toHaveBeenCalledWith(1);
            expect(
                productPropertyRepository.removeProductPropertiesListByProductId,
            ).toHaveBeenCalledWith(1);
            expect(productRepository.removedProduct).toHaveBeenCalledWith(1);
        });

        it('должен выбросить NotFoundException если товар не найден', async () => {
            (
                productRepository.findProductProperty as jest.Mock
            ).mockResolvedValue(null);

            await expect(service.removeProduct(999)).rejects.toThrow(
                new NotFoundException({
                    status: HttpStatus.NOT_FOUND,
                    message: 'Продукт не найден в БД',
                }),
            );
        });

        it('должен выбросить ConflictException если удаление файла не удалось', async () => {
            productRepository.findProductProperty.mockResolvedValue(
                mockGetProductResponse,
            );
            fileService.removeFile.mockResolvedValue(false);

            await expect(service.removeProduct(1)).rejects.toThrow(
                new ConflictException({
                    status: HttpStatus.CONFLICT,
                    message: 'Произошел конфликт во время удаления файла',
                }),
            );
        });

        it('должен выбросить ConflictException если удаление характеристик не удалось', async () => {
            productRepository.findProductProperty.mockResolvedValue(
                mockGetProductResponse,
            );
            fileService.removeFile.mockResolvedValue(true);
            productPropertyRepository.removeProductPropertiesListByProductId.mockResolvedValue(
                0,
            );
            ratingService.removeAllRatingsByProductId.mockResolvedValue(1);
            productRepository.removedProduct.mockResolvedValue(1);

            const result = await service.removeProduct(1);

            expect(result).toEqual({
                status: HttpStatus.OK,
                message: 'success',
            });
        });

        it('должен выбросить ConflictException если удаление рейтинга не удалось', async () => {
            productRepository.findProductProperty.mockResolvedValue(
                mockGetProductResponse,
            );
            fileService.removeFile.mockResolvedValue(true);
            productPropertyRepository.removeProductPropertiesListByProductId.mockResolvedValue(
                1,
            );
            ratingService.removeAllRatingsByProductId.mockResolvedValue(0);
            productRepository.removedProduct.mockResolvedValue(1);

            const result = await service.removeProduct(1);

            expect(result).toEqual({
                status: HttpStatus.OK,
                message: 'success',
            });
        });

        it('должен выбросить ConflictException если удаление товара не удалось', async () => {
            productRepository.findProductProperty.mockResolvedValue(
                mockGetProductResponse,
            );
            fileService.removeFile.mockResolvedValue(true);
            ratingService.removeAllRatingsByProductId.mockResolvedValue(1);
            productPropertyRepository.removeProductPropertiesListByProductId.mockResolvedValue(
                1,
            );
            productRepository.removedProduct.mockResolvedValue(0);

            await expect(service.removeProduct(1)).rejects.toThrow(
                new ConflictException({
                    status: HttpStatus.CONFLICT,
                    message: 'Произошел конфликт во время удаления продукта',
                }),
            );
        });
    });

    describe('updateProduct', () => {
        it('должен успешно обновить товар', async () => {
            const updatedImageName = 'updated-image.jpg';
            productRepository.findProductProperty.mockResolvedValue(
                mockGetProductResponse,
            );
            fileService.updateFile.mockResolvedValue(updatedImageName);
            productRepository.updateProduct.mockResolvedValue(
                mockUpdateProductResponse,
            );

            const result = await service.updateProduct(
                1,
                mockCreateProductDto,
                mockFile,
            );

            expect(result).toBe(mockUpdateProductResponse);
            expect(productRepository.findProductProperty).toHaveBeenCalledWith(
                1,
            );
            expect(fileService.updateFile).toHaveBeenCalledWith(
                mockGetProductResponse.image,
                mockFile,
            );
            expect(productRepository.updateProduct).toHaveBeenCalledWith(
                mockCreateProductDto,
                mockGetProductResponse,
                updatedImageName,
            );
        });

        it('должен выбросить NotFoundException если товар не найден', async () => {
            (
                productRepository.findProductProperty as jest.Mock
            ).mockResolvedValue(null);

            await expect(
                service.updateProduct(999, mockCreateProductDto, mockFile),
            ).rejects.toThrow(
                new NotFoundException({
                    status: HttpStatus.NOT_FOUND,
                    message: 'Продукт не найден в БД',
                }),
            );
        });

        it('должен пробросить ошибку если FileService.updateFile выбрасывает исключение', async () => {
            productRepository.findProductProperty.mockResolvedValue(
                mockGetProductResponse,
            );
            const error = new Error('File update failed');
            fileService.updateFile.mockRejectedValue(error);

            await expect(
                service.updateProduct(1, mockCreateProductDto, mockFile),
            ).rejects.toThrow(error);
        });

        it('должен пробросить ошибку если ProductRepository.updateProduct выбрасывает исключение', async () => {
            const updatedImageName = 'updated-image.jpg';
            productRepository.findProductProperty.mockResolvedValue(
                mockGetProductResponse,
            );
            fileService.updateFile.mockResolvedValue(updatedImageName);
            const error = new Error('Database error');
            productRepository.updateProduct.mockRejectedValue(error);

            await expect(
                service.updateProduct(1, mockCreateProductDto, mockFile),
            ).rejects.toThrow(error);
        });
    });

    describe('getPaginate (private method)', () => {
        it('должен корректно рассчитать пагинацию для обычных значений', () => {
            // Используем рефлексию для тестирования приватного метода
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getPaginate = (service as any).getPaginate.bind(service);

            const result = getPaginate(2, 10);

            expect(result).toEqual({
                limit: 10,
                offset: 10, // (2-1) * 10
            });
        });

        it('должен исправить page=0 на page=1', () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getPaginate = (service as any).getPaginate.bind(service);

            const result = getPaginate(0, 5);

            expect(result).toEqual({
                limit: 5,
                offset: 0, // (1-1) * 5
            });
        });

        it('должен обработать отрицательные значения page', () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getPaginate = (service as any).getPaginate.bind(service);

            const result = getPaginate(-1, 5);

            expect(result).toEqual({
                limit: 5,
                offset: 0, // (1-1) * 5
            });
        });
    });

    describe('getMetadata (private method)', () => {
        it('должен корректно рассчитать метаданные', () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getMetadata = (service as any).getMetadata.bind(service);

            const result = getMetadata(25, 2, 10);

            expect(result).toEqual({
                totalCount: 25,
                lastPage: 3, // Math.ceil(25/10)
                currentPage: 2,
                nextPage: 3,
                previousPage: 1,
                limit: 10,
            });
        });

        it('должен обработать случай с пустым списком', () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getMetadata = (service as any).getMetadata.bind(service);

            const result = getMetadata(0, 1, 5);

            expect(result).toEqual({
                totalCount: 0,
                lastPage: 0,
                currentPage: 1,
                nextPage: 2,
                previousPage: 0,
                limit: 5,
            });
        });
    });

    describe('Edge cases', () => {
        it('должен обработать пустой поисковый запрос', async () => {
            const emptySearchDto = { search: '' };
            const mockProducts = { rows: [], count: 0 };
            productRepository.findListProduct.mockResolvedValue(mockProducts);

            await service.getListProductV2(
                emptySearchDto,
                mockSortingDto,
                1,
                5,
            );

            expect(productRepository.findListProduct).toHaveBeenCalledWith(
                '',
                mockSortingDto.sort,
                5,
                0,
            );
        });

        it('должен обработать null значения в зависимостях', async () => {
            (
                productRepository.findProductProperty as jest.Mock
            ).mockResolvedValue(null);

            await expect(service.getProduct(999)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('должен обработать большие значения пагинации', async () => {
            const mockProducts = { rows: [], count: 1000 };
            productRepository.findListProduct.mockResolvedValue(mockProducts);

            const result = await service.getListProductV2(
                mockSearchDto,
                mockSortingDto,
                100,
                50,
            );

            expect(result.meta).toEqual(
                expect.objectContaining({
                    totalCount: 1000,
                    currentPage: 100,
                    limit: 50,
                    lastPage: 20,
                    nextPage: 101,
                    previousPage: 99,
                }),
            );
        });

        it('должен обработать ошибки при работе с файлами', async () => {
            productRepository.findProductProperty.mockResolvedValue(
                mockGetProductResponse,
            );
            const error = new Error('File system error');
            fileService.removeFile.mockRejectedValue(error);

            await expect(service.removeProduct(1)).rejects.toThrow(error);
        });
    });

    describe('Integration scenarios', () => {
        it('должен выполнить полный цикл создания и удаления товара', async () => {
            // Создание товара
            const imageName = 'test-image.jpg';
            fileService.createFile.mockResolvedValue(imageName);
            productRepository.create.mockResolvedValue(
                mockCreateProductResponse,
            );

            const createResult = await service.productCreate(
                mockCreateProductDto,
                mockFile,
            );
            expect(createResult).toBe(mockCreateProductResponse);

            // Получение товара
            productRepository.findProductProperty.mockResolvedValue(
                mockGetProductResponse,
            );
            const getResult = await service.getProduct(1);
            expect(getResult).toBe(mockGetProductResponse);

            // Удаление товара
            fileService.removeFile.mockResolvedValue(true);
            ratingService.removeAllRatingsByProductId.mockResolvedValue(1);
            productPropertyRepository.removeProductPropertiesListByProductId.mockResolvedValue(
                1,
            );
            productRepository.removedProduct.mockResolvedValue(1);

            const removeResult = await service.removeProduct(1);
            expect(removeResult).toEqual(mockRemoveProductResponse);
        });

        it('должен выполнить поиск с различными фильтрами', async () => {
            const mockProducts = { rows: [mockProductInfo], count: 1 };

            // Поиск по всем товарам
            productRepository.findListProduct.mockResolvedValue(mockProducts);
            await service.getListProductV2(mockSearchDto, mockSortingDto, 1, 5);

            // Поиск по бренду
            productRepository.findListProductByBrandId.mockResolvedValue(
                mockProducts,
            );
            await service.getListProductByBrandIdV2(
                1,
                mockSearchDto,
                mockSortingDto,
                1,
                5,
            );

            // Поиск по категории
            productRepository.findListProductByCategoryId.mockResolvedValue(
                mockProducts,
            );
            await service.getListProductByCategoryIdV2(
                1,
                mockSearchDto,
                mockSortingDto,
                1,
                5,
            );

            // Поиск по бренду и категории
            productRepository.findAllByBrandIdAndCategoryId.mockResolvedValue(
                mockProducts,
            );
            await service.getAllByBrandIdAndCategoryIdV2(
                1,
                1,
                mockSearchDto,
                mockSortingDto,
                1,
                5,
            );

            // Проверяем, что все методы были вызваны
            expect(productRepository.findListProduct).toHaveBeenCalled();
            expect(
                productRepository.findListProductByBrandId,
            ).toHaveBeenCalled();
            expect(
                productRepository.findListProductByCategoryId,
            ).toHaveBeenCalled();
            expect(
                productRepository.findAllByBrandIdAndCategoryId,
            ).toHaveBeenCalled();
        });
    });

    describe('Error handling', () => {
        it('должен корректно обрабатывать ошибки базы данных', async () => {
            const dbError = new Error('Connection timeout');
            productRepository.findProductProperty.mockRejectedValue(dbError);

            await expect(service.getProduct(1)).rejects.toThrow(dbError);
        });

        it('должен корректно обрабатывать ошибки файловой системы', async () => {
            const fsError = new Error('Disk full');
            fileService.createFile.mockRejectedValue(fsError);

            await expect(
                service.productCreate(mockCreateProductDto, mockFile),
            ).rejects.toThrow(fsError);
        });

        it('должен корректно обрабатывать ошибки рейтингового сервиса', async () => {
            productRepository.findProductProperty.mockResolvedValue(
                mockGetProductResponse,
            );
            fileService.removeFile.mockResolvedValue(true);
            const ratingError = new Error('Rating service unavailable');
            ratingService.removeAllRatingsByProductId.mockRejectedValue(
                ratingError,
            );

            await expect(service.removeProduct(1)).rejects.toThrow(ratingError);
        });
    });

    describe('Performance scenarios', () => {
        it('должен эффективно обрабатывать большие списки товаров', async () => {
            const largeProductList = Array.from({ length: 1000 }, (_, i) => ({
                ...mockProductInfo,
                id: i + 1,
                name: `Product ${i + 1}`,
            }));

            const mockProducts = {
                rows: largeProductList.slice(0, 50), // Первые 50
                count: 1000,
            } as unknown as { rows: ProductInfo[]; count: number };

            productRepository.findListProduct.mockResolvedValue(mockProducts);

            const result = await service.getListProductV2(
                mockSearchDto,
                mockSortingDto,
                1,
                50,
            );

            expect(result.data).toHaveLength(50);
            expect(result.meta.totalCount).toBe(1000);
            expect(result.meta.lastPage).toBe(20); // Math.ceil(1000/50)
        });

        it('должен корректно обрабатывать пустые результаты поиска', async () => {
            const mockProducts = { rows: [], count: 0 };
            productRepository.findListProduct.mockResolvedValue(mockProducts);

            const result = await service.getListProductV2(
                mockSearchDto,
                mockSortingDto,
                1,
                5,
            );

            expect(result.data).toEqual([]);
            expect(result.meta.totalCount).toBe(0);
            expect(result.meta.lastPage).toBe(0);
        });
    });
});
