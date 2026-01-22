import {
  Controller,
  Post,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';

import {
  PhotoAnalysisResponseDto,
  ConfirmImportDto,
  ImportResultDto,
} from './dto';
import { PhotoImportService } from './photo-import.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

interface JwtPayload {
  sub: string;
  email: string;
}

@ApiTags('Photo Import')
@Controller('babies/:babyId/photo-import')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PhotoImportController {
  constructor(private readonly photoImportService: PhotoImportService) {}

  @Post('analyze')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'babyId', description: 'Baby ID' })
  @ApiOperation({
    summary: 'Analyze a photo of handwritten logs',
    description: `Upload a photo of handwritten baby tracking logs (feeding, sleep, diaper changes).
    The system will use OCR to extract text and AI to parse it into structured entries.
    Review the extracted entries before confirming the import.
    
    Supported formats: JPEG, PNG, GIF, WebP
    Maximum file size: 50MB`,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file containing handwritten logs',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Photo analyzed successfully. Returns extracted entries for review.',
    type: PhotoAnalysisResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid file type or no file provided' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async analyzePhoto(
    @UploadedFile() file: MulterFile,
    @CurrentUser() user: JwtPayload,
  ): Promise<PhotoAnalysisResponseDto> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!file.mimetype.match(/^image\/(jpeg|png|gif|webp)$/)) {
      throw new BadRequestException('Only image files (JPEG, PNG, GIF, WebP) are supported');
    }

    return this.photoImportService.analyzePhoto(file.path, user.sub);
  }

  @Post('confirm')
  @ApiParam({ name: 'babyId', description: 'Baby ID' })
  @ApiOperation({
    summary: 'Confirm and import extracted entries',
    description: `Import the extracted and reviewed entries into the database.
    Users can modify the extracted data before confirming the import.
    All entries will be associated with the specified baby.`,
  })
  @ApiResponse({
    status: 201,
    description: 'Entries imported successfully',
    type: ImportResultDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid entries or import failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'No access to the specified baby' })
  async confirmImport(
    @Param('babyId') babyId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: ConfirmImportDto,
  ): Promise<ImportResultDto> {
    return this.photoImportService.confirmImport(babyId, user.sub, dto);
  }
}
