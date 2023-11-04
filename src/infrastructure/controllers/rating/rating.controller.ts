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
import { RatingService } from '../../services/rating/rating.service';
import {
    CreateRatingSwaggerDecorator,
    GetRatingSwaggerDecorator,
} from '@app/infrastructure/common/decorators';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { UserRequest } from '../../requests/rating/user.request';
import { CreateRatingResponse } from '../../responses/rating/create-rating.response';
import { GetRatingResponse } from '../../responses/rating/get-rating.response';
import { AuthGuard } from '@app/infrastructure/common/guards';
import { IRatingController } from '@app/domain/controllers';

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
