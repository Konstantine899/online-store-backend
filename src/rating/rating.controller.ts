import {
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { RatingService } from './rating.service';
import { JwtGuard } from '../token/jwt.guard';
import { CreateRatingDocumentation } from './decorators/create-rating.documentation';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { UserRequest } from './requests/user.request';
import { GetRatingDocumentation } from './decorators/get-rating.documentation';
import { CreateRatingResponse } from './responses/create-rating.response';
import { GetRatingResponse } from './responses/get-rating.response';
import { TransactionInterceptor } from '../interceptors/transaction-interceptor';
import { TransactionDecorator } from '../decorators/transaction-decorator';
import { Transaction } from 'sequelize';

@ApiTags(`Рейтинг`)
@Controller('rating')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @CreateRatingDocumentation()
  @HttpCode(201)
  @UseGuards(JwtGuard)
  @Post('/product/:productId([0-9]+)/rating/:rating([1-5])')
  @UseInterceptors(TransactionInterceptor)
  public async createRating(
	@Req() request: Request,
	@Param('productId', ParseIntPipe) productId: number,
	@Param('rating', ParseIntPipe) rating: number,
	@TransactionDecorator() transaction: Transaction,
  ): Promise<CreateRatingResponse> {
	const { id } = request.user as UserRequest;
	return this.ratingService.createRating(id, productId, rating);
  }

  @GetRatingDocumentation()
  @HttpCode(200)
  @Get('/product/:productId([0-9]+)')
  @UseInterceptors(TransactionInterceptor)
  public async getRating(
	@Param('productId', ParseIntPipe) productId: number,
	@TransactionDecorator() transaction: Transaction,
  ): Promise<GetRatingResponse> {
	return this.ratingService.getRating(productId);
  }
}
