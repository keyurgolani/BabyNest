import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

import { CaregiverRole } from './baby-response.dto';

/**
 * DTO for updating a caregiver's role
 */
export class UpdateCaregiverRoleDto {
  @ApiProperty({
    description: 'New role for the caregiver',
    enum: CaregiverRole,
    example: CaregiverRole.PRIMARY,
  })
  @IsEnum(CaregiverRole, { message: 'Role must be either primary or secondary' })
  role: CaregiverRole;
}
