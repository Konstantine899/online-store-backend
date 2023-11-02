import { ICreateProductPropertyDto } from '../dto/product-property/i-create-product-property-dto';
import { ICreateProductDto } from '../dto/product/i-create-product-dto';
import { ISearchDto } from '../dto/product/i-search-dto';
import { ISortingDto } from '../dto/product/i-sorting-dto';
import { ICreateCategory } from '../dto/category/i-create-category-dto';
import { ICreateRoleDto } from '../dto/role/i-create-role-dto';
import { IMakePaymentDto } from '../dto/payment/i-make-payment-dto';
import { TLogin, TRegistration } from '../dto/auth/I-auth-dto';
import { IRefreshDto } from '../dto/auth/i-refresh-dto';
import { HttpStatus } from '@nestjs/common';
import { ICreateBrand } from '../dto/brand/i-create-brand-dto';
import { IAddRoleDto } from '../dto/user/i-add-role-dto';
import { ICreateUserDto } from '../dto/user/i-create-user-dto';
import { IRemoveRoleDto } from '../dto/user/i-remove-role-dto';
import { IOrderDto } from '../dto/order/i-order-dto';
import { ISignedCookiesDto } from '../dto/order/i-signed-cookies-dto';
import { IUserOrderDto } from '../dto/order/i-user-order-dto';

type TAuthValue = TRegistration | TLogin | IRefreshDto;
type TBrandValue = ICreateBrand;
type TCategoryValue = ICreateCategory;
type TOrderValue = IOrderDto | ISignedCookiesDto | IUserOrderDto;
type TPaymentValue = IMakePaymentDto;
type TProductValue = ICreateProductDto | ISearchDto | ISortingDto;
type TProductPropertyValue = ICreateProductPropertyDto;
type TRoleValue = ICreateRoleDto;
type TUserValue = IAddRoleDto | ICreateUserDto | IRemoveRoleDto;
export type TValue =
    | TAuthValue
    | TBrandValue
    | TCategoryValue
    | TOrderValue
    | TPaymentValue
    | TProductValue
    | TProductPropertyValue
    | TRoleValue
    | TUserValue;

export interface ICustomValidationPipe {
    status: HttpStatus;
    property: string;
    messages: string[];
    value: TValue;
}
