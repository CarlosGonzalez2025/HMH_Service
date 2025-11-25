/**
 * Business Validations for HMH System
 * Implements all business rules and constraints
 */

import { Activity, User, Client, ActivityStatus, ConsultantRate } from '../types';

// ============================================
// CLIENT VALIDATIONS
// ============================================

export const validateClientData = (data: Partial<Client>): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length < 3) {
    errors.push('El nombre del cliente debe tener al menos 3 caracteres');
  }

  if (!data.taxId || data.taxId.trim().length < 9) {
    errors.push('El NIT debe ser válido (mínimo 9 caracteres)');
  }

  if (!data.phone || !/^\d{7,10}$/.test(data.phone.replace(/\s/g, ''))) {
    errors.push('El teléfono debe tener entre 7 y 10 dígitos');
  }

  if (!data.address || data.address.trim().length < 5) {
    errors.push('La dirección debe tener al menos 5 caracteres');
  }

  if (!data.city || !data.department) {
    errors.push('Debe especificar ciudad y departamento');
  }

  if (!data.hmhCoordinatorId) {
    errors.push('Debe asignar un coordinador HMH responsable');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// ============================================
// ACTIVITY VALIDATIONS
// ============================================

export const validateActivityCreation = (data: Partial<Activity>): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.clientId) {
    errors.push('Debe seleccionar un cliente');
  }

  if (!data.activityType) {
    errors.push('Debe seleccionar un tipo de actividad');
  }

  if (!data.unit || !data.quantity || data.quantity <= 0) {
    errors.push('Debe especificar unidad y cantidad válida');
  }

  if (!data.value || data.value < 0) {
    errors.push('El valor debe ser mayor o igual a cero');
  }

  // Date validation
  if (data.requiredDate) {
    const requiredDate = new Date(data.requiredDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (requiredDate < today) {
      errors.push('La fecha requerida no puede ser anterior a hoy');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const validateActivityAssignment = (
  activity: Activity,
  provider: User,
  allocationPercentage: number,
  existingAssignments: { providerId: string; allocationPercentage: number }[]
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check activity is in correct state
  if (activity.status !== ActivityStatus.PendingAssignment) {
    errors.push('Solo se pueden asignar actividades en estado "Pendiente por asignar"');
  }

  // Check provider is active
  if (provider.status !== 'active') {
    errors.push('El consultor debe estar activo');
  }

  // Check provider role
  if (provider.role !== 'provider') {
    errors.push('Solo se pueden asignar usuarios con rol de consultor');
  }

  // Check provider belongs to same tenant
  if (provider.tenantId !== activity.tenantId) {
    errors.push('El consultor debe pertenecer al mismo tenant');
  }

  // Check allocation percentage
  if (allocationPercentage <= 0 || allocationPercentage > 100) {
    errors.push('El porcentaje de asignación debe estar entre 1 y 100');
  }

  // Check total allocation doesn't exceed 100%
  const totalExisting = existingAssignments.reduce((sum, a) => sum + a.allocationPercentage, 0);
  const totalNew = totalExisting + allocationPercentage;

  if (totalNew > 100) {
    errors.push(`La asignación total (${totalNew}%) excede el 100%. Ya asignado: ${totalExisting}%`);
  }

  // Check provider not already assigned
  const alreadyAssigned = existingAssignments.some(a => a.providerId === provider.id);
  if (alreadyAssigned) {
    errors.push('El consultor ya está asignado a esta actividad');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const validateActivityStatusChange = (
  currentStatus: ActivityStatus,
  newStatus: ActivityStatus,
  userRole: string
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Define valid transitions
  const validTransitions: Record<ActivityStatus, ActivityStatus[]> = {
    [ActivityStatus.PendingAssignment]: [ActivityStatus.Assigned],
    [ActivityStatus.Assigned]: [ActivityStatus.InContact, ActivityStatus.PendingAssignment],
    [ActivityStatus.InContact]: [ActivityStatus.InExecution, ActivityStatus.Assigned],
    [ActivityStatus.InExecution]: [ActivityStatus.Finalized, ActivityStatus.InContact],
    [ActivityStatus.Finalized]: [ActivityStatus.Approved, ActivityStatus.Rejected, ActivityStatus.InExecution],
    [ActivityStatus.Approved]: [ActivityStatus.BillingRequested],
    [ActivityStatus.BillingRequested]: [ActivityStatus.AccountReceivableFiled],
    [ActivityStatus.AccountReceivableFiled]: [ActivityStatus.Paid, ActivityStatus.Rejected],
    [ActivityStatus.Paid]: [],
    [ActivityStatus.Rejected]: [ActivityStatus.InExecution]
  };

  // Check if transition is valid
  const allowedNext = validTransitions[currentStatus] || [];
  if (!allowedNext.includes(newStatus)) {
    errors.push(`No se puede cambiar de "${currentStatus}" a "${newStatus}"`);
  }

  // Role-based permissions
  const rolePermissions: Record<string, ActivityStatus[]> = {
    coordinator: [
      ActivityStatus.Assigned,
      ActivityStatus.Approved,
      ActivityStatus.Rejected,
      ActivityStatus.BillingRequested
    ],
    provider: [
      ActivityStatus.InContact,
      ActivityStatus.InExecution,
      ActivityStatus.Finalized,
      ActivityStatus.AccountReceivableFiled
    ],
    accountant: [
      ActivityStatus.Paid,
      ActivityStatus.Rejected
    ],
    analyst: [
      ActivityStatus.PendingAssignment
    ]
  };

  const allowedForRole = rolePermissions[userRole] || [];
  if (!allowedForRole.includes(newStatus)) {
    errors.push(`El rol "${userRole}" no tiene permiso para cambiar a estado "${newStatus}"`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const validateActivityFinalization = (
  activity: Activity,
  executedUnits: number,
  supports: any[]
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (activity.status !== ActivityStatus.InExecution) {
    errors.push('Solo se pueden finalizar actividades en ejecución');
  }

  if (executedUnits <= 0) {
    errors.push('Debe especificar las unidades ejecutadas');
  }

  if (executedUnits > activity.quantity) {
    errors.push(`Las unidades ejecutadas (${executedUnits}) no pueden exceder las solicitadas (${activity.quantity})`);
  }

  if (!supports || supports.length === 0) {
    errors.push('Debe subir al menos un soporte obligatorio');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const validateActivityApproval = (
  activity: Activity,
  approverRole: string
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (activity.status !== ActivityStatus.Finalized) {
    errors.push('Solo se pueden aprobar actividades finalizadas');
  }

  if (!activity.supports || activity.supports.length === 0) {
    errors.push('La actividad debe tener soportes para ser aprobada');
  }

  if (approverRole !== 'coordinator' && approverRole !== 'admin') {
    errors.push('Solo coordinadores y administradores pueden aprobar actividades');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// ============================================
// CONSULTANT/PROVIDER VALIDATIONS
// ============================================

export const validateConsultantData = (data: Partial<User>): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length < 3) {
    errors.push('El nombre debe tener al menos 3 caracteres');
  }

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('El email debe ser válido');
  }

  if (!data.documentType || !data.documentNumber) {
    errors.push('Debe especificar tipo y número de documento');
  }

  if (data.documentNumber && data.documentNumber.length < 6) {
    errors.push('El número de documento debe tener al menos 6 caracteres');
  }

  if (!data.phone || !/^\d{7,10}$/.test(data.phone.replace(/\s/g, ''))) {
    errors.push('El teléfono debe tener entre 7 y 10 dígitos');
  }

  if (!data.profession) {
    errors.push('Debe especificar la profesión');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const validateConsultantRate = (data: Partial<ConsultantRate>): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.providerId) {
    errors.push('Debe seleccionar un consultor');
  }

  if (!data.clientId) {
    errors.push('Debe seleccionar un cliente');
  }

  if (!data.unit) {
    errors.push('Debe especificar la unidad (Hora, Visita, Informe, etc.)');
  }

  if (!data.value || data.value <= 0) {
    errors.push('El valor debe ser mayor a cero');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// ============================================
// BILLING VALIDATIONS
// ============================================

export const validateBillingRequest = (activity: Activity): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (activity.status !== ActivityStatus.Approved) {
    errors.push('Solo se puede solicitar facturación de actividades aprobadas');
  }

  if (!activity.serviceOrderId) {
    errors.push('La actividad debe tener una orden de servicio generada');
  }

  if (!activity.supports || activity.supports.length === 0) {
    errors.push('La actividad debe tener soportes');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const validateBillingAccountCreation = (
  activityIds: string[],
  activities: Activity[],
  providerId: string
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (activityIds.length === 0) {
    errors.push('Debe seleccionar al menos una actividad');
  }

  // Check all activities are approved
  const notApproved = activities.filter(a => a.status !== ActivityStatus.Approved);
  if (notApproved.length > 0) {
    errors.push(`${notApproved.length} actividades no están aprobadas`);
  }

  // Check all activities belong to same provider
  const wrongProvider = activities.filter(a => a.assignedProviderId !== providerId);
  if (wrongProvider.length > 0) {
    errors.push('Todas las actividades deben pertenecer al mismo consultor');
  }

  // Check no activity already has a billing account
  const alreadyBilled = activities.filter(a => a.billingAccountId);
  if (alreadyBilled.length > 0) {
    errors.push(`${alreadyBilled.length} actividades ya tienen cuenta de cobro radicada`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const validatePayment = (
  activity: Activity,
  payerRole: string
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (activity.status !== ActivityStatus.AccountReceivableFiled) {
    errors.push('Solo se pueden pagar actividades con cuenta de cobro radicada');
  }

  if (payerRole !== 'accountant' && payerRole !== 'admin') {
    errors.push('Solo contabilidad y administradores pueden procesar pagos');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export const formatValidationErrors = (errors: string[]): string => {
  return errors.join('\n• ');
};

export const showValidationAlert = (errors: string[]) => {
  alert('Errores de validación:\n\n• ' + formatValidationErrors(errors));
};
