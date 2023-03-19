import { IsNotEmpty } from 'class-validator';

export class RefreshRequestDto {
  @IsNotEmpty({ message: 'Refresh token не моет быть пустым' })
  readonly refreshToken: string;
}
