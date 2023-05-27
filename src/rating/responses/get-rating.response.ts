import { ApiProperty } from '@nestjs/swagger';

export class GetRatingResponse {
  @ApiProperty({ example: 10, description: `Сумма рейтингов` })
  ratingsSum: number;

  @ApiProperty({ example: 2, description: `Количество голосов` })
  votes: number;

  @ApiProperty({
	example: 5,
	description: `Сумма рейтингов / Количество голосов`,
  })
  rating: number;
}