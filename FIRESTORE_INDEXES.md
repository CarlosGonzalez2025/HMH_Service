# Índices de Firestore para HMH System

## 📊 Índices Compuestos Requeridos

Estos índices mejoran significativamente el performance de las consultas más frecuentes del sistema.

### Cómo Aplicar los Índices

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Click en **Firestore Database**
4. Click en la pestaña **Indexes**
5. Click en **Create Index** y agrega cada uno de los índices de abajo

---

## 1. Activities - Por Tenant y Estado

**Colección**: `activities`

| Campo | Orden |
|-------|-------|
| `tenantId` | Ascending |
| `status` | Ascending |
| `requestDate` | Descending |

**Propósito**: Listar actividades de un tenant filtradas por estado, ordenadas por fecha de solicitud.

**Consulta optimizada**:
```javascript
query(
  collection(db, 'activities'),
  where('tenantId', '==', tenantId),
  where('status', '==', 'pending_assignment'),
  orderBy('requestDate', 'desc')
)
```

---

## 2. Activities - Por Proveedor y Estado

**Colección**: `activities`

| Campo | Orden |
|-------|-------|
| `assignedProviderId` | Ascending |
| `status` | Ascending |
| `requestDate` | Descending |

**Propósito**: Ver actividades asignadas a un consultor específico.

**Consulta optimizada**:
```javascript
query(
  collection(db, 'activities'),
  where('assignedProviderId', '==', providerId),
  where('status', 'in', ['in_execution', 'finalized']),
  orderBy('requestDate', 'desc')
)
```

---

## 3. Activities - Por Cliente y Estado

**Colección**: `activities`

| Campo | Orden |
|-------|-------|
| `tenantId` | Ascending |
| `clientId` | Ascending |
| `status` | Ascending |
| `requestDate` | Descending |

**Propósito**: Reportes de actividades por cliente.

**Consulta optimizada**:
```javascript
query(
  collection(db, 'activities'),
  where('tenantId', '==', tenantId),
  where('clientId', '==', clientId),
  orderBy('status', 'asc'),
  orderBy('requestDate', 'desc')
)
```

---

## 4. Users - Por Tenant y Rol

**Colección**: `users`

| Campo | Orden |
|-------|-------|
| `tenantId` | Ascending |
| `role` | Ascending |
| `status` | Ascending |
| `name` | Ascending |

**Propósito**: Listar usuarios por rol (coordinadores, consultores, etc.).

**Consulta optimizada**:
```javascript
query(
  collection(db, 'users'),
  where('tenantId', '==', tenantId),
  where('role', '==', 'provider'),
  where('status', '==', 'active'),
  orderBy('name', 'asc')
)
```

---

## 5. Activity Logs - Por Actividad y Fecha

**Colección**: `activities/{activityId}/logs`

| Campo | Orden |
|-------|-------|
| `activityId` | Ascending |
| `date` | Descending |

**Propósito**: Bitácora ordenada por fecha.

**Consulta optimizada**:
```javascript
query(
  collection(db, `activities/${activityId}/logs`),
  orderBy('date', 'desc')
)
```

---

## 6. Billing Accounts - Por Proveedor

**Colección**: `tenants/{tenantId}/billingAccounts`

| Campo | Orden |
|-------|-------|
| `providerId` | Ascending |
| `status` | Ascending |
| `date` | Descending |

**Propósito**: Ver cuentas de cobro de un consultor.

**Consulta optimizada**:
```javascript
query(
  collection(db, `tenants/${tenantId}/billingAccounts`),
  where('providerId', '==', providerId),
  where('status', '==', 'pending'),
  orderBy('date', 'desc')
)
```

---

## 7. Clients - Por Tenant

**Colección**: `tenants/{tenantId}/clients`

| Campo | Orden |
|-------|-------|
| `tenantId` | Ascending |
| `name` | Ascending |

**Propósito**: Listar clientes alfabéticamente.

---

## 📝 Archivo firestore.indexes.json

También puedes crear un archivo `firestore.indexes.json` en la raíz del proyecto y desplegarlo con Firebase CLI:

```json
{
  "indexes": [
    {
      "collectionGroup": "activities",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tenantId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "requestDate", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "activities",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "assignedProviderId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "requestDate", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "activities",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tenantId", "order": "ASCENDING" },
        { "fieldPath": "clientId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "requestDate", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tenantId", "order": "ASCENDING" },
        { "fieldPath": "role", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "name", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "logs",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "activityId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "billingAccounts",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "providerId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

### Deploy con Firebase CLI:

```bash
firebase deploy --only firestore:indexes
```

---

## ⚡ Performance Tips

1. **Usa límites**: Siempre usa `limit()` en consultas que puedan retornar muchos documentos
2. **Paginación**: Implementa paginación con `startAfter()` para grandes listas
3. **Cache local**: Firestore cachea automáticamente, pero puedes configurarlo
4. **Evita consultas de array-contains**: Son más lentas que consultas simples

---

## 🔍 Monitoreo

Verifica el uso de índices en:
- Firebase Console > Firestore > Usage tab
- Busca "Missing Index" errors en los logs

---

## ✅ Checklist de Índices

- [ ] Índice 1: tenantId + status + requestDate
- [ ] Índice 2: assignedProviderId + status + requestDate
- [ ] Índice 3: tenantId + clientId + status + requestDate
- [ ] Índice 4: tenantId + role + status + name
- [ ] Índice 5: activityId + date (logs)
- [ ] Índice 6: providerId + status + date (billing)
- [ ] Verificar que todas las consultas funcionan sin errores
