import { ApiProperty } from '@nestjs/swagger';
import { MetaData } from './paginate/meta-data';
import { Rows } from './paginate/rows';

export class GetListProductByCategoryIdResponse {
  @ApiProperty()
  metaData: MetaData;

  @ApiProperty({ type: () => [Rows] })
  rows: Rows[];
}
