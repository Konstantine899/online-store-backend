import { ApiProperty } from '@nestjs/swagger';
import { IAuthResponse } from '../../../domain/responses/i-auth-response';

export class RegistrationResponse implements IAuthResponse {
    @ApiProperty({ example: 'Bearer', description: 'Тип токена' })
    type: string;

    @ApiProperty({
        example:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NTMsInJvbGVzIjpbXSwiaWF0IjoxNjg1MjgwMjk4LCJleHAiOjE2ODUzNjY2OTgsInN1YiI6IjUzIn0.Xb9fbsbj54CKNJ7WlR5Elc9n01urDXz5ATdNP5BAQBM',
        description: 'Access token',
    })
    accessToken: string;

    @ApiProperty({
        example:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2ODUyODAyOTgsImV4cCI6MTY4NTM2NjY5OCwic3ViIjoiNTMiLCJqdGkiOiI5OCJ9.pj1YNcfUgv_pBdX5WB0seI6a_IrzKVujtiHCb4VdIOs',
        description: 'Refresh token',
    })
    refreshToken?: string;
}
