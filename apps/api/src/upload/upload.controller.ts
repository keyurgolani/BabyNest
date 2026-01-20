import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Res,
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
} from '@nestjs/swagger';
import { Response } from 'express';

import { UploadResponseDto } from './dto/upload-response.dto';
import { UploadService, UploadResult } from './upload.service';
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

@ApiTags('Uploads')
@Controller('uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ 
    summary: 'Upload an image file',
    description: 'Upload baby photos and memories. Supports files up to 200MB. Use the returned URL in photoUrl fields when creating memories, milestones, or updating baby profiles.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file up to 200MB (JPEG, PNG, GIF, WebP, HEIC, HEIF)',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully. Returns URL and thumbnailUrl to use in other API calls.',
    type: UploadResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid file type or file exceeds 200MB limit' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadFile(
    @UploadedFile() file: MulterFile,
  ): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.uploadService.processUpload(file);
  }

  @Get(':filename')
  @ApiOperation({ summary: 'Get an uploaded file' })
  @ApiResponse({ status: 200, description: 'File content' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async getFile(
    @Param('filename') filename: string,
    @Res() res: Response,
  ): Promise<void> {
    const filePath = this.uploadService.getFilePath(filename);
    res.sendFile(filePath);
  }

  @Delete(':filename')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an uploaded file' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async deleteFile(
    @Param('filename') filename: string,
  ): Promise<{ success: boolean }> {
    const success = this.uploadService.deleteFile(filename);
    return { success };
  }
}
