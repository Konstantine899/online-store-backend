import {
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RatingService } from './rating.service';
import { JwtGuard } from '../token/jwt.guard';

@Controller('rating')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @HttpCode(201)
  @UseGuards(JwtGuard)
  @Post('/product/:productId([0-9]+)/rating/:rating([1-5])')
  public async createRating(
	@Req() request,
	@Param('productId', ParseIntPipe) productId: number,
	@Param('rating', ParseIntPipe) rating: number,
  ) {
	const { id } = request.user;
	return this.ratingService.createRating(id, productId, rating);
  }

  @HttpCode(200)
  @Get('/product/:productId([0-9]+)')
  public async getRating(@Param('productId', ParseIntPipe) productId: number) {
	return this.ratingService.getRating(productId);
  }
}
