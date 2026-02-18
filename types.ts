// FIX: Add UserRole, AssetCategory, CorrectiveCategory and other enums/types
export type UserRole = 'admin' | 'gestor' | 'manutencista' | 'operador';

export interface User {
    username: string;
    name: string;
    role: UserRole;
}

export enum MaintenanceStatus {
    Scheduled = 'Programado',
    Executed = 'Executado',
    Delayed = 'Atrasado',
    InField = 'Em Campo',
    WaitingParts = 'Aguardando Peças',
    Deactivated = 'Desativado',
    None = 'Nenhum',
}

export enum MaintenanceType {
    Preventive = 'Preventiva',
    Corrective = 'Corretiva',
    Predictive = 'Preditiva',
    RevisaoPeriodica = 'Revisão Periódica',
    Predial = 'Predial',
    Melhoria = 'Melhoria',
    Overhaul = 'Overhaul',
}

export enum AssetCategory {
    Industrial = 'Industrial',
    Facility = 'Predial/Utilitário',
}

export enum CorrectiveCategory {
    Mechanical = 'Mecânica',
    Electrical = 'Elétrica',
    Hydraulic = 'Hidráulica',
    Pneumatic = 'Pneumática',
    Software = 'Software',
    Operational = 'Operacional',
    External = 'Causa Externa',
    Building = 'Predial',
}

export interface TaskDetail {
  action: string;
  checked?: boolean;
  materials?: string;
}

export interface ManHourEntry {
    maintainer: string;
    hours: number;
}

export interface PurchaseRequest {
    id: string;
    itemDescription: string;
    quantity: number;
    requester: string;
    requisitionDate: string;
    status: 'Pendente' | 'Comprado' | 'Entregue';
    purchaseOrderNumber?: string;
    arrivalDate?: string;
}

export interface WorkOrder {
    id: string;
    equipmentId: string;
    type: MaintenanceType;
    status: MaintenanceStatus;
    scheduledDate: string;
    startDateExecution?: string; // Added field
    endDate?: string; 
    description: string;
    checklist?: TaskDetail[];
    observations?: string;
    planId?: string;

    // Added properties
    requester?: string;
    rootCause?: string;
    correctiveCategory?: CorrectiveCategory;
    machineStopped?: boolean;
    isApproved?: boolean; // Added field
    manHours?: ManHourEntry[];
    materialsUsed?: { partId: string; quantity: number }[];
    purchaseRequests?: PurchaseRequest[];
    miscNotes?: string;
    reportPdfBase64?: string;
    isPrepared?: boolean;
    equipments?: Equipment | null;
    deleted_at?: string;
    failureDate?: string;
    externalCompany?: string;
    imageBase64?: string;
}

export interface Equipment {
  id: string;
  name: string;
  typeId: string; // Foreign key to EquipmentType

  // Added properties
  location?: string;
  category?: AssetCategory;
  status?: 'Ativo' | 'Inativo' | 'Desativado'; // Updated type
  model?: string; 
  yearOfManufacture?: string;
  isCritical?: boolean;
  preservationNotes?: string;
  customerSpecificRequirements?: string;
  customPlanId?: string;
  manufacturer?: string;
  schedule?: any; // To allow spread
  deleted_at?: string;
}

export interface EquipmentType {
    id: string;
    description: string;
    active?: boolean; // New property for soft deactivation
}

export interface MaintenancePlan {
    id: string;
    description: string;
    equipmentTypeId: string;
    frequency: number; // in months
    tasks: TaskDetail[];
    
    // Added properties
    targetEquipmentIds?: string[];
    maintenanceType?: MaintenanceType;
    startMonth?: string;
    deleted_at?: string;
}

export type Page = 
    | 'work_orders' 
    | 'planning' 
    | 'home' 
    | 'equipment' 
    | 'inventory' 
    | 'reports' 
    | 'history' 
    | 'quality' 
    | 'information'
    | 'dashboard'
    | 'settings'
    | 'documentation'
    | 'purchasing'
    | 'inventory_logs'
    | 'equipment_types'
    | 'schedule'
    | 'activity_log';

// Added missing types
export interface StatusConfig {
  id: string;
  label: MaintenanceStatus;
  color: string;
  symbol: string;
}

export interface SparePart {
    id: string; // SKU
    name: string;
    location: string;
    unit: string; // e.g., 'PÇ', 'L', 'M'
    cost: number;
    minStock: number;
    currentStock: number;
}

export interface MaintenanceTask {
    id: string;
    year: number;
    month: string;
    status: MaintenanceStatus;
    type: MaintenanceType | null;
    description: string;
    osNumber?: string;
    startDate?: string;
    endDate?: string;
    maintainer?: { name: string; isExternal: boolean };
    manHours?: number;
    details?: TaskDetail[];
    isPrepared?: boolean;
    requester?: string;
    correctiveCategory?: CorrectiveCategory;
}

export interface FlatTask {
    equipment: Equipment;
    task: MaintenanceTask;
    year: number;
    monthIndex: number;
    key: string;
}

export interface ReliabilityMetrics {
    mtbf: number | null;
    mttr: number;
    availability: number;
    totalFailures: number;
    totalCorrectiveHours: number;
}

export interface StockMovement {
    id: string;
    partId: string;
    partName: string;
    type: 'Entrada' | 'Saída' | 'Ajuste';
    quantity: number;
    reason: string; // e.g., 'OS #1234', 'Ajuste de Inventário'
    user: string;
    date: string; // ISO string
}

export interface ActivityLogEntry {
    id: string;
    created_at: string;
    user_email: string;
    action: 'INSERT' | 'UPDATE' | 'DELETE';
    table_name: string;
    record_id: string;
    description: string;
}