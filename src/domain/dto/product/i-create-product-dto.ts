export interface ICreateProductDto {
    name: string;
    price: number;
    image: Express.Multer.File;
    brandId: number;
    categoryId: number;
}
