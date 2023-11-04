import { Transform } from 'class-transformer';
import { ISignedCookiesDto } from '@app/domain/dto';

export class SignedCookiesDto implements ISignedCookiesDto {
    @Transform((value) => Number(value))
    readonly cartId: number;
}
