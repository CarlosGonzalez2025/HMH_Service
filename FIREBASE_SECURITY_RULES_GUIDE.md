# 🔐 Guía de Firebase Security Rules

**Proyecto**: HMH Service SaaS Platform
**Fecha**: 2025-11-25
**Versión**: 1.0 - Production Ready

---

## 📋 Tabla de Contenidos

1. [¿Qué son las Firebase Security Rules?](#qué-son-las-firebase-security-rules)
2. [¿Por qué son necesarias?](#por-qué-son-necesarias)
3. [Cómo aplicar las reglas](#cómo-aplicar-las-reglas)
4. [Estructura de permisos por rol](#estructura-de-permisos-por-rol)
5. [Colecciones protegidas](#colecciones-protegidas)
6. [Validación y testing](#validación-y-testing)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 ¿Qué son las Firebase Security Rules?

Las **Firebase Security Rules** son reglas de seguridad que se ejecutan en el servidor de Firebase para:
- ✅ Proteger tus datos en Firestore
- ✅ Controlar quién puede leer/escribir cada documento
- ✅ Validar la estructura de los datos
- ✅ Prevenir accesos no autorizados

**IMPORTANTE**: Sin estas reglas, tu base de datos estaría completamente abierta o completamente cerrada.

---

## ⚠️ ¿Por qué son necesarias?

### Antes de aplicar las reglas:
- ❌ Cualquier usuario podría ver datos de otros tenants
- ❌ Un provider podría modificar actividades de otros providers
- ❌ Un contador podría crear usuarios
- ❌ Cualquiera podría modificar tarifas y precios
- ❌ No hay separación real entre tenants

### Después de aplicar las reglas:
- ✅ Cada tenant solo ve sus propios datos
- ✅ Los roles tienen permisos específicos
- ✅ SuperAdmin tiene acceso global controlado
- ✅ Protección contra modificaciones no autorizadas
- ✅ Historial (logs, approvals) es inmutable

---

## 🚀 Cómo Aplicar las Reglas

### **Opción 1: Firebase Console (Interfaz Web) - RECOMENDADO**

1. **Accede a Firebase Console**
   - Ve a: https://console.firebase.google.com
   - Selecciona tu proyecto

2. **Navega a Firestore Database**
   - En el menú lateral: **Firestore Database**
   - Haz clic en la pestaña **"Reglas"** (Rules)

3. **Copia y pega las reglas**
   - Abre el archivo `firestore.rules` de este proyecto
   - Copia TODO el contenido
   - Pégalo en el editor de reglas de Firebase Console

4. **Publica las reglas**
   - Haz clic en **"Publicar"** (Publish)
   - Confirma que quieres actualizar las reglas
   - ⏱️ Las reglas se aplican en ~30 segundos

### **Opción 2: Firebase CLI (Línea de Comandos)**

```bash
# 1. Asegúrate de tener Firebase CLI instalado
npm install -g firebase-tools

# 2. Inicia sesión en Firebase
firebase login

# 3. Inicializa el proyecto (si no lo has hecho)
firebase init firestore
# Selecciona:
# - Use an existing project
# - Firestore Rules: firestore.rules
# - Firestore Indexes: firestore.indexes.json

# 4. Despliega SOLO las reglas
firebase deploy --only firestore:rules

# O despliega reglas + índices
firebase deploy --only firestore
```

---

## 🎭 Estructura de Permisos por Rol

### **SuperAdmin** 🔴
**Acceso**: Global - Todos los tenants

| Acción | Tenants | Users | Activities | Clients | Billing |
|--------|---------|-------|------------|---------|---------|
| Leer   | ✅ Todos | ✅ Todos | ✅ Todos | ✅ Todos | ✅ Todos |
| Crear  | ✅ | ✅ | ✅ | ✅ | ✅ |
| Modificar | ✅ | ✅ | ✅ | ✅ | ✅ |
| Eliminar | ✅ | ✅ | ✅ | ✅ | ✅ |

**Propósito**: Gestión completa de la plataforma SaaS.

---

### **Admin** (Administrador de Tenant) 🟣
**Acceso**: Solo su tenant

| Acción | Tenants | Users | Activities | Clients | Billing |
|--------|---------|-------|------------|---------|---------|
| Leer   | ✅ Propio | ✅ Tenant | ✅ Tenant | ✅ Tenant | ✅ Tenant |
| Crear  | ❌ | ✅ Tenant | ✅ | ✅ | ❌ |
| Modificar | ❌ | ✅ Tenant | ✅ | ✅ | ✅ |
| Eliminar | ❌ | ❌ | ✅ | ✅ | ❌ |

**Propósito**: Gestión completa del tenant (empresa).

---

### **Coordinator** (Coordinador) 🔵
**Acceso**: Solo su tenant

| Acción | Tenants | Users | Activities | Clients | Billing |
|--------|---------|-------|------------|---------|---------|
| Leer   | ✅ Propio | ✅ Tenant | ✅ Tenant | ✅ Tenant | ✅ Tenant |
| Crear  | ❌ | ✅ Tenant | ✅ | ✅ | ❌ |
| Modificar | ❌ | ✅ Tenant | ✅ | ✅ | ❌ |
| Eliminar | ❌ | ❌ | ✅ | ✅ | ❌ |

**Propósito**: Coordinación de actividades y equipo.

---

### **Analyst** (Analista de Operaciones) 🟠
**Acceso**: Solo su tenant

| Acción | Tenants | Users | Activities | Clients | Billing |
|--------|---------|-------|------------|---------|---------|
| Leer   | ✅ Propio | ✅ Tenant | ✅ Tenant | ✅ Tenant | ❌ |
| Crear  | ❌ | ❌ | ✅ | ✅ | ❌ |
| Modificar | ❌ | ❌ | ⚠️ Limitado | ⚠️ Contactos | ❌ |
| Eliminar | ❌ | ❌ | ❌ | ❌ | ❌ |

**Propósito**: Creación de actividades y gestión de clientes.

---

### **Accountant** (Contador) 🟢
**Acceso**: Solo su tenant

| Acción | Tenants | Users | Activities | Clients | Billing |
|--------|---------|-------|------------|---------|---------|
| Leer   | ✅ Propio | ✅ Tenant | ✅ Tenant | ✅ Tenant | ✅ Tenant |
| Crear  | ❌ | ❌ | ❌ | ❌ | ❌ |
| Modificar | ❌ | ❌ | ⚠️ Pagos | ❌ | ✅ |
| Eliminar | ❌ | ❌ | ❌ | ❌ | ❌ |

**Propósito**: Gestión financiera y pagos.

---

### **Provider** (Proveedor/Consultor) 🟡
**Acceso**: Solo actividades asignadas a él

| Acción | Tenants | Users | Activities | Clients | Billing |
|--------|---------|-------|------------|---------|---------|
| Leer   | ✅ Propio | ✅ Perfil | ⚠️ Asignadas | ⚠️ Relacionados | ⚠️ Propias |
| Crear  | ❌ | ❌ | ❌ | ❌ | ✅ Cuentas cobro |
| Modificar | ❌ | ⚠️ Perfil | ⚠️ Status | ❌ | ❌ |
| Eliminar | ❌ | ❌ | ❌ | ❌ | ❌ |

**Propósito**: Ejecución de actividades asignadas.

---

## 🗂️ Colecciones Protegidas

### 1. **Colección: `tenants`**

```javascript
// LECTURA
✅ SuperAdmin → Todos los tenants
✅ Usuario del tenant → Solo su tenant

// ESCRITURA
✅ SuperAdmin → Crear/Modificar/Eliminar tenants
❌ Todos los demás → No pueden modificar tenants
```

**Subcollecciones**:
- `/tenants/{tenantId}/clients` - Clientes
- `/tenants/{tenantId}/activityStates` - Maestros de estados
- `/tenants/{tenantId}/activityTypes` - Maestros de tipos
- `/tenants/{tenantId}/billingAccounts` - Cuentas de cobro

---

### 2. **Colección: `users`**

```javascript
// LECTURA
✅ SuperAdmin → Todos los usuarios
✅ Admin/Coordinator → Usuarios de su tenant
✅ Cualquier usuario → Su propio perfil

// ESCRITURA (Crear)
✅ SuperAdmin → Crear cualquier usuario
✅ Admin/Coordinator → Crear usuarios en su tenant

// ESCRITURA (Modificar)
✅ SuperAdmin → Modificar cualquier usuario
✅ Admin/Coordinator → Modificar usuarios de su tenant
✅ Usuario → Modificar su propio perfil (sin cambiar rol/tenant)
```

**Campos protegidos**: `role`, `tenantId` (no modificables por el usuario)

---

### 3. **Colección: `activities`**

```javascript
// LECTURA
✅ SuperAdmin → Todas las actividades
✅ Usuarios del tenant → Todas las del tenant
✅ Provider → Solo las asignadas a él

// ESCRITURA (Crear)
✅ Analyst/Coordinator/Admin → Crear actividades en su tenant

// ESCRITURA (Modificar)
✅ Admin/Coordinator → Modificar cualquier actividad del tenant
✅ Provider asignado → Modificar status, progress, supports
✅ Accountant → Modificar campos de pago

// ESCRITURA (Eliminar)
✅ Admin/Coordinator → Eliminar actividades del tenant
```

**Subcollecciones**:
- `/activities/{activityId}/logs` - Bitácora (inmutable)
- `/activities/{activityId}/assignments` - Asignaciones
- `/activities/{activityId}/approvals` - Aprobaciones (inmutable)

---

### 4. **Colección: `serviceOrders`**

```javascript
// LECTURA
✅ SuperAdmin → Todas las órdenes
✅ Usuarios del tenant → Órdenes de su tenant

// ESCRITURA (Crear)
✅ Coordinator/Admin → Crear órdenes en su tenant

// ESCRITURA (Modificar)
✅ Coordinator/Admin/Accountant → Modificar órdenes del tenant
```

---

## 🧪 Validación y Testing

### **1. Test en Firebase Console**

Firebase Console incluye un **Simulador de Reglas**:

1. Ve a **Firestore Database → Reglas**
2. Haz clic en **"Simulador de reglas"**
3. Configura:
   - **Tipo**: `get`, `create`, `update`, `delete`
   - **Ubicación**: `/users/userId123`
   - **Usuario autenticado**: `uid: userId123`
   - **Datos del documento**: Simula el documento

**Ejemplo de test**:
```
Tipo: get
Ubicación: /activities/act123
Usuario: uid: provider456
Resultado esperado: ✅ Permitido (si act123.assignedProviderId === 'provider456')
```

---

### **2. Test Manual en la Aplicación**

**Prueba 1: Provider intenta ver actividades de otro**
```javascript
// Iniciar sesión como Provider A
// Intentar acceder a actividad asignada a Provider B
// Resultado esperado: ❌ Error de permisos
```

**Prueba 2: Admin crea usuario en su tenant**
```javascript
// Iniciar sesión como Admin de tenant X
// Crear usuario en tenant X
// Resultado esperado: ✅ Usuario creado
```

**Prueba 3: Coordinator intenta modificar otro tenant**
```javascript
// Iniciar sesión como Coordinator de tenant X
// Intentar modificar datos de tenant Y
// Resultado esperado: ❌ Error de permisos
```

---

### **3. Tests Recomendados**

| Test | Usuario | Acción | Resultado Esperado |
|------|---------|--------|-------------------|
| 1 | SuperAdmin | Leer todos los tenants | ✅ Permitido |
| 2 | Admin Tenant A | Leer datos de Tenant B | ❌ Denegado |
| 3 | Provider | Modificar actividad NO asignada | ❌ Denegado |
| 4 | Provider | Modificar actividad asignada | ✅ Permitido |
| 5 | Analyst | Crear actividad | ✅ Permitido |
| 6 | Analyst | Eliminar actividad | ❌ Denegado |
| 7 | Accountant | Crear cliente | ❌ Denegado |
| 8 | Coordinator | Crear usuario | ✅ Permitido |
| 9 | Provider | Ver logs de su actividad | ✅ Permitido |
| 10 | Provider | Modificar log | ❌ Denegado (inmutable) |

---

## 🔧 Troubleshooting

### **Error: "Missing or insufficient permissions"**

**Causa**: El usuario no tiene permisos para la operación.

**Solución**:
1. Verifica que el usuario tenga el rol correcto en Firestore
2. Verifica que `getUserData().role` retorne el rol esperado
3. Revisa la consola de Firebase para ver qué regla falló

**Debug**:
```javascript
// En tu código JavaScript
db.collection('activities').doc('activityId').get()
  .then(doc => console.log(doc.data()))
  .catch(err => console.error('Error de permisos:', err));
```

---

### **Error: "Property role is undefined"**

**Causa**: El documento del usuario no tiene el campo `role`.

**Solución**:
1. Verifica que todos los usuarios en `/users` tengan el campo `role`
2. Ejecuta este script para verificar:

```javascript
// Script de verificación
const users = await db.collection('users').get();
users.forEach(user => {
  const data = user.data();
  if (!data.role) {
    console.error(`Usuario ${user.id} no tiene rol:`, data);
  }
});
```

---

### **Error: Las reglas no se aplican**

**Causa**: Las reglas pueden tardar hasta 1 minuto en propagarse.

**Solución**:
1. Espera 1-2 minutos después de publicar
2. Refresca la aplicación (Ctrl+Shift+R)
3. Cierra sesión y vuelve a iniciar sesión
4. Verifica que las reglas se hayan publicado correctamente en Firebase Console

---

### **Provider no puede ver sus actividades**

**Causa**: El campo `assignedProviderId` no coincide con el UID del usuario.

**Solución**:
1. Verifica que al asignar una actividad, `assignedProviderId` sea el UID del Firebase Auth (no el ID del documento)
2. Ejecuta este script:

```javascript
// Script de verificación
const provider = auth.currentUser; // UID: abc123
const activity = await db.collection('activities').doc('actId').get();
console.log('Provider UID:', provider.uid);
console.log('Activity assignedProviderId:', activity.data().assignedProviderId);
// Deben coincidir
```

---

## 📊 Impacto de las Reglas

### **Antes de aplicar** (Base de datos abierta o cerrada):
- 🔴 **Seguridad**: CRÍTICA - Datos expuestos
- 🔴 **Multi-tenant**: NO funciona - Aislamiento nulo
- 🔴 **Roles**: NO funcionan - Sin enforcement

### **Después de aplicar**:
- 🟢 **Seguridad**: ALTA - Datos protegidos
- 🟢 **Multi-tenant**: FUNCIONA - Aislamiento total
- 🟢 **Roles**: FUNCIONAN - Enforcement completo

---

## 🚨 Reglas de Oro

1. **NUNCA** uses `allow read, write: if true` en producción
2. **SIEMPRE** especifica el tenant en las operaciones
3. **VERIFICA** los roles en el cliente Y en las reglas
4. **NO CONFÍES** en la validación del cliente solamente
5. **TESTEA** las reglas antes de desplegar a producción

---

## 📝 Checklist de Despliegue

Antes de ir a producción:

- [ ] Reglas aplicadas en Firebase Console
- [ ] Indices de Firestore desplegados (`firestore.indexes.json`)
- [ ] Todos los usuarios tienen campo `role`
- [ ] Todos los usuarios tienen campo `tenantId` (excepto superAdmin)
- [ ] Testeo manual de 10 escenarios completado
- [ ] Verificación de logs en Firebase Console (sin errores de permisos)
- [ ] Variables de entorno configuradas (`.env`)
- [ ] Build de producción generado (`npm run build`)

---

## 🎯 Resumen Ejecutivo

**¿Qué hacen las reglas?**
- Protegen los datos en Firestore
- Implementan el control de acceso basado en roles (RBAC)
- Garantizan el aislamiento entre tenants (multi-tenant)
- Previenen modificaciones no autorizadas

**¿Cómo aplicarlas?**
1. Copia `firestore.rules` en Firebase Console → Firestore → Reglas
2. Haz clic en "Publicar"
3. Espera 1 minuto
4. Testea la aplicación

**¿Qué pasa si no las aplico?**
- ❌ Cualquier usuario podría acceder a datos de otros tenants
- ❌ Los botones de la UI no tendrían enforcement real
- ❌ Riesgo de seguridad CRÍTICO
- ❌ Incumplimiento de normativas de protección de datos

---

## 📚 Recursos Adicionales

- [Documentación oficial de Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Guía de testing de reglas](https://firebase.google.com/docs/rules/unit-tests)
- [Ejemplos de reglas complejas](https://firebase.google.com/docs/firestore/security/rules-conditions)

---

**Última actualización**: 2025-11-25
**Autor**: Claude Code - Production Ready Validation
**Versión de reglas**: 1.0
