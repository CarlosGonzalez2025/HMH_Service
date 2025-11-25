# Guía de Implementación de Emails con Firebase

## 📧 Opciones para Enviar Emails

### Opción 1: Firebase Extension - Trigger Email (Más Fácil) ⭐

**Ventajas**: Sin código, configuración simple
**Desventajas**: Requiere plan Blaze de Firebase

#### Pasos:

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Click en **Extensions** en el menú lateral
4. Busca "Trigger Email"
5. Click en **Install**
6. Configura:
   - **SMTP Connection URI**: Tu servidor SMTP (ej: SendGrid, Gmail)
   - **Email Collection**: `mail`
   - **Default FROM**: `noreply@tudominio.com`

#### Uso en el Código:

```typescript
import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

const sendEmail = async (to: string, subject: string, html: string) => {
  await addDoc(collection(db, 'mail'), {
    to,
    message: {
      subject,
      html
    }
  });
};
```

---

### Opción 2: Firebase Functions + SendGrid (Recomendada)

**Ventajas**: Más control, templates avanzados, analytics
**Desventajas**: Requiere configurar Functions

#### Paso 1: Instalar Firebase Functions

```bash
npm install -g firebase-tools
firebase init functions
cd functions
npm install @sendgrid/mail
```

#### Paso 2: Obtener API Key de SendGrid

1. Crea cuenta en [SendGrid](https://sendgrid.com/)
2. Ve a Settings > API Keys
3. Crea nuevo API Key
4. Guarda el key

#### Paso 3: Configurar API Key

```bash
firebase functions:config:set sendgrid.key="TU_API_KEY_AQUI"
```

#### Paso 4: Crear Function (functions/src/index.ts)

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as sgMail from '@sendgrid/mail';

admin.initializeApp();

const SENDGRID_API_KEY = functions.config().sendgrid.key;
sgMail.setApiKey(SENDGRID_API_KEY);

export const sendEmail = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated'
    );
  }

  const { to, subject, html, text } = data;

  const msg = {
    to,
    from: 'noreply@tudominio.com', // Debe estar verificado en SendGrid
    subject,
    text: text || '',
    html: html || text
  };

  try {
    await sgMail.send(msg);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send email');
  }
});
```

#### Paso 5: Deploy

```bash
firebase deploy --only functions
```

#### Paso 6: Usar en tu App

```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const sendEmail = httpsCallable(functions, 'sendEmail');

await sendEmail({
  to: 'usuario@ejemplo.com',
  subject: 'Prueba',
  html: '<h1>Hola mundo</h1>'
});
```

---

### Opción 3: Nodemailer + Gmail (Más Simple)

**Ventajas**: Gratis, fácil de configurar
**Desventajas**: Límites de envío (500/día), menos profesional

#### Configurar Function con Nodemailer

```typescript
import * as nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: 'tu-email@gmail.com',
    pass: 'tu-app-password' // Usar App Password, no tu contraseña normal
  }
});

export const sendEmail = functions.https.onCall(async (data) => {
  const { to, subject, html } = data;

  await transporter.sendMail({
    from: 'tu-email@gmail.com',
    to,
    subject,
    html
  });

  return { success: true };
});
```

---

### Opción 4: Integración Directa con API (Sin Functions)

Si no quieres usar Firebase Functions, puedes integrar directamente desde tu frontend con servicios como:

#### Resend (Moderno, Simple)

```typescript
// Install: npm install resend
import { Resend } from 'resend';

const resend = new Resend('tu_api_key');

await resend.emails.send({
  from: 'onboarding@tudominio.com',
  to: 'usuario@ejemplo.com',
  subject: 'Hola',
  html: '<h1>Funciona!</h1>'
});
```

#### Mailgun

```typescript
const formData = new FormData();
formData.append('from', 'noreply@tudominio.com');
formData.append('to', 'usuario@ejemplo.com');
formData.append('subject', 'Hola');
formData.append('html', '<h1>Test</h1>');

await fetch('https://api.mailgun.net/v3/tudominio.com/messages', {
  method: 'POST',
  headers: {
    'Authorization': 'Basic ' + btoa('api:TU_API_KEY')
  },
  body: formData
});
```

---

## 🎨 Templates de Email con React Email

Para emails más profesionales, usa React Email:

```bash
npm install react-email @react-email/components
```

```tsx
// emails/ActivityAssigned.tsx
import { Html, Button, Container, Heading, Text } from '@react-email/components';

export const ActivityAssignedEmail = ({ activityNumber, clientName }) => (
  <Html>
    <Container>
      <Heading>Nueva Actividad Asignada</Heading>
      <Text>Se te ha asignado la actividad {activityNumber}</Text>
      <Text>Cliente: {clientName}</Text>
      <Button href="https://tu-app.com/activities">
        Ver Actividad
      </Button>
    </Container>
  </Html>
);
```

---

## 📊 Comparación de Opciones

| Opción | Costo | Facilidad | Límites | Recomendado |
|--------|-------|-----------|---------|-------------|
| Firebase Extension | $0.01/email | ⭐⭐⭐⭐⭐ | Ilimitado | Prototipos |
| SendGrid | Gratis hasta 100/día | ⭐⭐⭐⭐ | 100/día gratis | **Producción** ⭐ |
| Nodemailer + Gmail | Gratis | ⭐⭐⭐ | 500/día | Desarrollo |
| Resend | $20/mes (20k) | ⭐⭐⭐⭐⭐ | 100/día gratis | Startups |
| Mailgun | $35/mes (50k) | ⭐⭐⭐⭐ | Pay as you go | Enterprise |

---

## ✅ Recomendación para HMH

**Para Producción**: Firebase Functions + SendGrid
- Profesional
- Escalable
- Good analytics
- Templates avanzados

**Pasos Inmediatos**:
1. Crear cuenta SendGrid (plan gratuito: 100 emails/día)
2. Configurar Firebase Functions
3. Implementar la function `sendEmail`
4. Actualizar `utils/notifications.ts` para usar la function

---

## 🔒 Seguridad

⚠️ **NUNCA expongas API keys en el frontend**

✅ **Correcto**:
```typescript
// En Firebase Functions (backend)
const apiKey = functions.config().sendgrid.key;
```

❌ **Incorrecto**:
```typescript
// En el frontend
const apiKey = "SG.xxxxx"; // ¡NO HACER ESTO!
```

---

## 📝 Siguiente Paso

Elige una opción y actualiza `utils/notifications.ts`:

```typescript
// Replace this:
console.log('📧 EMAIL NOTIFICATION:');

// With this:
const sendEmail = httpsCallable(functions, 'sendEmail');
await sendEmail({ to, subject, body });
```
