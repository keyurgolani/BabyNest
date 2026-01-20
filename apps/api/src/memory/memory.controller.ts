import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
  ApiParam,
} from '@nestjs/swagger';

import {
  CreateMemoryDto,
  UpdateMemoryDto,
  MemoryResponseDto,
  MemoryListResponseDto,
  MemoryQueryDto,
  MemoryTimelineQueryDto,
  MemoryTimelineResponseDto,
} from './dto';
import { MemoryService } from './memory.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CaregiverResponseDto } from '../auth/dto/auth-response.dto';
import { CombinedAuthGuard } from '../auth/guards/combined-auth.guard';

/**
 * Memory Controller
 * Handles CRUD operations for memory/photo journal entries
 */
@ApiTags('memories')
@Controller('babies/:babyId/memories')
@ApiBearerAuth()
@ApiSecurity('api-key')
@UseGuards(CombinedAuthGuard)
export class MemoryController {
  constructor(private readonly memoryService: MemoryService) {}

  /**
   * Create a new memory entry
   * POST /babies/:babyId/memories
   */
  @Post()
  @ApiOperation({
    summary: 'Create a memory entry',
    description: `Create a new memory/photo journal entry for a baby.
    
    Memory types:
    - **photo**: A general photo memory
    - **milestone**: A milestone moment captured in photo
    - **first**: A "first" moment (first smile, first steps, etc.)
    - **note**: A memory with a note/journal entry
    
    You can optionally link the memory to another entry (feeding, sleep, etc.) 
    to associate the photo with a specific tracked event.`,
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 201,
    description: 'Memory entry created successfully',
    type: MemoryResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Baby not found' })
  async create(
    @Param('babyId') babyId: string,
    @CurrentUser() user: CaregiverResponseDto,
    @Body() createMemoryDto: CreateMemoryDto,
  ): Promise<MemoryResponseDto> {
    return this.memoryService.create(babyId, user.id, createMemoryDto);
  }

  /**
   * List memory entries for a baby
   * GET /babies/:babyId/memories
   */
  @Get()
  @ApiOperation({
    summary: 'List memory entries',
    description: 'Get all memory entries for a baby with optional filtering, pagination, and sorting.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'List of memory entries',
    type: MemoryListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  async findAll(
    @Param('babyId') babyId: string,
    @CurrentUser() user: CaregiverResponseDto,
    @Query() query: MemoryQueryDto,
  ): Promise<MemoryListResponseDto> {
    return this.memoryService.findAll(babyId, user.id, query);
  }

  /**
   * Get memories grouped by date for timeline view
   * GET /babies/:babyId/memories/timeline
   */
  @Get('timeline')
  @ApiOperation({
    summary: 'Get memory timeline',
    description: `Get memories grouped by date for a beautiful timeline view.
    
    Returns memories organized by date, perfect for displaying a visual timeline 
    or gallery view. Supports cursor-based pagination for infinite scrolling.
    
    Use the \`cursor\` parameter with the \`nextCursor\` value from the response 
    to load more date groups.`,
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Memory timeline grouped by date',
    type: MemoryTimelineResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  async getTimeline(
    @Param('babyId') babyId: string,
    @CurrentUser() user: CaregiverResponseDto,
    @Query() query: MemoryTimelineQueryDto,
  ): Promise<MemoryTimelineResponseDto> {
    return this.memoryService.getTimeline(babyId, user.id, query);
  }

  /**
   * Get a single memory entry
   * GET /babies/:babyId/memories/:id
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get memory entry details',
    description: 'Get details of a specific memory entry.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'id',
    description: 'Memory entry ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Memory entry details',
    type: MemoryResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Memory entry not found' })
  async findOne(
    @Param('babyId') babyId: string,
    @Param('id') id: string,
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<MemoryResponseDto> {
    return this.memoryService.findOne(babyId, id, user.id);
  }

  /**
   * Update a memory entry
   * PATCH /babies/:babyId/memories/:id
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update memory entry',
    description: `Update a memory entry. Only provided fields will be updated.
    
    Common use cases:
    - Update title or note
    - Change photo URL
    - Link to a different entry
    - Update when the photo was taken`,
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'id',
    description: 'Memory entry ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Memory entry updated successfully',
    type: MemoryResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Memory entry not found' })
  async update(
    @Param('babyId') babyId: string,
    @Param('id') id: string,
    @CurrentUser() user: CaregiverResponseDto,
    @Body() updateMemoryDto: UpdateMemoryDto,
  ): Promise<MemoryResponseDto> {
    return this.memoryService.update(babyId, id, user.id, updateMemoryDto);
  }

  /**
   * Delete a memory entry (soft delete)
   * DELETE /babies/:babyId/memories/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete memory entry',
    description: 'Soft delete a memory entry. The entry can be recovered if needed.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'id',
    description: 'Memory entry ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({ status: 204, description: 'Memory entry deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Memory entry not found' })
  async remove(
    @Param('babyId') babyId: string,
    @Param('id') id: string,
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<void> {
    return this.memoryService.remove(babyId, id, user.id);
  }
}
