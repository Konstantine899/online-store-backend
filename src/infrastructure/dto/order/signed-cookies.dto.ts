import { Transform } from 'class-transformer';
import { ISignedCookiesDto } from '../../../domain/dto/order/i-signed-cookies-dto';

export class SignedCookiesDto implements ISignedCookiesDto {
    @Transform((value) => Number(value))
    readonly cartId: number;
}
