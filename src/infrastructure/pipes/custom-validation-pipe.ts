import {
    ArgumentMetadata,
    HttpException,
    HttpStatus,
    Injectable,
    PipeTransform,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { IRefreshDto } from '../../domain/dto/auth/i-refresh-dto';
import { TLogin, TRegistration } from '../../domain/dto/auth/I-auth-dto';
import { ICreateBrand } from '../../domain/dto/brand/i-create-brand-dto';
import { ICreateCategory } from '../../domain/dto/category/i-create-category-dto';
import { IOrderDto } from '../../domain/dto/order/i-order-dto';
import { ISignedCookiesDto } from '../../domain/dto/order/i-signed-cookies-dto';
import { IUserOrderDto } from '../../domain/dto/order/i-user-order-dto';
import { IMakePaymentDto } from '../../domain/dto/payment/i-make-payment-dto';
import { ICreateProductDto } from '../../domain/dto/product/i-create-product-dto';
import { ISearchDto } from '../../domain/dto/product/i-search-dto';
import { ISortingDto } from '../../domain/dto/product/i-sorting-dto';
import { ICreateProductPropertyDto } from '../../domain/dto/product-property/i-create-product-property-dto';
import { ICreateRoleDto } from '../../domain/dto/role/i-create-role-dto';
import { IAddRoleDto } from '../../domain/dto/user/i-add-role-dto';
import { ICreateUserDto } from '../../domain/dto/user/i-create-user-dto';
import { IRemoveRoleDto } from '../../domain/dto/user/i-remove-role-dto';

type AuthValue = TRegistration | TLogin | IRefreshDto;
type BrandValue = ICreateBrand;
type CategoryValue = ICreateCategory;
type OrderValue = IOrderDto | ISignedCookiesDto | IUserOrderDto;
type PaymentValue = IMakePaymentDto;
type ProductValue = ICreateProductDto | ISearchDto | ISortingDto;
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
