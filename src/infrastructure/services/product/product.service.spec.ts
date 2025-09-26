import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from './product.service';
import { ProductRepository, ProductPropertyRepository } from '@app/infrastructure/repositories';
import { RatingService } from '@app/infrastructure/services';
import { FileService } from '../file/file.service';
import { ProductInfo } from '@app/infrastructure/paginate';


describe('ProductService Pagination V2', () => {
    let service: ProductService;
    let productRepository: jest.Mocked<ProductRepository>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProductService,
                {
                    provide: ProductPropertyRepository,
                    useValue: {},
                },
                {
                    provide: ProductRepository,
                    useValue: {
                        findListProduct: jest.fn(),
                        findListProductByBrandId: jest.fn(),
                        findListProductByCategoryId: jest.fn(),
                        findAllByBrandIdAndCategoryId: jest.fn(),
                    },
                },
                {
                    provide: RatingService,
                    useValue: {},
                },
                {
                    provide: FileService,
                    useValue: {},
                },
            ],
        }).compile();

        service = module.get<ProductService>(ProductService);
        productRepository = module.get(ProductRepository);
    });

    describe('getListProductV2', () => {
        it('должен возвращать данные в новом формате { data, meta }', async () => {
            const mockData = {
                count: 10,
                rows: [
                    { id: 1, name: 'Product 1', price: 100 } as ProductInfo,
                    { id: 2, name: 'Product 2', price: 200 } as ProductInfo,
                ],
            };
            

            productRepository.findListProduct.mockResolvedValue(mockData);

            const result = await service.getListProductV2(
                { search: '' },
                { sort: 'DESC' },
                1,
                5
            );

            expect(result).toHaveProperty('data');
            expect(result).toHaveProperty('meta');
            expect(result.data).toEqual(mockData.rows);
            expect(result.meta.totalCount).toBe(10);
            expect(result.meta.currentPage).toBe(1);
        });
    });

    describe('getListProductByBrandIdV2', () => {
        it('должен возвращать продукты бренда в новом формате', async () => {
            const mockData = {
                count: 5,
                rows: [{ id: 1, name: 'Brand Product', price: 150 }] as ProductInfo[],
            };

            productRepository.findListProductByBrandId.mockResolvedValue(mockData);

            const result = await service.getListProductByBrandIdV2(
                1,
                { search: '' },
                { sort: 'DESC' },
                1,
                5
            );

            expect(result).toHaveProperty('data');
            expect(result).toHaveProperty('meta');
            expect(result.data).toEqual(mockData.rows);
        });
    });
});