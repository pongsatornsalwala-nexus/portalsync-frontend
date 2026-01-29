
export enum PortalStatus {
  ENTRY = 'ENTRY',
  PENDING = 'PENDING',
  REVIEWING = 'REVIEWING',
  REPORTED = 'REPORTED',
  VERIFIED = 'VERIFIED'
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
  hireLimit: number;
  resignLimit: number;
  syncSSF: boolean;
  syncAIA: boolean;
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