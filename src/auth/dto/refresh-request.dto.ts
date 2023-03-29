import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshRequestDto {
  @IsNotEmpty({ message: 'Refresh token не моет быть пустым' })
  @IsString({ message: 'Refresh token должен быть строкой' })
  readonly refreshToken: string;
}
