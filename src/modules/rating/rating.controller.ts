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
import { CreateRatingSwaggerDecorator } from './decorators/create-rating-swagger-decorator';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { UserRequest } from './requests/user.request';
import { GetRatingSwaggerDecorator } from './decorators/get-rating-swagger-decorator';
import { CreateRatingResponse } from './responses/create-rating.response';
import { GetRatingResponse } from './responses/get-rating.response';
import { AuthGuard } from '../../infrastructure/common/guards/auth.guard';

interface IRatingController {
    createRating(
        request: Request,
        productId: number,
        rating: number,
    ): Promise<CreateRatingResponse>;

    getRating(productId: number): Promise<GetRatingResponse>;
}

@ApiTags('Рейтинг')
@Controller('rating')
export class RatingController implements IRatingController {
    constructor(private readonly ratingService: RatingService) {}

    @CreateRatingSwaggerDecorator()
    @HttpCode(201)
    @UseGuards(AuthGuard)
    @Post('/product/:productId([0-9]+)/rating/:rating([1-5])')
    public async createRating(
        @Req() request: Request,
        @Param('productId', ParseIntPipe) productId: number,
        @Param('rating', ParseIntPipe) rating: number,
    ): Promise<CreateRatingResponse> {
        const { id } = request.user as UserRequest;
        return this.ratingService.createRating(id, productId, rating);
    }

    @GetRatingSwaggerDecorator()
    @HttpCode(200)
    @Get('/product/:productId([0-9]+)')
    public async getRating(
        @Param('productId', ParseIntPipe) productId: number,
    ): Promise<GetRatingResponse> {
        return this.ratingService.getRating(productId);
    }
}
