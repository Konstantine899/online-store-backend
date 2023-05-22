import { ApiProperty } from '@nestjs/swagger';

export class LoginCheckRequest {
  @ApiProperty({ example: 1, description: `Идентификатор пользователя` })
  id: number;
}
