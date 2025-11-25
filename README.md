<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# SaaS HMH - Enterprise Safety Management

Sistema de gestión empresarial para control de actividades, clientes, equipos y facturación.

## 🚀 Características

- 🔐 Autenticación segura con Firebase
- 👥 Gestión multi-tenant
- 📊 Dashboard con métricas en tiempo real
- 📝 Gestión de órdenes y actividades
- 💰 Control de facturación
- 👨‍💼 Gestión de clientes y subclientes
- 📈 Reportes y análisis

## 📋 Pre-requisitos

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- Cuenta de **Firebase** con proyecto configurado

## 🛠️ Instalación Local

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd HMH_Service
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto basándote en `.env.example`:

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales de Firebase:

```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto_id
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_messaging_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
```

**Importante**: Obtén estas credenciales desde [Firebase Console](https://console.firebase.google.com/)

### 4. Ejecutar en modo desarrollo

```bash
npm run dev
```

La aplicación estará disponible en http://localhost:3000

## 📦 Build para Producción

```bash
npm run build:prod
```

Los archivos optimizados se generarán en la carpeta `dist/`.

### Verificar el build localmente

```bash
npm run serve
```

## 🚢 Deployment

Ver la [Guía de Deployment](./DEPLOYMENT.md) completa para instrucciones detalladas de deployment en:

- Firebase Hosting
- Vercel
- Netlify
- Servidor propio (Nginx/Apache)

## 🔒 Seguridad

⚠️ **IMPORTANTE**:

1. **NUNCA** commitees archivos `.env*` al repositorio
2. Las credenciales de Firebase deben ser diferentes para desarrollo y producción
3. Configura Firebase Security Rules apropiadas
4. Usa HTTPS en producción
5. Cambia las contraseñas por defecto

## 🏗️ Estructura del Proyecto

```
HMH_Service/
├── components/          # Componentes reutilizables
├── pages/              # Páginas de la aplicación
├── context/            # React Context (Auth, Toast)
├── services/           # Servicios de datos (Firebase)
├── types.ts            # Definiciones TypeScript
├── constants.ts        # Constantes de la aplicación
├── firebaseConfig.ts   # Configuración de Firebase
├── App.tsx             # Componente principal
└── index.tsx           # Punto de entrada
```

## 🧪 Scripts Disponibles

- `npm run dev` - Inicia servidor de desarrollo
- `npm run build` - Build de producción con TypeScript check
- `npm run build:prod` - Build optimizado para producción
- `npm run preview` - Preview del build
- `npm run lint` - Verificar tipos TypeScript
- `npm run serve` - Servir build de producción localmente

## 🔧 Tecnologías

- **React** 18.2.0
- **TypeScript** 5.8.2
- **Vite** 6.2.0
- **Firebase** 12.6.0
- **React Router** 6.22.3
- **Recharts** 2.12.3
- **Lucide React** (iconos)
- **Tailwind CSS**

## 📝 Roles de Usuario

- **Super Admin**: Gestión global de tenants
- **Admin**: Administración del tenant
- **Coordinator**: Coordinación de actividades
- **Analyst**: Análisis y creación de actividades
- **Accountant**: Gestión de facturación
- **Provider**: Consultor/Proveedor de servicios

## 🆘 Soporte

Para problemas o preguntas:

- Revisa la documentación de [Firebase](https://firebase.google.com/docs)
- Consulta la [Guía de Deployment](./DEPLOYMENT.md)
- Verifica las [Vite Docs](https://vitejs.dev/)

## 📄 Licencia

Privado - Todos los derechos reservados
