import { readFile } from 'fs/promises';

import { Injectable, Logger } from '@nestjs/common';

import {
  PhotoAnalysisResponseDto,
  ExtractedFeedingDto,
  ExtractedSleepDto,
  ExtractedDiaperDto,
  ExtractedMedicationDto,
  ExtractedSymptomDto,
  ExtractedActivityDto,
  ConfirmImportDto,
  ImportResultDto,
} from './dto';
import {
  PHOTO_IMPORT_SYSTEM_PROMPT,
  PHOTO_EXTRACTION_PROMPT,
  fillPhotoPromptTemplate,
} from './photo-import.prompts';
import { ActivityService } from '../activity/activity.service';
import { ActivityType } from '../activity/dto/create-activity.dto';
import { AiProviderService } from '../ai-provider/ai-provider.service';
import { VisionMessage } from '../ai-provider/types';
import { BabyHealthService } from '../baby-health/baby-health.service';
import { SymptomSeverity } from '../baby-health/dto/symptom/create-symptom.dto';
import { MedicationFrequency } from '../baby-health/utils/medication-due-time.util';
import { DiaperService } from '../diaper/diaper.service';
import { DiaperType } from '../diaper/dto/create-diaper.dto';
import { FeedingType, BottleType } from '../feeding/dto/create-feeding.dto';
import { FeedingService } from '../feeding/feeding.service';
import { SleepType, SleepQuality } from '../sleep/dto/create-sleep.dto';
import { SleepService } from '../sleep/sleep.service';

// Extended timeout for vision model processing (50 minutes for CPU-based inference)
const VISION_TIMEOUT = 3000000;

@Injectable()
export class PhotoImportService {
  private readonly logger = new Logger(PhotoImportService.name);

  constructor(
    private readonly aiProviderService: AiProviderService,
    private readonly feedingService: FeedingService,
    private readonly sleepService: SleepService,
    private readonly diaperService: DiaperService,
    private readonly babyHealthService: BabyHealthService,
    private readonly activityService: ActivityService,
  ) {}

  async analyzePhoto(imagePath: string, caregiverId?: string): Promise<PhotoAnalysisResponseDto> {
    this.logger.log(`Analyzing photo: ${imagePath}`);

    const isAvailable = await this.aiProviderService.checkHealth();
    if (!isAvailable) {
      return {
        success: false,
        error: 'AI service is not available. Please try again later.',
        feedings: [],
        sleepEntries: [],
        diaperEntries: [],
        medications: [],
        symptoms: [],
        activities: [],
      };
    }

    try {
      const imageBuffer = await readFile(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const currentDate = new Date().toISOString().split('T')[0] ?? new Date().toISOString().substring(0, 10);
      const userPrompt = fillPhotoPromptTemplate(PHOTO_EXTRACTION_PROMPT, { currentDate });
      const response = await this.callVisionModel(base64Image, userPrompt, caregiverId);

      if (!response.success) {
        return {
          success: false,
          error: response.error || 'Failed to analyze image',
          feedings: [],
          sleepEntries: [],
          diaperEntries: [],
          medications: [],
          symptoms: [],
          activities: [],
        };
      }

      const parsed = this.parseExtractionResponse(response.response || '');
      const allConfidences = [
        ...parsed.feedings.map(f => f.confidence || 0),
        ...parsed.sleepEntries.map(s => s.confidence || 0),
        ...parsed.diaperEntries.map(d => d.confidence || 0),
        ...parsed.medications.map(m => m.confidence || 0),
        ...parsed.symptoms.map(s => s.confidence || 0),
        ...parsed.activities.map(a => a.confidence || 0),
      ];
      const overallConfidence = allConfidences.length > 0
        ? allConfidences.reduce((a, b) => a + b, 0) / allConfidences.length
        : 0;

      return {
        success: true,
        rawText: parsed.rawText,
        feedings: parsed.feedings,
        sleepEntries: parsed.sleepEntries,
        diaperEntries: parsed.diaperEntries,
        medications: parsed.medications,
        symptoms: parsed.symptoms,
        activities: parsed.activities,
        overallConfidence,
        warnings: parsed.warnings,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Photo analysis failed: ${message}`);
      return {
        success: false,
        error: `Failed to analyze photo: ${message}`,
        feedings: [],
        sleepEntries: [],
        diaperEntries: [],
        medications: [],
        symptoms: [],
        activities: [],
      };
    }
  }

  private async callVisionModel(
    base64Image: string,
    prompt: string,
    caregiverId?: string,
  ): Promise<{ success: boolean; response?: string; error?: string }> {
    try {
      // Build vision message with image
      const messages: VisionMessage[] = [
        {
          role: 'system',
          content: PHOTO_IMPORT_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${base64Image}` },
            },
          ],
        },
      ];

      const result = await this.aiProviderService.vision(messages, {
        timeout: VISION_TIMEOUT,
        temperature: 0.1,
        maxTokens: 4096,
      }, caregiverId);

      return {
        success: result.success,
        response: result.response,
        error: result.error,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  private parseExtractionResponse(response: string): {
    rawText?: string;
    feedings: ExtractedFeedingDto[];
    sleepEntries: ExtractedSleepDto[];
    diaperEntries: ExtractedDiaperDto[];
    medications: ExtractedMedicationDto[];
    symptoms: ExtractedSymptomDto[];
    activities: ExtractedActivityDto[];
    warnings?: string[];
  } {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        this.logger.warn('No JSON found in vision model response');
        return { feedings: [], sleepEntries: [], diaperEntries: [], medications: [], symptoms: [], activities: [], warnings: ['Could not parse structured data'] };
      }

      const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
      return {
        rawText: typeof parsed['rawText'] === 'string' ? parsed['rawText'] : undefined,
        feedings: this.validateFeedings(parsed['feedings']),
        sleepEntries: this.validateSleepEntries(parsed['sleepEntries']),
        diaperEntries: this.validateDiaperEntries(parsed['diaperEntries']),
        medications: this.validateMedications(parsed['medications']),
        symptoms: this.validateSymptoms(parsed['symptoms']),
        activities: this.validateActivities(parsed['activities']),
        warnings: Array.isArray(parsed['warnings']) ? parsed['warnings'] as string[] : undefined,
      };
    } catch (error) {
      this.logger.error(`Failed to parse extraction response: ${error}`);
      return { feedings: [], sleepEntries: [], diaperEntries: [], medications: [], symptoms: [], activities: [], warnings: ['Failed to parse extracted data'] };
    }
  }

  private validateFeedings(data: unknown): ExtractedFeedingDto[] {
    if (!Array.isArray(data)) return [];
    const validTypes = ['breastfeeding', 'bottle', 'pumping', 'solid'];
    const result: ExtractedFeedingDto[] = [];
    
    for (const entry of data) {
      if (typeof entry !== 'object' || entry === null) continue;
      const obj = entry as Record<string, unknown>;
      const type = obj['type'];
      const timestamp = obj['timestamp'];
      
      if (typeof type !== 'string' || !validTypes.includes(type)) continue;
      if (typeof timestamp !== 'string' || !this.isValidDate(timestamp)) continue;
      
      result.push({
        type: type as 'breastfeeding' | 'bottle' | 'pumping' | 'solid',
        timestamp,
        leftDuration: typeof obj['leftDuration'] === 'number' ? obj['leftDuration'] : undefined,
        rightDuration: typeof obj['rightDuration'] === 'number' ? obj['rightDuration'] : undefined,
        amount: typeof obj['amount'] === 'number' ? obj['amount'] : undefined,
        bottleType: this.validateBottleType(obj['bottleType']),
        foodType: typeof obj['foodType'] === 'string' ? obj['foodType'] : undefined,
        notes: typeof obj['notes'] === 'string' ? obj['notes'] : undefined,
        confidence: typeof obj['confidence'] === 'number' ? obj['confidence'] : 0.5,
      });
    }
    return result;
  }

  private validateBottleType(value: unknown): 'formula' | 'breastMilk' | 'water' | undefined {
    if (typeof value !== 'string') return undefined;
    const validTypes = ['formula', 'breastMilk', 'water'];
    return validTypes.includes(value) ? value as 'formula' | 'breastMilk' | 'water' : undefined;
  }

  private validateSleepEntries(data: unknown): ExtractedSleepDto[] {
    if (!Array.isArray(data)) return [];
    const validTypes = ['nap', 'night'];
    const validQualities = ['good', 'fair', 'poor'];
    const result: ExtractedSleepDto[] = [];
    
    for (const entry of data) {
      if (typeof entry !== 'object' || entry === null) continue;
      const obj = entry as Record<string, unknown>;
      const sleepType = obj['sleepType'];
      const startTime = obj['startTime'];
      
      if (typeof sleepType !== 'string' || !validTypes.includes(sleepType)) continue;
      if (typeof startTime !== 'string' || !this.isValidDate(startTime)) continue;
      
      const endTime = obj['endTime'];
      const quality = obj['quality'];
      
      result.push({
        startTime,
        endTime: typeof endTime === 'string' && this.isValidDate(endTime) ? endTime : undefined,
        sleepType: sleepType as 'nap' | 'night',
        quality: typeof quality === 'string' && validQualities.includes(quality) ? quality as 'good' | 'fair' | 'poor' : undefined,
        notes: typeof obj['notes'] === 'string' ? obj['notes'] : undefined,
        confidence: typeof obj['confidence'] === 'number' ? obj['confidence'] : 0.5,
      });
    }
    return result;
  }

  private validateDiaperEntries(data: unknown): ExtractedDiaperDto[] {
    if (!Array.isArray(data)) return [];
    const validTypes = ['wet', 'dirty', 'mixed', 'dry'];
    const result: ExtractedDiaperDto[] = [];
    
    for (const entry of data) {
      if (typeof entry !== 'object' || entry === null) continue;
      const obj = entry as Record<string, unknown>;
      const type = obj['type'];
      const timestamp = obj['timestamp'];
      
      if (typeof type !== 'string' || !validTypes.includes(type)) continue;
      if (typeof timestamp !== 'string' || !this.isValidDate(timestamp)) continue;
      
      result.push({
        type: type as 'wet' | 'dirty' | 'mixed' | 'dry',
        timestamp,
        color: typeof obj['color'] === 'string' ? obj['color'] : undefined,
        consistency: typeof obj['consistency'] === 'string' ? obj['consistency'] : undefined,
        hasRash: typeof obj['hasRash'] === 'boolean' ? obj['hasRash'] : false,
        notes: typeof obj['notes'] === 'string' ? obj['notes'] : undefined,
        confidence: typeof obj['confidence'] === 'number' ? obj['confidence'] : 0.5,
      });
    }
    return result;
  }

  private validateMedications(data: unknown): ExtractedMedicationDto[] {
    if (!Array.isArray(data)) return [];
    const result: ExtractedMedicationDto[] = [];
    
    for (const entry of data) {
      if (typeof entry !== 'object' || entry === null) continue;
      const obj = entry as Record<string, unknown>;
      const timestamp = obj['timestamp'];
      const name = obj['name'];
      
      if (typeof timestamp !== 'string' || !this.isValidDate(timestamp)) continue;
      if (typeof name !== 'string' || name.trim() === '') continue;
      
      result.push({
        timestamp,
        name,
        dosage: typeof obj['dosage'] === 'number' ? obj['dosage'] : undefined,
        unit: typeof obj['unit'] === 'string' ? obj['unit'] : undefined,
        notes: typeof obj['notes'] === 'string' ? obj['notes'] : undefined,
        confidence: typeof obj['confidence'] === 'number' ? obj['confidence'] : 0.5,
      });
    }
    return result;
  }

  private validateSymptoms(data: unknown): ExtractedSymptomDto[] {
    if (!Array.isArray(data)) return [];
    const validSeverities = ['mild', 'moderate', 'severe'];
    const result: ExtractedSymptomDto[] = [];
    
    for (const entry of data) {
      if (typeof entry !== 'object' || entry === null) continue;
      const obj = entry as Record<string, unknown>;
      const timestamp = obj['timestamp'];
      const symptomType = obj['symptomType'];
      
      if (typeof timestamp !== 'string' || !this.isValidDate(timestamp)) continue;
      if (typeof symptomType !== 'string' || symptomType.trim() === '') continue;
      
      const severity = obj['severity'];
      
      result.push({
        timestamp,
        symptomType,
        severity: typeof severity === 'string' && validSeverities.includes(severity) ? severity as 'mild' | 'moderate' | 'severe' : undefined,
        temperature: typeof obj['temperature'] === 'number' ? obj['temperature'] : undefined,
        notes: typeof obj['notes'] === 'string' ? obj['notes'] : undefined,
        confidence: typeof obj['confidence'] === 'number' ? obj['confidence'] : 0.5,
      });
    }
    return result;
  }

  private validateActivities(data: unknown): ExtractedActivityDto[] {
    if (!Array.isArray(data)) return [];
    const result: ExtractedActivityDto[] = [];
    
    for (const entry of data) {
      if (typeof entry !== 'object' || entry === null) continue;
      const obj = entry as Record<string, unknown>;
      const timestamp = obj['timestamp'];
      const activityType = obj['activityType'];
      
      if (typeof timestamp !== 'string' || !this.isValidDate(timestamp)) continue;
      if (typeof activityType !== 'string' || activityType.trim() === '') continue;
      
      result.push({
        timestamp,
        activityType,
        duration: typeof obj['duration'] === 'number' ? obj['duration'] : undefined,
        notes: typeof obj['notes'] === 'string' ? obj['notes'] : undefined,
        confidence: typeof obj['confidence'] === 'number' ? obj['confidence'] : 0.5,
      });
    }
    return result;
  }

  private isValidDate(dateStr: string): boolean {
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  }

  async confirmImport(babyId: string, caregiverId: string, data: ConfirmImportDto): Promise<ImportResultDto> {
    const errors: string[] = [];
    let feedingsImported = 0;
    let sleepEntriesImported = 0;
    let diaperEntriesImported = 0;
    let medicationsImported = 0;
    let symptomsImported = 0;
    let activitiesImported = 0;

    for (const feeding of data.feedings) {
      try {
        await this.feedingService.create(babyId, caregiverId, {
          type: this.toFeedingType(feeding.type),
          timestamp: feeding.timestamp,
          leftDuration: feeding.leftDuration,
          rightDuration: feeding.rightDuration,
          amount: feeding.amount,
          bottleType: this.toBottleType(feeding.bottleType),
          foodType: feeding.foodType,
          notes: feeding.notes ? `[Imported from photo] ${feeding.notes}` : '[Imported from photo]',
        });
        feedingsImported++;
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to import feeding at ${feeding.timestamp}: ${msg}`);
      }
    }

    for (const sleep of data.sleepEntries) {
      try {
        await this.sleepService.create(babyId, caregiverId, {
          startTime: sleep.startTime,
          endTime: sleep.endTime,
          sleepType: this.toSleepType(sleep.sleepType),
          quality: this.toSleepQuality(sleep.quality),
          notes: sleep.notes ? `[Imported from photo] ${sleep.notes}` : '[Imported from photo]',
        });
        sleepEntriesImported++;
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to import sleep at ${sleep.startTime}: ${msg}`);
      }
    }

    for (const diaper of data.diaperEntries) {
      try {
        await this.diaperService.create(babyId, caregiverId, {
          type: this.toDiaperType(diaper.type),
          timestamp: diaper.timestamp,
          color: diaper.color,
          consistency: diaper.consistency,
          hasRash: diaper.hasRash,
          notes: diaper.notes ? `[Imported from photo] ${diaper.notes}` : '[Imported from photo]',
        });
        diaperEntriesImported++;
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to import diaper at ${diaper.timestamp}: ${msg}`);
      }
    }

    for (const medication of data.medications) {
      try {
        // Only import if we have required fields
        if (!medication.dosage || !medication.unit) {
          errors.push(`Skipped medication "${medication.name}" at ${medication.timestamp}: missing dosage or unit`);
          continue;
        }
        await this.babyHealthService.createMedication(babyId, caregiverId, {
          timestamp: medication.timestamp,
          name: medication.name,
          dosage: String(medication.dosage),
          unit: medication.unit,
          frequency: MedicationFrequency.AS_NEEDED, // Default frequency for imported medications
          notes: medication.notes ? `[Imported from photo] ${medication.notes}` : '[Imported from photo]',
        });
        medicationsImported++;
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to import medication at ${medication.timestamp}: ${msg}`);
      }
    }

    for (const symptom of data.symptoms) {
      try {
        // Map severity or default to mild
        const severityMap: Record<string, SymptomSeverity> = {
          'mild': SymptomSeverity.MILD,
          'moderate': SymptomSeverity.MODERATE,
          'severe': SymptomSeverity.SEVERE,
        };
        const severity: SymptomSeverity = (symptom.severity && severityMap[symptom.severity]) || SymptomSeverity.MILD;
        
        await this.babyHealthService.createSymptom(babyId, caregiverId, {
          timestamp: symptom.timestamp,
          symptomType: symptom.symptomType,
          severity,
          temperature: symptom.temperature,
          notes: symptom.notes ? `[Imported from photo] ${symptom.notes}` : '[Imported from photo]',
        });
        symptomsImported++;
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to import symptom at ${symptom.timestamp}: ${msg}`);
      }
    }

    for (const activity of data.activities) {
      try {
        // Map activity type to valid enum or skip
        const activityTypeMap: Record<string, ActivityType> = {
          'tummy_time': ActivityType.TUMMY_TIME,
          'tummytime': ActivityType.TUMMY_TIME,
          'tummy time': ActivityType.TUMMY_TIME,
          'bath': ActivityType.BATH,
          'outdoor': ActivityType.OUTDOOR,
          'outside': ActivityType.OUTDOOR,
          'play': ActivityType.PLAY,
          'playtime': ActivityType.PLAY,
          'play time': ActivityType.PLAY,
          'reading': ActivityType.PLAY,
          'other': ActivityType.PLAY,
        };
        
        const normalizedType = activity.activityType.toLowerCase().replace(/_/g, ' ').trim();
        const mappedType = activityTypeMap[normalizedType] || activityTypeMap[activity.activityType.toLowerCase()];
        
        if (!mappedType) {
          errors.push(`Skipped activity "${activity.activityType}" at ${activity.timestamp}: unknown activity type`);
          continue;
        }
        
        await this.activityService.create(babyId, caregiverId, {
          activityType: mappedType,
          startTime: activity.timestamp,
          duration: activity.duration ? Math.round(activity.duration / 60) : undefined, // Convert seconds to minutes
          notes: activity.notes ? `[Imported from photo] ${activity.notes}` : '[Imported from photo]',
        });
        activitiesImported++;
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to import activity at ${activity.timestamp}: ${msg}`);
      }
    }

    const totalImported = feedingsImported + sleepEntriesImported + diaperEntriesImported + medicationsImported + symptomsImported + activitiesImported;

    return {
      success: errors.length === 0 || totalImported > 0,
      feedingsImported,
      sleepEntriesImported,
      diaperEntriesImported,
      medicationsImported,
      symptomsImported,
      activitiesImported,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  private toFeedingType(type: string): FeedingType {
    const map: Record<string, FeedingType> = {
      'breastfeeding': FeedingType.BREASTFEEDING,
      'bottle': FeedingType.BOTTLE,
      'pumping': FeedingType.PUMPING,
      'solid': FeedingType.SOLID,
    };
    return map[type] || FeedingType.BOTTLE;
  }

  private toBottleType(type: string | undefined): BottleType | undefined {
    if (!type) return undefined;
    const map: Record<string, BottleType> = {
      'formula': BottleType.FORMULA,
      'breastMilk': BottleType.BREAST_MILK,
      'water': BottleType.WATER,
    };
    return map[type];
  }

  private toSleepType(type: string): SleepType {
    const map: Record<string, SleepType> = { 'nap': SleepType.NAP, 'night': SleepType.NIGHT };
    return map[type] || SleepType.NAP;
  }

  private toSleepQuality(quality: string | undefined): SleepQuality | undefined {
    if (!quality) return undefined;
    const map: Record<string, SleepQuality> = { 'good': SleepQuality.GOOD, 'fair': SleepQuality.FAIR, 'poor': SleepQuality.POOR };
    return map[quality];
  }

  private toDiaperType(type: string): DiaperType {
    const map: Record<string, DiaperType> = { 'wet': DiaperType.WET, 'dirty': DiaperType.DIRTY, 'mixed': DiaperType.MIXED, 'dry': DiaperType.DRY };
    return map[type] || DiaperType.WET;
  }
}
