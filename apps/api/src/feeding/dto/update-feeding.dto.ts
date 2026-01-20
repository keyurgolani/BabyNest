import { PartialType } from '@nestjs/swagger';

import { CreateFeedingDto } from './create-feeding.dto';

/**
 * DTO for updating a feeding entry
 * All fields are optional - only provided fields will be updated
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */
export class UpdateFeedingDto extends PartialType(CreateFeedingDto) {}
