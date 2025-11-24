// Role Definitions matching Firestore 'role' field
export type UserRole = 'superAdmin' | 'admin' | 'coordinator' | 'analyst' | 'provider' | 'client' | 'accountant';

export type PlanType = 'basic' | 'intermediate' | 'enterprise';
export type SubscriptionStatus = 'active' | 'suspended' | 'canceled' | 'trial';
export type BillingPeriod = 'monthly' | 'annual';

// Strict Workflow Statuses
export enum ActivityStatus {
  PendingAssignment = 'pending_assignment', // Req 4: Creada por Analista
  Assigned = 'assigned', // Req 5: Asignada por Coordinador
  InContact = 'in_contact', // Req 6: Consultor inicia
  InExecution = 'in_execution', // Req 6: Consultor trabajando
  Finalized = 'finalized', // Req 6: Consultor termina (requiere soporte)
  Approved = 'approved', // Req 7: Coordinador aprueba (Genera Orden Servicio)
  BillingRequested = 'billing_requested', // Req 8: Coordinador solicita facturación
  AccountReceivableFiled = 'account_receivable_filed', // Req 9: Consultor radica cuenta cobro
  Paid = 'paid', // Req 10: Contabilidad paga
  Rejected = 'rejected' // Flujo alterno
}

export enum TenantStatus {
  Active = 'active',
  Suspended = 'suspended'
}

// Entity Definitions

export interface Tenant {
  id: string; 
  name: string; 
  taxId: string; 
  status: TenantStatus;
  createdAt: string;
  plan: PlanType;
  billingPeriod: BillingPeriod;
  nextBillingDate: string;
  subscriptionStatus: SubscriptionStatus;
  userCount: number; 
  contactEmail: string;
  config: {
    primaryColor: string;
    logoUrl?: string;
  };
}

export interface User {
  id: string;
  tenantId?: string | null;
  email: string;
  role: UserRole;
  name: string;
  status: 'active' | 'inactive' | 'blocked';
  // Provider specific fields (Req 3)
  profession?: string;
  hourlyRate?: number;
}

// Subcollection: tenants/{tenantId}/clients/{clientId}
export interface Client {
  id: string;
  tenantId: string;
  
  // Basic Info
  taxId: string; // NIT
  name: string; // Razon Social
  
  // Contact Info
  phone: string; // Telefono Empresa
  address: string; // Dirección Empresa
  department: string; // Departamento
  city: string; // Ciudad Principal
  
  // Management
  hmhCoordinatorId: string; // Coordinador HMH (User ID)
  billingTerms: string; // Condiciones para Facturar
  
  hourlyRate?: number; // Valor hora negociado
}

// Subcollection: tenants/{tenantId}/clients/{clientId}/subclients
export interface SubClient {
  id: string;
  clientId: string;
  name: string;
  contactName: string;
  contactEmail: string;
}

// Root Collection: activities
export interface Activity {
  id: string;
  tenantId: string;
  
  // Req 4: Initial Request
  clientId: string;
  subClientId?: string;
  activityType: string;
  priority: 'low' | 'medium' | 'high';
  requestDate: string;
  requiredDate?: string;
  comments?: string;
  
  // Req 5: Assignment
  assignedProviderId?: string; 
  assignedAt?: string;

  // Req 6: Execution & Supports
  status: ActivityStatus;
  progress: number;
  supports?: { url: string; name: string; date: string }[]; // Req 6: Soportes

  // Req 7: Approval & Service Order
  approvalDate?: string;
  approvedBy?: string;
  serviceOrderId?: string; // Link to ServiceOrder

  // Req 8 & 10: Billing
  readyForBillingBy?: string; // User who marked ready
  billingRequestedAt?: string;
  paidAt?: string;
}

export interface ServiceOrder {
    id: string;
    tenantId: string;
    activityId: string;
    orderNumber: string;
    amount: number;
    status: 'generated' | 'filed' | 'paid';
    generatedAt: string;
}

export interface Invoice {
    id: string;
    tenantId: string;
    tenantName: string;
    amount: number;
    date: string;
    status: 'paid' | 'pending' | 'overdue';
    concept: string;
}