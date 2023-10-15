import { Transform } from 'class-transformer';

export class RequestUserDto {
    @Transform((value) => Number(value))
    readonly id: number;
}
