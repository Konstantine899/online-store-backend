import { ApiProperty } from '@nestjs/swagger';

export class GetProfileUserRequest {
  @ApiProperty({ example: 1, description: `Идентификатор пользователя` })
  id: number;
}
