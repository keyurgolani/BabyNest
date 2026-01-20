import { PartialType } from '@nestjs/swagger';

import { CreateReminderDto } from './create-reminder.dto';

/**
 * DTO for updating a reminder
 * All fields are optional
 */
export class UpdateReminderDto extends PartialType(CreateReminderDto) {}
