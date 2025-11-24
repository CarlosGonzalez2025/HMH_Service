
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
  id: string; // IdPrestador / IdUser
  tenantId?: string | null;
  email: string; // CorreoElectronico
  role: UserRole; // ROL
  name: string; // NombreApellidos
  status: 'active' | 'inactive' | 'blocked';
  
  // Provider / Consultant Specific Fields
  documentType?: string; // TipoDocumento
  documentNumber?: string; // NumeroDocumento
  profession?: string; // Profesion
  specialization?: string; // Especializacion
  licenseSst?: string; // LicenciaSaludOcupacional (Puede ser numero o archivo)
  licenseNumber?: string; // NumeroLicencia
  licenseDate?: string; // FechaExpedicionLicencia
  department?: string; // Departamento
  city?: string; // Municipio
  phone?: string; // Telefono
  hourlyRate?: number; 
  
  // Audit
  createdAt?: string; // FechaCreacion
  updatedAt?: string; // FechaModificacion
  ipUser?: string; // IpUser
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

// Subcollection: tenants/{tenantId}/clients/{clientId}/contacts
export interface ClientContact {
  id: string;
  clientId: string;
  contactType: string; // Tipo de contacto
  name: string; // Nombre
  position: string; // Cargo
  email: string; // E-mail
  phone: string; // Telefono
  observation?: string; // Observación
}

// Subcollection: tenants/{tenantId}/clients/{clientId}/prices
export interface ClientPrice {
  id: string;
  clientId: string;
  unit: string; // UNIDAD (Ej: Hora, Informe, Visita)
  amount: number; // VALOR
  validFrom: string; // Valido desde
}

// Subcollection: tenants/{tenantId}/clients/{clientId}/subclients
export interface SubClient {
  id: string;
  clientId: string;
  // Campos especificos solicitados
  nit: string; // NIT_SUBCLIENTE
  name: string; // Nombre_Subcliente
  address: string; // Direccion Principal
  department: string; // Departamento
  city: string; // Municipio
  
  // Legacy fields kept for compatibility or removed if strict replacement needed
  contactName?: string; 
  contactEmail?: string;
}

// Subcollection: tenants/{tenantId}/clients/{clientId}/subclients/{subClientId}/contacts
export interface SubClientContact {
  id: string;
  subClientId: string;
  contactType: string; // Tipo de contacto
  name: string; // Nombre
  position: string; // Cargo
  email: string; // E-mail
  phone: string; // Telefono
  observation?: string; // Observación
}

// Collection: tenants/{tenantId}/consultantRates
export interface ConsultantRate {
  id: string;
  tenantId: string;
  providerId: string; // CC Consultor (User ID)
  clientId: string; // NIT Cliente (Client ID)
  unit: string; // Unidad
  value: number; // Valor
}

// NEW TABLE: Activity States (Maestros - Estados)
// Collection: tenants/{tenantId}/activityStates
export interface ActivityStateDefinition {
    id: string; // IdEstado
    name: string; // NombreEstado
    description: string; // Descripcion
    createdAt: string; // FechaCreacion
    updatedAt: string; // FechaModificacion
    userId: string; // IdUser (Audit)
    ipUser: string; // IpUser (Audit)
    comment?: string; // comentario
}

// NEW TABLE: Activity Types (Maestros - Tipos)
// Collection: tenants/{tenantId}/activityTypes
export interface ActivityTypeDefinition {
    id: string; // ID
    name: string; // Tipo_Actividad
    createdAt: string; // FechaCreacion
    updatedAt: string; // FechaModificacion
    userId: string; // IdUser
    ipUser: string; // IpUser
}

// NEW TABLE: Activity Assignment (Asignación actividad)
// Subcollection: activities/{activityId}/assignments
export interface ActivityAssignment {
    id: string; // ID_EJEC
    activityId: string; // # ORDEN (Link to Parent Activity)
    providerId: string; // Link to User
    
    // Snapshot fields (Required)
    providerDocument: string; // NumeroDocumento
    providerName: string; // NombreApellidos
    
    allocationPercentage: number; // % ASIGNACIÓN
    assignedAt: string;
}

// NEW TABLE: Activity Log (Bitacora Actividad)
// Subcollection: activities/{activityId}/logs
export interface ActivityLog {
    id: string; // ID
    activityId: string; // ID_EJEC
    date: string; // FECHA
    status: ActivityStatus; // ESTADO
    executedUnits: number; // UNID EJECUTADAS
    comment: string; // COMENTARIO
    
    // Audit
    userId?: string; 
    userName?: string;
}

// NEW TABLE: Activity Approval (Aprobación actividad)
// Subcollection: activities/{activityId}/approvals
export interface ActivityApproval {
    id: string; // ID
    activityId: string; // # ORDEN
    
    // Approver Snapshot
    approverDocument: string; // NumeroDocumento
    approverName: string; // NombreApellidos
    
    approved: boolean; // Aprobado
    comments: string; // Comentarios
    
    date: string;
}

// Root Collection: activities
export interface Activity {
  id: string; // ID_ACTIVIDAD
  tenantId: string;
  
  // Basic Data
  clientId: string; // Cliente *
  subClientId?: string; // Subcliente *
  activityType: string; // Tipo de Actividad *
  description?: string; // Descripción actividad solicitada
  
  // Internal Tracking
  orderNumber?: string; // # ORDEN (Likely Service Order or Internal Seq)
  requestDate: string; // Fecha Solicitud
  requiredDate?: string;
  priority: 'low' | 'medium' | 'high';
  
  // Financials
  unit: string; // UNIDAD *
  quantity: number; // Cantidad
  value: number; // VALOR
  
  // Execution Info
  executionData?: string; // DATOS EJECUCIÓN
  contactName?: string; // NOMBRE_CONTACTO
  contactPhone?: string; // TELEFONO_CONTACTO
  
  // People
  coordinatorId?: string; // COORDINADOR
  assignedProviderId?: string; 
  assignedAt?: string;

  // Workflow
  status: ActivityStatus; // ESTADO ACTIVIDAD *
  progress: number;
  supports?: { url: string; name: string; date: string }[]; 
  comments?: string; // Legacy

  // Req 7: Approval & Service Order
  approvalDate?: string;
  approvedBy?: string;
  serviceOrderId?: string; 

  // Req 8 & 10: Billing
  readyForBillingBy?: string; 
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