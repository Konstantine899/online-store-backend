import { IsOptional } from 'class-validator';

export enum Sort {
  DESC = 'DESC',
  ASC = 'ASC',
}
export class QueryProductDto {
  @IsOptional()
  readonly search: string;

  @IsOptional()
  readonly sort: string;
}
