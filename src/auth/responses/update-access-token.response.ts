import { ApiProperty } from '@nestjs/swagger';

export class UpdateAccessTokenResponse {
  @ApiProperty({ example: `Bearer`, description: `Тип токена` })
  type: string;

  @ApiProperty({
	example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NTMsInJvbGVzIjpbXSwiaWF0IjoxNjg1MjgwMjk4LCJleHAiOjE2ODUzNjY2OTgsInN1YiI6IjUzIn0.Xb9fbsbj54CKNJ7WlR5Elc9n01urDXz5ATdNP5BAQBM`,
	description: `Access token`,
  })
  accessToken: string;
}
