
export enum PortalStatus {
  IMPORTED = 'IMPORTED',
  PENDING = 'PENDING',
  REGISTERED = 'REGISTERED'
}

export enum BenefitType {
  SSF = 'SSF',
  AIA = 'AIA'
}

export enum RegistrationType {
  REGISTER_IN = 'REGISTER_IN',
  REGISTER_OUT = 'REGISTER_OUT'
}

export interface Worksite {
  id: string;
  name: string;
  icon: string;
  color: string;
  syncSSF: boolean;
  syncAIA: boolean;
  ssfRegistrationSchedule: '1st' | '16th' | 'custom' | 'today';
  ssfCustomDate: string | null; // ISO date string e.g. "2026-04-15"
  ssfExitSchedule: '1st' | '16th' | 'custom' | 'today';
  ssfExitCustomDate: string | null;
  aiaRegistrationSchedule: '1st' | '16th' | 'custom' | 'today';
  aiaCustomDate: string | null; // ISO date string e.g. "2026-04-15"
  aiaExitSchedule: '1st' | '16th' | 'custom' | 'today';
  aiaExitCustomDate: string | null;
}

export interface Employee {
  id: string;
  idCard: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  bankName?: string;
  bankAccount?: string;
  employmentDate: string;
  plan?: string;
  employeeNo?: string;
  department?: string;
  salary?: number;
  worksiteId: string;
  benefitType: boolean;
  hasAia: boolean;
  registrationType: RegistrationType;
  status: PortalStatus;
  effectiveDate?: string;
  resignReason?: string;
  createdAt: string;
}