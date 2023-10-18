import { Transform } from 'class-transformer';

export interface RequestSignedCookies {
    cartId: number;
}

export class RequestSignedCookiesDto implements RequestSignedCookies {
    @Transform((value) => Number(value))
    readonly cartId: number;
}
