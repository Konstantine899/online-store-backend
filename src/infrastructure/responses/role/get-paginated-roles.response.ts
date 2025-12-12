import { ApiProperty } from '@nestjs/swagger';
import { MetaData } from '@app/infrastructure/paginate';
import { GetListRoleResponse } from './get-list-role.response';

/**
 * Response для списка ролей с пагинацией
 * Контракт: { data: T[], meta: MetaData }
 */
export class GetPaginatedRolesResponse {
    @ApiProperty({
        type: [GetListRoleResponse],
        description: 'Список ролей',
    })
    declare data: GetListRoleResponse[];

    @ApiProperty({
        type: MetaData,
        description: 'Метаданные пагинации',
    })
    declare meta: MetaData;
}

