import { IsNumber } from 'class-validator';

export class RequestUserDto {
  @IsNumber()
  readonly id: number;
}
