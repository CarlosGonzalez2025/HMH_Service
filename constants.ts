
import { Tenant, TenantStatus, User, Client, Activity, ActivityStatus, Invoice } from './types';

// 1. TENANTS
export const MOCK_TENANTS: Tenant[] = [
  {
    id: 'T001',
    taxId: '900.123.456',
    name: 'Seguridad Industrial Pro S.A.S',
    status: TenantStatus.Active,
    createdAt: '2023-01-15',
    plan: 'intermediate',
    billingPeriod: 'monthly',
    nextBillingDate: '2025-11-15',
    subscriptionStatus: 'active',
    userCount: 8,
    contactEmail: 'gerencia@seguridadpro.com',
    config: { primaryColor: '#0f172a' }
  },
  {
    id: 'T002',
    taxId: '800.987.654',
    name: 'Consultores H&S Global',
    status: TenantStatus.Active,
    createdAt: '2023-03-20',
    plan: 'basic',
    billingPeriod: 'annual',
    nextBillingDate: '2025-12-01',
    subscriptionStatus: 'active',
    userCount: 3,
    contactEmail: 'admin@hsglobal.com',
    config: { primaryColor: '#1e40af' }
  }
];

// 2. USERS
export const MOCK_USERS: User[] = [
  // Super Admin
  { id: 'U1', tenantId: null, email: 'ceo@saashmh.com', role: 'superAdmin', name: 'Carlos Master', status: 'active' },
  
  // Tenant 1 Users
  { id: 'U2', tenantId: 'T001', email: 'gerencia@seguridadpro.com', role: 'admin', name: 'Ana Gerente', status: 'active' },
  { id: 'U3', tenantId: 'T001', email: 'ops@seguridadpro.com', role: 'coordinator', name: 'Luis Coordinador', status: 'active' },
  { id: 'U4', tenantId: 'T001', email: 'campo@seguridadpro.com', role: 'provider', name: 'Pedro Consultor', status: 'active', profession: 'Ingeniero SST' },
  { id: 'U6', tenantId: 'T001', email: 'analista@seguridadpro.com', role: 'analyst', name: 'Sofia Analista', status: 'active' },
  { id: 'U7', tenantId: 'T001', email: 'conta@seguridadpro.com', role: 'accountant', name: 'Jorge Contador', status: 'active' },

  // Tenant 2 Users
  { id: 'U5', tenantId: 'T002', email: 'admin@hsglobal.com', role: 'admin', name: 'Maria Director', status: 'active' },
];

// 3. CLIENTS
export const MOCK_CLIENTS_T1: Client[] = [
  { 
    id: 'C1', 
    tenantId: 'T001', 
    taxId: '900.555.100', 
    name: 'Constructora El Sol', 
    phone: '601-777-8888',
    address: 'Av El Dorado # 26-10',
    department: 'Cundinamarca',
    city: 'Bogotá',
    hmhCoordinatorId: 'U3',
    billingTerms: 'Factura a 30 días, requiere Orden de Compra'
  },
  { 
    id: 'C2', 
    tenantId: 'T001', 
    taxId: '890.200.300', 
    name: 'Hospital Central', 
    phone: '604-200-1111',
    address: 'Calle 10 # 40-20',
    department: 'Antioquia',
    city: 'Medellín',
    hmhCoordinatorId: 'U3',
    billingTerms: 'Pago anticipado 50%'
  },
];

export const MOCK_CLIENTS_T2: Client[] = [
  { 
    id: 'C3', 
    tenantId: 'T002', 
    taxId: '800.333.444', 
    name: 'Minera del Norte', 
    phone: '310-555-9090',
    address: 'Zona Industrial Lote 4',
    department: 'Valle del Cauca',
    city: 'Cali',
    hmhCoordinatorId: 'U5',
    billingTerms: 'Corte mensual los días 25'
  },
]

// 4. ACTIVITIES
export const MOCK_ACTIVITIES: Activity[] = [
  { 
    id: 'A1', 
    tenantId: 'T001', 
    clientId: 'C1',
    activityType: 'Auditoria Alturas',
    priority: 'high',
    requestDate: '2023-10-01', 
    status: ActivityStatus.InExecution,
    assignedProviderId: 'U4',
    progress: 50,
    unit: 'Hora',
    quantity: 10,
    value: 500000
  },
  { 
    id: 'A2', 
    tenantId: 'T001', 
    clientId: 'C2',
    activityType: 'Capacitación G1', 
    priority: 'medium',
    requestDate: '2023-10-05', 
    status: ActivityStatus.PendingAssignment,
    progress: 0,
    unit: 'Sesión',
    quantity: 1,
    value: 1200000
  },
  { 
    id: 'A3', 
    tenantId: 'T001', 
    clientId: 'C1',
    activityType: 'Inspección Extintores', 
    priority: 'low',
    requestDate: '2023-10-10', 
    status: ActivityStatus.Approved,
    assignedProviderId: 'U4', 
    progress: 100,
    supports: [{ name: 'Informe.pdf', url: '#', date: '2023-10-12' }],
    serviceOrderId: 'OS-001',
    unit: 'Unidad',
    quantity: 20,
    value: 200000
  }
];

// 5. INVOICES
export const MOCK_INVOICES: Invoice[] = [
    { id: 'INV-001', tenantId: 'T001', tenantName: 'Seguridad Industrial Pro S.A.S', amount: 1500000, date: '2023-10-01', status: 'paid', concept: 'Suscripción Enterprise Mensual' },
];