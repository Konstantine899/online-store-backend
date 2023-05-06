import { IsOptional } from 'class-validator';

export class SearchQueryDto {
  @IsOptional()
  readonly search: string;
}
