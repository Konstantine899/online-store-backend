import {
    ArgumentMetadata,
    HttpException,
    HttpStatus,
    Injectable,
    PipeTransform,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { TLogin } from '../dto/auth/login.dto';
import { IRefresh } from '../dto/auth/refresh.dto';
import { ICreateBrand } from '../dto/brand/create-brand.dto';
import { ICreateCategory } from '../dto/category/create-category.dto';
import { Order } from '../dto/order/order.dto';
import { RequestSignedCookies } from '../dto/order/request-signed-cookies.dto';
import { RequestUser } from '../dto/order/request-user.dto';
import { IMakePaymentDto } from '../dto/payment/make.payment.dto';
import { CreateProduct } from '../dto/product/create-product.dto';
import { IPaginateProductDto } from '../dto/product/paginate-product.dto';
import { SearchQuery } from '../dto/product/search-query.dto';
import { ISortQueryDto } from '../dto/product/sort-query.dto';
import { ICreateProductPropertyDto } from '../dto/product-property/create-product-property.dto';
import { ICreateRoleDto } from '../../modules/role/dto/create-role.dto';
import { IAddRoleDto } from '../../modules/user/dto/add-role.dto';
import { ICreateUserDto } from '../../modules/user/dto/create-user.dto';
import { IRemoveRoleDto } from '../../modules/user/dto/remove-role.dto';
import { TRegistration } from '../dto/auth/registration.dto';

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
type UserValue = IAddRoleDto | ICreateUserDto | IRemoveRoleDto;

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
