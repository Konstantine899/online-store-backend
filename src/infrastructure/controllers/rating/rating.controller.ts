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
import { RatingService } from '@app/infrastructure/services';
import {
    CreateRatingSwaggerDecorator,
    GetRatingSwaggerDecorator,
} from '@app/infrastructure/common/decorators';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { UserRequest } from '@app/infrastructure/requests';
import {
    RatingResponse,
    GetRatingResponse,
} from '@app/infrastructure/responses';
import { AuthGuard } from '@app/infrastructure/common/guards';
import { IRatingController } from '@app/domain/controllers';

@ApiTags('Рейтинг')
@Controller('rating')
export class RatingController implements IRatingController {
    constructor(private readonly ratingService: RatingService) {}

    @CreateRatingSwaggerDecorator()
    @HttpCode(201)
    @UseGuards(AuthGuard)
    @Post('/product/:productId/rating/:rating')
    public async createRating(
        @Req() request: Request,
        @Param('productId', ParseIntPipe) productId: number,
        @Param('rating', ParseIntPipe) rating: number,
    ): Promise<RatingResponse> {
        const { id } = request.user as UserRequest;
        return this.ratingService.createRating(id, productId, rating);
    }

    @GetRatingSwaggerDecorator()
    @HttpCode(200)
    @Get('/product/:productId')
    public async getRating(
        @Param('productId', ParseIntPipe) productId: number,
    ): Promise<GetRatingResponse> {
        return this.ratingService.getRating(productId);
    }
}
