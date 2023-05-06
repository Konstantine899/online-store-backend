import { IsOptional } from 'class-validator';

// export enum Sort {
//   DESC = 'DESC',
//   ASC = 'ASC',
// }
export class SortQueryDto {
  @IsOptional()
  readonly sort: string;
}
