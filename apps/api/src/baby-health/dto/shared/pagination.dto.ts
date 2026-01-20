import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsInt, Min, Max, IsEnum, IsOptional } from 'class-validator';

/**
 * Sort order enum
 */
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * Base pagination query DTO
 */
export class BasePaginationQueryDto {
  @ApiProperty({
    description: 'Page number (1-indexed)',
    example: 1,
    minimum: 1,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SortOrder,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;
}

/**
 * Pagination metadata DTO
 */
export class PaginationMetaDto {
  @ApiProperty({
    description: 'Total number of items',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number (1-indexed)',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
  })
  pageSize: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 5,
  })
  totalPages: number;
}
