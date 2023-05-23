import { HttpStatus } from '@nestjs/common';
import { IPayload } from '../interfaces/i-payload';
import { ApiProperty } from '@nestjs/swagger';

export class LoginResponse {
  @ApiProperty({ example: HttpStatus.OK })
  readonly status: HttpStatus;

  @ApiProperty({
	example: {
		payload: {
		type: 'Bearer',
		accessToken:
			'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NTEsInJvbGVzIjpbeyJpZCI6Miwicm9sZSI6IlVTRVIiLCJkZXNjcmlwdGlvbiI6ItCf0L7Qu9GM0LfQvtCy0LDRgtC10LvRjCJ9XSwiaWF0IjoxNjg0ODI5MzAwLCJleHAiOjE2ODQ5MTU3MDAsInN1YiI6IjUxIn0.w64QkUzTAReR5WAFutdzfIbvmoYb3rNJT20CJfUiue0',
		refreshToken:
			'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2ODQ4MjkzMDAsImV4cCI6MTY4NDkxNTcwMCwic3ViIjoiNTEiLCJqdGkiOiI4NyJ9.fkPoMmVsoSUVWE1etpYcstsxajch-6VuQqLdVeohfX8',
		},
	},
  })
  readonly data: IPayload;
}
