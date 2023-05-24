import { ApiProperty } from '@nestjs/swagger';
import { MetaData } from './paginate/meta-data';
import { Rows } from './paginate/rows';

export class GetListProductByBrandIdResponse {
  @ApiProperty()
  metaData: MetaData;

  @ApiProperty({ type: () => [Rows] })
  rows: Rows[];
}
