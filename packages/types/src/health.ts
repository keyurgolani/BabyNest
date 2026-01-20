/**
 * Health Tracking Types
 */

import { PaginationMetaDto } from './api';

// Medication types
export type MedicationFrequency = 
  | 'once'
  | 'twice_daily'
  | 'three_times_daily'
  | 'four_times_daily'
  | 'every_4_hours'
  | 'every_6_hours'
  | 'every_8_hours'
  | 'every_12_hours'
  | 'daily'
  | 'weekly'
  | 'as_needed';

export interface MedicationResponse {
  id: string;
  babyId: string;
  caregiverId: string;
  name: string;
  dosage: string;
  unit: string;
  frequency: MedicationFrequency;
  timestamp: string;
  nextDueAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MedicationListResponse {
  data: MedicationResponse[];
  meta: PaginationMetaDto;
}

export interface CreateMedicationDto {
  name: string;
  dosage: string;
  unit: string;
  frequency: MedicationFrequency;
  timestamp?: string;
  nextDueAt?: string;
  notes?: string;
}

// Vaccination types
export interface VaccinationResponse {
  id: string;
  babyId: string;
  caregiverId: string;
  vaccineName: string;
  timestamp: string;
  provider: string | null;
  location: string | null;
  nextDueAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VaccinationListResponse {
  data: VaccinationResponse[];
  meta: PaginationMetaDto;
}

export interface CreateVaccinationDto {
  vaccineName: string;
  timestamp?: string;
  provider?: string;
  location?: string;
  nextDueAt?: string;
  notes?: string;
}

// Vaccination Schedule types - matches API response
export interface ScheduledVaccination {
  id: string;
  babyId: string;
  caregiverId: string;
  vaccineName: string;
  timestamp: string;
  provider?: string;
  location?: string;
  nextDueAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
  isDeleted: boolean;
  status: 'completed' | 'upcoming' | 'overdue';
}

export interface VaccinationScheduleResponse {
  completed: ScheduledVaccination[];
  upcoming: ScheduledVaccination[];
  overdue: ScheduledVaccination[];
  summary: {
    completed: number;
    upcoming: number;
    overdue: number;
  };
}

// Symptom types
export type SymptomSeverity = 'mild' | 'moderate' | 'severe';

export interface SymptomResponse {
  id: string;
  babyId: string;
  caregiverId: string;
  symptomType: string;
  severity: SymptomSeverity;
  timestamp: string;
  temperature: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SymptomListResponse {
  data: SymptomResponse[];
  meta: PaginationMetaDto;
}

export interface CreateSymptomDto {
  symptomType: string;
  severity: SymptomSeverity;
  timestamp?: string;
  temperature?: number;
  notes?: string;
}

// Doctor Visit types
export type VisitType = 'checkup' | 'sick' | 'emergency' | 'specialist';

export interface DoctorVisitResponse {
  id: string;
  babyId: string;
  caregiverId: string;
  visitType: VisitType;
  provider: string;
  timestamp: string;
  location: string | null;
  diagnosis: string | null;
  followUpDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorVisitListResponse {
  data: DoctorVisitResponse[];
  meta: PaginationMetaDto;
}

export interface CreateDoctorVisitDto {
  visitType: VisitType;
  provider: string;
  timestamp?: string;
  location?: string;
  diagnosis?: string;
  followUpDate?: string;
  notes?: string;
}
