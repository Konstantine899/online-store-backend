import {
    ArgumentMetadata,
    HttpException,
    HttpStatus,
    Injectable,
    PipeTransform,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { TLogin } from '../../modules/auth/dto/login.dto';
import { IRefresh } from '../../modules/auth/dto/refresh.dto';
import { ICreateBrand } from '../../modules/brand/dto/create-brand.dto';
import { ICreateCategory } from '../../modules/category/dto/create-category.dto';
import { Order } from '../../modules/order/dto/order.dto';
import { RequestSignedCookies } from '../../modules/order/dto/request-signed-cookies.dto';
import { RequestUser } from '../../modules/order/dto/request-user.dto';
import { IMakePaymentDto } from '../../modules/payment/dto/make-payment.dto';
import { CreateProduct } from '../../modules/product/dto/create-product.dto';
import { IPaginateProductDto } from '../../modules/product/dto/paginate-product.dto';
import { SearchQuery } from '../../modules/product/dto/search-query.dto';
import { ISortQueryDto } from '../../modules/product/dto/sort-query.dto';
import { ICreateProductPropertyDto } from '../../modules/product-property/dto/create-product-property.dto';
import { ICreateRoleDto } from '../../modules/role/dto/create-role.dto';
import { AddRole } from '../../modules/user/dto/add-role.dto';
import { CreateUser } from '../../modules/user/dto/create-user.dto';
import { RemoveRole } from '../../modules/user/dto/remove-role.dto';
import { TRegistration } from '../../modules/auth/dto/registration.dto';

type AuthValue = TRegistration | TLogin | IRefresh;
type BrandValue = ICreateBrand;
type CategoryValue = ICreateCategory;
type OrderValue = Order | RequestSignedCookies | RequestUser;
type PaymentValue = IMakePaymentDto;
type ProductValue =
    | CreateProduct
    | IPaginateProductDto
    | SearchQuery
    | ISortQueryDto;
type ProductPropertyValue = ICreateProductPropertyDto;
type RoleValue = ICreateRoleDto;
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
