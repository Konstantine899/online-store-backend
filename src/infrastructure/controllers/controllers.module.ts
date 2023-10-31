import { Module } from '@nestjs/common';
import { AuthController } from './auth/auth.controller';
import { ServicesModule } from '../services/services.module';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '../../modules/user/user.module';
import { BrandController } from './brand/brand.controller';
import { CartController } from './cart/cart.controller';

@Module({
    imports: [ServicesModule, JwtModule, UserModule],
    controllers: [AuthController, BrandController, CartController],
})
export class ControllersModule {}
