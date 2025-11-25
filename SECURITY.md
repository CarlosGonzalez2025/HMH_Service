# Checklist de Seguridad para Producción

## ✅ Variables de Entorno

- [ ] Archivo `.env.production` creado con credenciales de producción
- [ ] Credenciales de Firebase diferentes de desarrollo
- [ ] Variables de entorno NO están hardcodeadas en el código
- [ ] `.gitignore` incluye todos los archivos `.env*`
- [ ] Contraseñas por defecto cambiadas o deshabilitadas

## ✅ Firebase

### Configuración de Autenticación

- [ ] Email/Password authentication habilitado en Firebase Console
- [ ] Reglas de contraseña configuradas (mínimo 8 caracteres)
- [ ] Autenticación de dos factores considerada para admins
- [ ] Dominios autorizados configurados correctamente

### Security Rules (Firestore)

**IMPORTANTE**: Configura las siguientes reglas en Firebase Console > Firestore Database > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isSuperAdmin() {
      return isAuthenticated() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'superAdmin';
    }

    function belongsToTenant(tenantId) {
      return isAuthenticated() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.tenantId == tenantId;
    }

    function isAdmin(tenantId) {
      return belongsToTenant(tenantId) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'superAdmin'];
    }

    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated() &&
                    (request.auth.uid == userId || isSuperAdmin());
      allow write: if isSuperAdmin();
    }

    // Tenants collection
    match /tenants/{tenantId} {
      allow read: if belongsToTenant(tenantId) || isSuperAdmin();
      allow write: if isSuperAdmin();

      // Clients subcollection
      match /clients/{clientId} {
        allow read, write: if belongsToTenant(tenantId);

        // Subclients
        match /subclients/{subclientId} {
          allow read, write: if belongsToTenant(tenantId);

          match /contacts/{contactId} {
            allow read, write: if belongsToTenant(tenantId);
          }
        }

        // Client contacts
        match /contacts/{contactId} {
          allow read, write: if belongsToTenant(tenantId);
        }

        // Client prices
        match /prices/{priceId} {
          allow read, write: if belongsToTenant(tenantId);
        }

        // Consultant rates
        match /consultantRates/{rateId} {
          allow read, write: if belongsToTenant(tenantId);
        }
      }

      // Activity states and types
      match /activityStates/{stateId} {
        allow read, write: if belongsToTenant(tenantId);
      }

      match /activityTypes/{typeId} {
        allow read, write: if belongsToTenant(tenantId);
      }

      // Billing accounts
      match /billingAccounts/{accountId} {
        allow read, write: if belongsToTenant(tenantId);
      }
    }

    // Activities collection
    match /activities/{activityId} {
      allow read: if isAuthenticated() &&
                    (isSuperAdmin() ||
                     belongsToTenant(resource.data.tenantId));
      allow create: if isAuthenticated() && belongsToTenant(request.resource.data.tenantId);
      allow update: if isAuthenticated() && belongsToTenant(resource.data.tenantId);
      allow delete: if isSuperAdmin();

      // Activity subcollections
      match /{subcollection}/{document=**} {
        allow read, write: if isAuthenticated() &&
                             (isSuperAdmin() ||
                              belongsToTenant(get(/databases/$(database)/documents/activities/$(activityId)).data.tenantId));
      }
    }

    // Service orders
    match /serviceOrders/{orderId} {
      allow read, write: if isAuthenticated() &&
                           (isSuperAdmin() ||
                            belongsToTenant(resource.data.tenantId));
    }

    // Default deny all
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Storage Rules (si usas Firebase Storage)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
                     request.resource.size < 5 * 1024 * 1024 && // 5MB max
                     request.resource.contentType.matches('image/.*|application/pdf');
    }
  }
}
```

## ✅ Código

- [ ] No hay credenciales hardcodeadas
- [ ] No hay passwords en el código
- [ ] Console.logs removidos o reemplazados por logging apropiado
- [ ] Manejo de errores implementado
- [ ] Validación de inputs en el frontend
- [ ] Sanitización de datos antes de guardar en Firestore

## ✅ Build y Deployment

- [ ] Build de producción ejecutado sin errores
- [ ] TypeScript compilation sin errores (`npm run lint`)
- [ ] Bundle size revisado (< 1MB inicial)
- [ ] Source maps deshabilitados en producción
- [ ] HTTPS habilitado en el dominio
- [ ] Certificado SSL válido

## ✅ Network

- [ ] CORS configurado correctamente en Firebase
- [ ] Rate limiting considerado
- [ ] API keys con restricciones de dominio en Firebase Console

### Restringir API Keys en Firebase Console

1. Ve a Google Cloud Console
2. APIs & Services > Credentials
3. Selecciona tu API Key
4. Application restrictions > HTTP referrers
5. Agrega tu dominio de producción: `https://tu-dominio.com/*`

## ✅ Monitoreo

- [ ] Firebase Analytics configurado
- [ ] Error tracking implementado (Sentry, LogRocket, etc.)
- [ ] Performance monitoring habilitado
- [ ] Alerts configuradas para errores críticos

## ✅ Backup

- [ ] Backup automático de Firestore habilitado
- [ ] Estrategia de recuperación ante desastres definida

## ✅ Compliance

- [ ] Política de privacidad publicada
- [ ] Términos de servicio publicados
- [ ] GDPR/CCPA compliance (si aplica)
- [ ] Manejo de datos personales documentado

## ⚠️ Vulnerabilidades Conocidas a Resolver

### Críticas (DEBEN ser resueltas antes de producción)

1. ~~Credenciales de Firebase hardcodeadas~~ ✅ CORREGIDO
2. ~~Password por defecto "123456"~~ - Usar variables de entorno
3. Sin rate limiting en operaciones sensibles
4. Sin validación de inputs robusta

### Media (Deberían ser resueltas)

1. Sin logging centralizado
2. Sin monitoring de performance
3. Sin tests automatizados
4. Error handling básico

### Baja (Mejoras futuras)

1. Sin caching strategy
2. Sin lazy loading de componentes
3. Bundle size podría optimizarse más

## 🔄 Procedimiento de Actualización de Seguridad

1. Revisa este checklist antes de cada deployment
2. Actualiza Firebase SDK regularmente: `npm update firebase`
3. Revisa Firebase Security Rules mensualmente
4. Audita usuarios y permisos trimestralmente
5. Rota API keys anualmente

## 📞 En Caso de Incidente de Seguridad

1. Desactiva la aplicación inmediatamente
2. Revisa logs de Firebase Console
3. Cambia todas las credenciales
4. Notifica a usuarios afectados si aplica
5. Documenta el incidente
6. Implementa fixes y redeploy

## 📚 Referencias

- [Firebase Security Best Practices](https://firebase.google.com/docs/rules/best-practices)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Web Security Checklist](https://www.sqreen.com/checklists/saas-cto-security-checklist)
