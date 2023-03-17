import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TokenService } from './token.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { RefreshTokenModel } from './refresh-token.model';

@Module({
  imports: [
	JwtModule.register({
		secret: process.env.JWT_PRIVATE_KEY || 'SECRET',
		signOptions: { expiresIn: '24h' }, // время жизни токена
	}),
	SequelizeModule.forFeature([RefreshTokenModel]),
  ],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}
