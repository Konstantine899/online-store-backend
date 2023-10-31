import { Module } from '@nestjs/common';
import { UserModule } from '../../modules/user/user.module';
import { TokenModule } from '../../modules/token/token.module';
import { AuthService } from './auth/auth.service';
import { JwtModule } from '@nestjs/jwt';
import { BrandService } from './brand/brand.service';
import { RepositoriesModule } from '../repositories/repositories.module';

@Module({
    imports: [RepositoriesModule, UserModule, TokenModule, JwtModule],
    providers: [AuthService, BrandService],
    exports: [AuthService, BrandService],
})
export class ServicesModule {}
