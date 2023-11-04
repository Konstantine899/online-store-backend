import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IRefreshDto } from '@app/domain/dto';

export class RefreshDto implements IRefreshDto {
    @ApiProperty({
        example:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2ODI4NTIxNjksImV4cCI6MTY4MjkzODU2OSwic3ViIjoiMSIsImp0aSI6IjY0In0.Mo4kDGxGIB_sgN0U6FYFdgw2KoZdRv5wwCldwLkyzE',
        description: 'refresh token',
    })
    @IsNotEmpty({ message: 'Refresh token не моет быть пустым' })
    @IsString({ message: 'Refresh token должен быть строкой' })
    readonly refreshToken: string;
}
