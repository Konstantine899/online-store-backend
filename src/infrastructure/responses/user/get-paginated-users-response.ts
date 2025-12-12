import { ApiProperty } from '@nestjs/swagger';
import { GetListUsersResponse } from './get-list-users.response';
import { MetaData } from '@app/infrastructure/paginate';

export class GetPaginatedUsersResponse {
    @ApiProperty({
        type: [GetListUsersResponse],
        description: 'Список пользователей',
    })
    declare data: GetListUsersResponse[];

    @ApiProperty({
        type: MetaData,
        description: 'Метаданные пагинации',
    })
    declare meta: MetaData;
}
