import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

export function VerifyUserEmailSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({ summary: 'Отметить email как верифицированный', description: 'Только ADMIN' }),
        ApiBearerAuth('JWT-auth'),
        ApiResponse({ status: HttpStatus.OK, description: 'Email помечен как верифицированный' }),
    );
}

export function VerifyUserPhoneSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({ summary: 'Отметить телефон как верифицированный', description: 'Только ADMIN' }),
        ApiBearerAuth('JWT-auth'),
        ApiResponse({ status: HttpStatus.OK, description: 'Телефон помечен как верифицированный' }),
    );
}


