import type {
    TLogin,
    TRegistration,
    IRefreshDto,
    ICreateBrand,
    ICreateCategory,
    IMakePaymentDto,
    ICreateProductDto,
    ISearchDto,
    ISortingDto,
    ICreateProductPropertyDto,
    ICreateRoleDto,
    IAddRoleDto,
    ICreateUserDto,
    IRemoveRoleDto,
} from '@app/domain/dto';
import type { HttpStatus } from '@nestjs/common';
import type { IOrderDto, ISignedCookiesDto, IUserOrderDto } from '@app/domain/dto';

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
