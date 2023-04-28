import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshDto {
  @IsNotEmpty({ message: 'Refresh token не моет быть пустым' })
  @IsString({ message: 'Refresh token должен быть строкой' })
  readonly refreshToken: string;
}
