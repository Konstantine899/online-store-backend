import { HttpStatus } from '@nestjs/common';
import { IPayload } from '../interfaces/i-payload';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAccessTokenResponse {
  @ApiProperty({ example: HttpStatus.CREATED })
  readonly status: HttpStatus;

  @ApiProperty({
	example: {
		payload: {
		type: 'Bearer',
		accessToken:
			'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NTIsInJvbGVzIjpbeyJpZCI6Miwicm9sZSI6IlVTRVIiLCJkZXNjcmlwdGlvbiI6ItCf0L7Qu9GM0LfQvtCy0LDRgtC10LvRjCJ9XSwiaWF0IjoxNjg0ODQxODI4LCJleHAiOjE2ODQ5MjgyMjgsInN1YiI6IjUyIn0.erl7HAD3IR_ginVHd3SEaXLjlJuWIeWhbMU3SlqSZws',
		},
	},
  })
  readonly data: Omit<IPayload, 'refreshToken'>;
}
