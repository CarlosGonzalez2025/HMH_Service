
import { db, auth, firebaseConfig } from '../firebaseConfig';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, setDoc, getFirestore, getDoc, orderBy } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { Activity, Client, Tenant, User, ActivityStatus, PlanType, Invoice, UserRole, SubClient, ServiceOrder, ClientContact, ClientPrice, SubClientContact, ConsultantRate, ActivityStateDefinition, ActivityTypeDefinition, ActivityAssignment, ActivityLog, ActivityApproval } from '../types';
import { MOCK_INVOICES } from '../constants';

// Collections
const REF_ACTIVITIES = collection(db, 'activities');
const REF_TENANTS = collection(db, 'tenants');
const REF_USERS = collection(db, 'users');
const REF_SERVICE_ORDERS = collection(db, 'serviceOrders');

// Helper to sanitize Firestore Timestamps
const formatFirestoreDate = (val: any): string => {
  if (val && typeof val === 'object' && 'seconds' in val) {
    return new Date(val.seconds * 1000).toISOString().split('T')[0];
  }
  return val || ''; 
};

// --- CORE SERVICES ---

export const getActivities = async (currentUser: User): Promise<Activity[]> => {
  try {
    let q;
    
    if (currentUser.role === 'superAdmin') {
      q = query(REF_ACTIVITIES);
    } else if (currentUser.tenantId) {
       if (currentUser.role === 'provider') {
          q = query(
            REF_ACTIVITIES, 
            where('tenantId', '==', currentUser.tenantId),
            where('assignedProviderId', '==', currentUser.id) 
          );
       } else {
          // Analyst, Accountant, Coordinator, Admin see all tenant activities
          q = query(REF_ACTIVITIES, where('tenantId', '==', currentUser.tenantId));
       }
    } else {
      return [];
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
            ...data, 
            id: doc.id,
            requestDate: formatFirestoreDate(data.requestDate),
            requiredDate: formatFirestoreDate(data.requiredDate)
        } as Activity;
    });
  } catch (error) {
    console.error("Error getting activities:", error);
    return [];
  }
};

export const getClients = async (currentUser: User): Promise<Client[]> => {
  if (!currentUser.tenantId) return [];
  try {
    const clientsRef = collection(db, `tenants/${currentUser.tenantId}/clients`);
    const snapshot = await getDocs(clientsRef);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Client));
  } catch (error) {
    console.error("Error getting clients:", error);
    return [];
  }
};

export const createClient = async (data: Partial<Client>, currentUser: User): Promise<boolean> => {
    if(!currentUser.tenantId) return false;
    try {
        await addDoc(collection(db, `tenants/${currentUser.tenantId}/clients`), {
            ...data,
            tenantId: currentUser.tenantId
        });
        return true;
    } catch(e) {
        console.error(e);
        return false;
    }
}

// Req 2: Subclients
export const getSubClients = async (tenantId: string, clientId: string): Promise<SubClient[]> => {
    try {
        const ref = collection(db, `tenants/${tenantId}/clients/${clientId}/subclients`);
        const snapshot = await getDocs(ref);
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, clientId } as SubClient));
    } catch(e) { return [] }
}

export const createSubClient = async (tenantId: string, clientId: string, data: Partial<SubClient>): Promise<boolean> => {
    try {
        await addDoc(collection(db, `tenants/${tenantId}/clients/${clientId}/subclients`), {
            ...data,
            clientId
        });
        return true;
    } catch(e) { return false; }
}

// Client Contacts
export const getClientContacts = async (tenantId: string, clientId: string): Promise<ClientContact[]> => {
    try {
        const ref = collection(db, `tenants/${tenantId}/clients/${clientId}/contacts`);
        const snapshot = await getDocs(ref);
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, clientId } as ClientContact));
    } catch(e) { return [] }
}

export const createClientContact = async (tenantId: string, clientId: string, data: Partial<ClientContact>): Promise<boolean> => {
    try {
        await addDoc(collection(db, `tenants/${tenantId}/clients/${clientId}/contacts`), {
            ...data,
            clientId
        });
        return true;
    } catch(e) { return false; }
}

// SubClient Contacts
export const getSubClientContacts = async (tenantId: string, clientId: string, subClientId: string): Promise<SubClientContact[]> => {
    try {
        const ref = collection(db, `tenants/${tenantId}/clients/${clientId}/subclients/${subClientId}/contacts`);
        const snapshot = await getDocs(ref);
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, subClientId } as SubClientContact));
    } catch(e) { return [] }
}

export const createSubClientContact = async (tenantId: string, clientId: string, subClientId: string, data: Partial<SubClientContact>): Promise<boolean> => {
    try {
        await addDoc(collection(db, `tenants/${tenantId}/clients/${clientId}/subclients/${subClientId}/contacts`), {
            ...data,
            subClientId
        });
        return true;
    } catch(e) { return false; }
}

// Client Prices
export const getClientPrices = async (tenantId: string, clientId: string): Promise<ClientPrice[]> => {
    try {
        const ref = collection(db, `tenants/${tenantId}/clients/${clientId}/prices`);
        const snapshot = await getDocs(ref);
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, clientId } as ClientPrice));
    } catch(e) { return [] }
}

export const createClientPrice = async (tenantId: string, clientId: string, data: Partial<ClientPrice>): Promise<boolean> => {
    try {
        await addDoc(collection(db, `tenants/${tenantId}/clients/${clientId}/prices`), {
            ...data,
            clientId
        });
        return true;
    } catch(e) { return false; }
}

// Consultant Rates / Tarifas Prestadores
export const getConsultantRates = async (tenantId: string, providerId: string): Promise<ConsultantRate[]> => {
    try {
        const ref = collection(db, `tenants/${tenantId}/consultantRates`);
        const q = query(ref, where('providerId', '==', providerId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ConsultantRate));
    } catch(e) { 
        console.error(e);
        return []; 
    }
}

export const createConsultantRate = async (tenantId: string, data: Partial<ConsultantRate>): Promise<boolean> => {
    try {
        await addDoc(collection(db, `tenants/${tenantId}/consultantRates`), {
            ...data,
            tenantId
        });
        return true;
    } catch(e) { 
        console.error(e);
        return false; 
    }
}

// Activity States (Maestros)
export const getActivityStates = async (tenantId: string): Promise<ActivityStateDefinition[]> => {
    try {
        const ref = collection(db, `tenants/${tenantId}/activityStates`);
        const snapshot = await getDocs(ref);
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ActivityStateDefinition));
    } catch(e) {
        console.error(e);
        return [];
    }
}

export const createActivityState = async (tenantId: string, data: Partial<ActivityStateDefinition>): Promise<boolean> => {
    try {
        await addDoc(collection(db, `tenants/${tenantId}/activityStates`), {
            ...data
        });
        return true;
    } catch(e) {
        console.error(e);
        return false;
    }
}

// Activity Types (Maestros)
export const getActivityTypes = async (tenantId: string): Promise<ActivityTypeDefinition[]> => {
    try {
        const ref = collection(db, `tenants/${tenantId}/activityTypes`);
        const snapshot = await getDocs(ref);
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ActivityTypeDefinition));
    } catch(e) {
        console.error(e);
        return [];
    }
}

export const createActivityType = async (tenantId: string, data: Partial<ActivityTypeDefinition>): Promise<boolean> => {
    try {
        await addDoc(collection(db, `tenants/${tenantId}/activityTypes`), {
            ...data
        });
        return true;
    } catch(e) {
        console.error(e);
        return false;
    }
}

// Activity Logs (Bitacora)
export const getActivityLogs = async (activityId: string): Promise<ActivityLog[]> => {
    try {
        const ref = collection(db, `activities/${activityId}/logs`);
        const q = query(ref, orderBy('date', 'desc')); // Most recent first
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ActivityLog));
    } catch(e) { return [] }
}

export const createActivityLog = async (activityId: string, data: Partial<ActivityLog>) => {
    try {
        await addDoc(collection(db, `activities/${activityId}/logs`), {
            ...data,
            activityId
        });
    } catch(e) { console.error(e); }
}

// Req 4: Analyst creates Activity
export const createActivity = async (data: Partial<Activity>, currentUser: User): Promise<Activity | null> => {
    if(!currentUser.tenantId) throw new Error("Tenant Context Required");

    // Generate internal order number (timestamp based for now)
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;

    const newActivity = {
        tenantId: currentUser.tenantId,
        orderNumber,
        requestDate: new Date().toISOString().split('T')[0],
        status: ActivityStatus.PendingAssignment, // Always starts here
        progress: 0,
        ...data
    };

    try {
      const docRef = await addDoc(REF_ACTIVITIES, newActivity);
      // Create initial Log
      await createActivityLog(docRef.id, {
          date: new Date().toISOString(),
          status: ActivityStatus.PendingAssignment,
          executedUnits: 0,
          comment: 'Solicitud creada en el sistema',
          userId: currentUser.id,
          userName: currentUser.name
      });

      return { ...newActivity, id: docRef.id } as Activity;
    } catch (error) {
      console.error("Error creating activity:", error);
      return null;
    }
}

// Req 5: Coordinator Assigns Activity
export const assignActivity = async (activityId: string, provider: User, percentage: number) => {
    try {
        // 1. Create Assignment Record (Asignación actividad)
        const assignmentsRef = collection(db, `activities/${activityId}/assignments`);
        await addDoc(assignmentsRef, {
            activityId,
            providerId: provider.id,
            providerDocument: provider.documentNumber || 'N/A', // Snapshot
            providerName: provider.name, // Snapshot
            allocationPercentage: percentage,
            assignedAt: new Date().toISOString()
        });

        // 2. Update Parent Activity Status and Main Provider (Quick Link)
        const ref = doc(db, 'activities', activityId);
        await updateDoc(ref, {
            assignedProviderId: provider.id,
            status: ActivityStatus.Assigned,
            assignedAt: new Date().toISOString()
        });

        // 3. Log to Bitacora
        await createActivityLog(activityId, {
            date: new Date().toISOString(),
            status: ActivityStatus.Assigned,
            executedUnits: 0,
            comment: `Asignada a ${provider.name} (${percentage}%)`,
            userName: 'Coordinador'
        });

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

export const getActivityAssignments = async (activityId: string): Promise<ActivityAssignment[]> => {
    try {
        const ref = collection(db, `activities/${activityId}/assignments`);
        const snapshot = await getDocs(ref);
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ActivityAssignment));
    } catch(e) { return [] }
}

// Req 6: Consultant updates Status & Uploads Support
export const updateActivityStatus = async (
    activityId: string, 
    status: ActivityStatus, 
    logData: { executedUnits: number, comment: string, supports?: any, userId?: string, userName?: string }
) => {
    const ref = doc(db, 'activities', activityId);
    const updateData: any = { status };
    
    if (status === ActivityStatus.InExecution) {
        updateData.progress = 50;
    }
    if (status === ActivityStatus.Finalized) {
        updateData.progress = 100;
        if(logData.supports) updateData.supports = logData.supports;
    }
    
    await updateDoc(ref, updateData);

    // Create Log Entry (Bitacora)
    await createActivityLog(activityId, {
        date: new Date().toISOString(),
        status: status,
        executedUnits: logData.executedUnits,
        comment: logData.comment,
        userId: logData.userId,
        userName: logData.userName
    });
}

// Req 7: Coordinator Approves & Generates Service Order
export const createActivityApproval = async (
    activity: Activity, 
    currentUser: User, 
    approved: boolean, 
    comments: string
): Promise<boolean> => {
    try {
        // 1. Create Approval Record (Snapshot)
        const approvalsRef = collection(db, `activities/${activity.id}/approvals`);
        await addDoc(approvalsRef, {
            activityId: activity.id,
            approverDocument: currentUser.documentNumber || 'N/A', // Snapshot
            approverName: currentUser.name, // Snapshot
            approved: approved,
            comments: comments,
            date: new Date().toISOString()
        });

        // 2. Logic based on Approval
        const activityRef = doc(db, 'activities', activity.id);
        
        if (approved) {
             // Generate Service Order
            const orderNumber = `OS-${Math.floor(Math.random() * 10000)}`;
            const orderRef = await addDoc(REF_SERVICE_ORDERS, {
                tenantId: activity.tenantId,
                activityId: activity.id,
                orderNumber,
                status: 'generated',
                amount: 0, 
                generatedAt: new Date().toISOString(),
                approvedBy: currentUser.id
            });

            // Update Activity
            await updateDoc(activityRef, {
                status: ActivityStatus.Approved,
                serviceOrderId: orderRef.id,
                approvalDate: new Date().toISOString(),
                approvedBy: currentUser.id
            });

             // Log
            await createActivityLog(activity.id, {
                date: new Date().toISOString(),
                status: ActivityStatus.Approved,
                executedUnits: activity.quantity,
                comment: `Aprobada. Orden Servicio Generada: ${orderNumber}. Comentarios: ${comments}`,
                userId: currentUser.id,
                userName: currentUser.name
            });
        } else {
            // Rejected (Requiere Ajuste) -> Send back to InExecution or a "Review" state
            await updateDoc(activityRef, {
                status: ActivityStatus.InExecution, // Send back to execution for fixes
            });
            
             // Log
            await createActivityLog(activity.id, {
                date: new Date().toISOString(),
                status: ActivityStatus.InExecution, // Log as change back to execution
                executedUnits: 0,
                comment: `Rechazada/Requiere Ajuste. Comentarios: ${comments}`,
                userId: currentUser.id,
                userName: currentUser.name
            });
        }

        return true;
    } catch(e) {
        console.error(e);
        return false;
    }
}

// Req 8: Coordinator Requests Billing
export const requestBilling = async (activityId: string, userId: string) => {
    const ref = doc(db, 'activities', activityId);
    await updateDoc(ref, {
        status: ActivityStatus.BillingRequested,
        readyForBillingBy: userId,
        billingRequestedAt: new Date().toISOString()
    });
    
    await createActivityLog(activityId, {
        date: new Date().toISOString(),
        status: ActivityStatus.BillingRequested,
        executedUnits: 0,
        comment: 'Solicitud de facturación enviada a contabilidad.',
        userId: userId
    });
}

// Req 9: Consultant Files Account Receivable
export const fileAccountReceivable = async (activityId: string) => {
    const ref = doc(db, 'activities', activityId);
    await updateDoc(ref, {
        status: ActivityStatus.AccountReceivableFiled
    });
    
    await createActivityLog(activityId, {
        date: new Date().toISOString(),
        status: ActivityStatus.AccountReceivableFiled,
        executedUnits: 0,
        comment: 'Cuenta de cobro radicada por el consultor.',
        userName: 'Consultor'
    });
}

// Req 10: Accountant Pays
export const processPayment = async (activityId: string, status: 'paid' | 'rejected') => {
    const ref = doc(db, 'activities', activityId);
    const newStatus = status === 'paid' ? ActivityStatus.Paid : ActivityStatus.Rejected;
    await updateDoc(ref, {
        status: newStatus,
        paidAt: status === 'paid' ? new Date().toISOString() : null
    });

    await createActivityLog(activityId, {
        date: new Date().toISOString(),
        status: newStatus,
        executedUnits: 0,
        comment: status === 'paid' ? 'Pago realizado exitosamente.' : 'Pago rechazado por contabilidad.',
        userName: 'Contabilidad'
    });
}

// --- TEAM MANAGEMENT SERVICES ---

export const getTenantUsers = async (tenantId: string): Promise<User[]> => {
    try {
        const q = query(REF_USERS, where('tenantId', '==', tenantId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
    } catch (error) {
        console.error("Error getting team users:", error);
        return [];
    }
};

export const registerUserForTenant = async (
    userData: { name: string; email: string; role: UserRole; password?: string },
    tenantId: string,
    profileData?: Partial<User> // Extra fields for Providers
): Promise<boolean> => {
    let secondaryApp: any = null;
    try {
        secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
        const secondaryAuth = getAuth(secondaryApp);
        const secondaryDb = getFirestore(secondaryApp);
        const password = userData.password || "123456"; 
        let uid = '';

        try {
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, userData.email, password);
            uid = userCredential.user.uid;
        } catch (authError: any) {
            if (authError.code === 'auth/email-already-in-use') {
                try {
                    const userCredential = await signInWithEmailAndPassword(secondaryAuth, userData.email, password);
                    uid = userCredential.user.uid;
                } catch (loginError) {
                    throw new Error("El usuario ya existe y no se pudo recuperar.");
                }
            } else {
                throw authError;
            }
        }

        if (uid) {
            // Merge basic auth data with extended profile data
            const fullProfile = {
                name: userData.name,
                email: userData.email,
                role: userData.role,
                tenantId: tenantId,
                status: 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                ipUser: '127.0.0.1', // Placeholder for frontend-only
                ...profileData 
            };

            await setDoc(doc(secondaryDb, 'users', uid), fullProfile);
        }
        await signOut(secondaryAuth);
        return true;
    } catch (error) {
        console.error("Error creating user:", error);
        return false;
    } finally {
        if (secondaryApp) {
            deleteApp(secondaryApp);
        }
    }
};

// --- SUPER ADMIN SERVICES ---

export const getTenants = async (currentUser: User): Promise<Tenant[]> => {
  if (currentUser.role !== 'superAdmin') return [];

  try {
    const snapshot = await getDocs(REF_TENANTS);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
            ...data, 
            id: doc.id,
            createdAt: formatFirestoreDate(data.createdAt),
            nextBillingDate: formatFirestoreDate(data.nextBillingDate)
        } as Tenant;
    });
  } catch (error) {
    console.error("Error getting tenants:", error);
    return [];
  }
};

export const createTenant = async (
    tenantData: Partial<Tenant>, 
    adminUser: { email: string, name: string }
): Promise<boolean> => {
    try {
        const newTenantRef = await addDoc(REF_TENANTS, {
            ...tenantData,
            createdAt: new Date().toISOString().split('T')[0],
            status: 'active',
            subscriptionStatus: 'active',
            userCount: 1,
            config: { primaryColor: '#000000' } 
        });

        await registerUserForTenant({
            name: adminUser.name,
            email: adminUser.email,
            role: 'admin',
            password: '123456'
        }, newTenantRef.id);

        return true;
    } catch (error) {
        console.error("Error creating tenant:", error);
        return false;
    }
};

export const updateTenant = async (tenantId: string, data: Partial<Tenant>) => {
    const ref = doc(db, 'tenants', tenantId);
    await updateDoc(ref, data);
};

export const getGlobalUsers = async (currentUser: User): Promise<User[]> => {
    if (currentUser.role !== 'superAdmin') return [];
    const snap = await getDocs(REF_USERS);
    return snap.docs.map(doc => ({...doc.data(), id: doc.id} as User));
}

export const toggleUserBlock = async (userId: string, currentStatus: string) => {
    const ref = doc(db, 'users', userId);
    const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
    await updateDoc(ref, { status: newStatus });
};

export const getInvoices = async (): Promise<Invoice[]> => {
    return new Promise(resolve => setTimeout(() => resolve(MOCK_INVOICES), 500));
}

export const getPlanLimits = (plan: PlanType) => {
    switch(plan) {
        case 'basic': return { users: 5, storage: '5GB', price: 500000 };
        case 'intermediate': return { users: 15, storage: '50GB', price: 1500000 };
        case 'enterprise': return { users: 9999, storage: 'Unlimited', price: 3000000 };
    }
}
