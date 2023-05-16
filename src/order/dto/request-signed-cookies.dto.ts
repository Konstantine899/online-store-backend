import { Transform } from 'class-transformer';

export class RequestSignedCookiesDto {
  @Transform((value) => Number(value))
  readonly cartId: number;
}
