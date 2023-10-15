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
import { CreateRatingDocumentation } from './decorators/create-rating.documentation';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { UserRequest } from './requests/user.request';
import { GetRatingDocumentation } from './decorators/get-rating.documentation';
import { CreateRatingResponse } from './responses/create-rating.response';
import { GetRatingResponse } from './responses/get-rating.response';

@ApiTags('Рейтинг')
@Controller('rating')
export class RatingController {
    constructor(private readonly ratingService: RatingService) {}

    @CreateRatingDocumentation()
    @HttpCode(201)
    @UseGuards(JwtGuard)
    @Post('/product/:productId([0-9]+)/rating/:rating([1-5])')
    public async createRating(
        @Req() request: Request,
        @Param('productId', ParseIntPipe) productId: number,
        @Param('rating', ParseIntPipe) rating: number,
    ): Promise<CreateRatingResponse> {
        const { id } = request.user as UserRequest;
        return this.ratingService.createRating(id, productId, rating);
    }

    @GetRatingDocumentation()
    @HttpCode(200)
    @Get('/product/:productId([0-9]+)')
    public async getRating(
        @Param('productId', ParseIntPipe) productId: number,
    ): Promise<GetRatingResponse> {
        return this.ratingService.getRating(productId);
    }
}
