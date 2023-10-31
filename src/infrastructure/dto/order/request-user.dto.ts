import { Transform } from 'class-transformer';

export interface RequestUser {
    id: number;
}

export class RequestUserDto implements RequestUser {
    @Transform((value) => Number(value))
    readonly id: number;
}
