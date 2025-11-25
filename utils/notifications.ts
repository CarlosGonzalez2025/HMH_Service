/**
 * Notification System for HMH
 * Handles email notifications and in-app notifications
 */

import { Activity, User, ActivityStatus } from '../types';

// ============================================
// NOTIFICATION TYPES
// ============================================

export enum NotificationType {
  ActivityAssigned = 'activity_assigned',
  ActivityStatusChanged = 'activity_status_changed',
  ActivityApproved = 'activity_approved',
  ActivityRejected = 'activity_rejected',
  BillingRequested = 'billing_requested',
  PaymentProcessed = 'payment_processed',
  ServiceOrderGenerated = 'service_order_generated',
}

export interface NotificationData {
  type: NotificationType;
  recipientEmail: string;
  recipientName: string;
  activity?: Activity;
  customMessage?: string;
  metadata?: Record<string, any>;
}

// ============================================
// EMAIL TEMPLATES
// ============================================

const getEmailTemplate = (type: NotificationType, data: NotificationData): { subject: string; body: string } => {
  const { recipientName, activity, customMessage, metadata } = data;

  switch (type) {
    case NotificationType.ActivityAssigned:
      return {
        subject: `Nueva actividad asignada - ${activity?.orderNumber}`,
        body: `
Hola ${recipientName},

Se te ha asignado una nueva actividad:

📋 Orden: ${activity?.orderNumber}
🏢 Cliente: ${metadata?.clientName || 'N/A'}
📝 Tipo: ${activity?.activityType}
📅 Fecha requerida: ${activity?.requiredDate || 'Por definir'}
⏰ Prioridad: ${activity?.priority}

Descripción:
${activity?.description || 'Sin descripción'}

Por favor, inicia el trabajo lo antes posible y actualiza el estado en el sistema.

Accede al sistema: ${metadata?.appUrl || 'https://tu-app.com'}

Saludos,
Sistema HMH
        `
      };

    case NotificationType.ActivityApproved:
      return {
        subject: `Actividad aprobada - ${activity?.orderNumber}`,
        body: `
Hola ${recipientName},

Tu actividad ha sido aprobada:

📋 Orden: ${activity?.orderNumber}
✅ Estado: Aprobada
📄 Orden de Servicio: ${metadata?.serviceOrderNumber || 'Generada'}

${customMessage ? `\nComentarios del coordinador:\n${customMessage}` : ''}

Ya puedes proceder con la cuenta de cobro.

Accede al sistema: ${metadata?.appUrl || 'https://tu-app.com'}

Saludos,
Sistema HMH
        `
      };

    case NotificationType.ActivityRejected:
      return {
        subject: `Actividad requiere ajustes - ${activity?.orderNumber}`,
        body: `
Hola ${recipientName},

Tu actividad requiere ajustes:

📋 Orden: ${activity?.orderNumber}
⚠️ Estado: Requiere ajuste
📝 Comentarios del coordinador:
${customMessage || 'Sin comentarios'}

Por favor, revisa los comentarios y realiza los ajustes necesarios.

Accede al sistema: ${metadata?.appUrl || 'https://tu-app.com'}

Saludos,
Sistema HMH
        `
      };

    case NotificationType.BillingRequested:
      return {
        subject: `Nueva solicitud de facturación - ${activity?.orderNumber}`,
        body: `
Hola ${recipientName},

Nueva solicitud de facturación disponible:

📋 Orden: ${activity?.orderNumber}
🏢 Cliente: ${metadata?.clientName || 'N/A'}
💰 Valor: $${activity?.value?.toLocaleString()}
📄 Orden de Servicio: ${metadata?.serviceOrderNumber || 'N/A'}

Por favor, procesa la facturación en el sistema contable.

Accede al sistema: ${metadata?.appUrl || 'https://tu-app.com'}

Saludos,
Sistema HMH
        `
      };

    case NotificationType.PaymentProcessed:
      return {
        subject: `Pago procesado - ${activity?.orderNumber}`,
        body: `
Hola ${recipientName},

El pago de tu actividad ha sido procesado:

📋 Orden: ${activity?.orderNumber}
💰 Valor: $${activity?.value?.toLocaleString()}
✅ Estado: Pagado
📅 Fecha de pago: ${new Date().toLocaleDateString()}

${customMessage ? `\nComentarios:\n${customMessage}` : ''}

Accede al sistema: ${metadata?.appUrl || 'https://tu-app.com'}

Saludos,
Sistema HMH
        `
      };

    case NotificationType.ServiceOrderGenerated:
      return {
        subject: `Orden de servicio generada - ${metadata?.serviceOrderNumber}`,
        body: `
Hola ${recipientName},

Se ha generado una orden de servicio:

📋 Actividad: ${activity?.orderNumber}
📄 Orden de Servicio: ${metadata?.serviceOrderNumber}
🏢 Cliente: ${metadata?.clientName || 'N/A'}
💰 Valor: $${activity?.value?.toLocaleString()}

La orden de servicio está lista para ser facturada.

Accede al sistema: ${metadata?.appUrl || 'https://tu-app.com'}

Saludos,
Sistema HMH
        `
      };

    default:
      return {
        subject: 'Notificación del sistema HMH',
        body: customMessage || 'Tienes una nueva notificación en el sistema.'
      };
  }
};

// ============================================
// EMAIL SENDING (Backend Integration)
// ============================================

/**
 * Send email notification
 * NOTE: This requires a backend service or Firebase Functions
 * For now, this is a placeholder that logs the email
 */
export const sendEmailNotification = async (data: NotificationData): Promise<boolean> => {
  try {
    const { subject, body } = getEmailTemplate(data.type, data);

    console.log('📧 EMAIL NOTIFICATION:');
    console.log('To:', data.recipientEmail);
    console.log('Subject:', subject);
    console.log('Body:', body);
    console.log('---');

    // TODO: Implement real email sending
    // Options:
    // 1. Firebase Functions + SendGrid
    // 2. Firebase Functions + Nodemailer
    // 3. External API (like Mailgun, Postmark)
    // 4. Firebase Extensions (Trigger Email)

    /*
    // Example with Firebase Functions:
    const sendEmail = httpsCallable(functions, 'sendEmail');
    await sendEmail({
      to: data.recipientEmail,
      subject,
      body
    });
    */

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

// ============================================
// IN-APP NOTIFICATIONS
// ============================================

export interface InAppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  metadata?: Record<string, any>;
}

/**
 * Create in-app notification
 * Stores notification in Firestore for user to see in app
 */
export const createInAppNotification = async (
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  metadata?: Record<string, any>
): Promise<boolean> => {
  try {
    // TODO: Implement Firestore save
    /*
    const notifRef = collection(db, 'users', userId, 'notifications');
    await addDoc(notifRef, {
      type,
      title,
      message,
      read: false,
      createdAt: new Date().toISOString(),
      metadata
    });
    */

    console.log('🔔 IN-APP NOTIFICATION:');
    console.log('User:', userId);
    console.log('Title:', title);
    console.log('Message:', message);
    console.log('---');

    return true;
  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  }
};

// ============================================
// HIGH-LEVEL NOTIFICATION FUNCTIONS
// ============================================

export const notifyActivityAssigned = async (
  activity: Activity,
  provider: User,
  clientName: string
): Promise<void> => {
  const appUrl = window.location.origin;

  await Promise.all([
    sendEmailNotification({
      type: NotificationType.ActivityAssigned,
      recipientEmail: provider.email,
      recipientName: provider.name,
      activity,
      metadata: { clientName, appUrl }
    }),
    createInAppNotification(
      provider.id,
      NotificationType.ActivityAssigned,
      `Nueva actividad asignada`,
      `Se te ha asignado la actividad ${activity.orderNumber} - ${clientName}`,
      { activityId: activity.id }
    )
  ]);
};

export const notifyActivityApproved = async (
  activity: Activity,
  provider: User,
  serviceOrderNumber: string,
  comments?: string
): Promise<void> => {
  const appUrl = window.location.origin;

  await Promise.all([
    sendEmailNotification({
      type: NotificationType.ActivityApproved,
      recipientEmail: provider.email,
      recipientName: provider.name,
      activity,
      customMessage: comments,
      metadata: { serviceOrderNumber, appUrl }
    }),
    createInAppNotification(
      provider.id,
      NotificationType.ActivityApproved,
      `Actividad aprobada`,
      `Tu actividad ${activity.orderNumber} ha sido aprobada. OS: ${serviceOrderNumber}`,
      { activityId: activity.id }
    )
  ]);
};

export const notifyActivityRejected = async (
  activity: Activity,
  provider: User,
  comments: string
): Promise<void> => {
  const appUrl = window.location.origin;

  await Promise.all([
    sendEmailNotification({
      type: NotificationType.ActivityRejected,
      recipientEmail: provider.email,
      recipientName: provider.name,
      activity,
      customMessage: comments,
      metadata: { appUrl }
    }),
    createInAppNotification(
      provider.id,
      NotificationType.ActivityRejected,
      `Actividad requiere ajustes`,
      `La actividad ${activity.orderNumber} requiere ajustes: ${comments}`,
      { activityId: activity.id }
    )
  ]);
};

export const notifyBillingRequested = async (
  activity: Activity,
  accountant: User,
  clientName: string,
  serviceOrderNumber: string
): Promise<void> => {
  const appUrl = window.location.origin;

  await Promise.all([
    sendEmailNotification({
      type: NotificationType.BillingRequested,
      recipientEmail: accountant.email,
      recipientName: accountant.name,
      activity,
      metadata: { clientName, serviceOrderNumber, appUrl }
    }),
    createInAppNotification(
      accountant.id,
      NotificationType.BillingRequested,
      `Nueva solicitud de facturación`,
      `Actividad ${activity.orderNumber} lista para facturar`,
      { activityId: activity.id }
    )
  ]);
};

export const notifyPaymentProcessed = async (
  activity: Activity,
  provider: User,
  comments?: string
): Promise<void> => {
  const appUrl = window.location.origin;

  await Promise.all([
    sendEmailNotification({
      type: NotificationType.PaymentProcessed,
      recipientEmail: provider.email,
      recipientName: provider.name,
      activity,
      customMessage: comments,
      metadata: { appUrl }
    }),
    createInAppNotification(
      provider.id,
      NotificationType.PaymentProcessed,
      `Pago procesado`,
      `El pago de la actividad ${activity.orderNumber} ha sido procesado`,
      { activityId: activity.id }
    )
  ]);
};

// ============================================
// NOTIFICATION PREFERENCES
// ============================================

export interface NotificationPreferences {
  email: boolean;
  inApp: boolean;
  activityAssigned: boolean;
  activityApproved: boolean;
  paymentProcessed: boolean;
}

/**
 * Get user notification preferences
 * TODO: Store in Firestore
 */
export const getUserNotificationPreferences = async (userId: string): Promise<NotificationPreferences> => {
  // Default preferences
  return {
    email: true,
    inApp: true,
    activityAssigned: true,
    activityApproved: true,
    paymentProcessed: true
  };
};

/**
 * Update user notification preferences
 */
export const updateNotificationPreferences = async (
  userId: string,
  preferences: Partial<NotificationPreferences>
): Promise<boolean> => {
  try {
    // TODO: Save to Firestore
    console.log('Updating notification preferences for user:', userId, preferences);
    return true;
  } catch (error) {
    console.error('Error updating preferences:', error);
    return false;
  }
};
