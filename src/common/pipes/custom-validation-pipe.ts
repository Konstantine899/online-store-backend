import {
    ArgumentMetadata,
    HttpException,
    HttpStatus,
    Injectable,
    PipeTransform,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Login } from '../../modules/auth/dto/login.dto';
import { Refresh } from '../../modules/auth/dto/refresh.dto';
import { Registration } from '../../modules/auth/dto/registration.dto';
import { CreateBrand } from '../../modules/brand/dto/create-brand.dto';
import { CreateCategory } from '../../modules/category/dto/create-category.dto';
import { Order } from '../../modules/order/dto/order.dto';
import { RequestSignedCookies } from '../../modules/order/dto/request-signed-cookies.dto';
import { RequestUser } from '../../modules/order/dto/request-user.dto';
import { MakePayment } from '../../modules/payment/dto/make-payment.dto';
import { CreateProduct } from '../../modules/product/dto/create-product.dto';
import { PaginateProduct } from '../../modules/product/dto/paginate-product.dto';
import { SearchQuery } from '../../modules/product/dto/search-query.dto';
import { SortQuery } from '../../modules/product/dto/sort-query.dto';
import { CreateProductProperty } from '../../modules/product-property/dto/create-product-property.dto';
import { CreateRole } from '../../modules/role/dto/create-role.dto';
import { AddRole } from '../../modules/user/dto/add-role.dto';
import { CreateUser } from '../../modules/user/dto/create-user.dto';
import { RemoveRole } from '../../modules/user/dto/remove-role.dto';

type AuthValue = Registration | Login | Refresh;
type BrandValue = CreateBrand;
type CategoryValue = CreateCategory;
type OrderValue = Order | RequestSignedCookies | RequestUser;
type PaymentValue = MakePayment;
type ProductValue = CreateProduct | PaginateProduct | SearchQuery | SortQuery;
type ProductPropertyValue = CreateProductProperty;
type RoleValue = CreateRole;
type UserValue = AddRole | CreateUser | RemoveRole;

type Value =
    | AuthValue
    | BrandValue
    | CategoryValue
    | OrderValue
    | PaymentValue
    | ProductValue
    | ProductPropertyValue
    | RoleValue
    | UserValue;

export interface FormatErrors {
    status: HttpStatus;
    property: string;
    messages: string[];
    value: Value;
}

@Injectable()
export class CustomValidationPipe
    implements PipeTransform<Value, Promise<FormatErrors[] | Value>>
{
    public async transform(
        value: Value,
        { metatype }: ArgumentMetadata,
    ): Promise<FormatErrors[] | Value> {
        if (!metatype || !this.validateMetaType(metatype)) {
            return value;
        }

        const object = plainToInstance(metatype, value);
        const errors = await validate(object);

        if (errors.length > 0) {
            const formatErrors: FormatErrors[] = errors.map((error) => {
                return {
                    status: HttpStatus.BAD_REQUEST,
                    property: error.property,
                    messages: `${Object.values(error.constraints).join(
                        ', ',
                    )}`.split(', '),
                    value: error.value,
                };
            });
            throw new HttpException(formatErrors, HttpStatus.BAD_REQUEST);
        }
        return value;
    }

    private validateMetaType(metatype: Function): boolean {
        const types: Function[] = [Boolean, String, Number, Array, Object];
        return !types.includes(metatype);
    }
}
