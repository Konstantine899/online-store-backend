import { ApiProperty } from '@nestjs/swagger';

export class UserRequest {
  @ApiProperty({ example: 1, description: `Идентификатор пользователя` })
  id: number;
}
