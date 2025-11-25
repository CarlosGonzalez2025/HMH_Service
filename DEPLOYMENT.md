# Guía de Deployment para Producción

## Pre-requisitos

1. **Node.js**: >= 18.0.0
2. **npm**: >= 9.0.0
3. **Cuenta de Firebase** con proyecto configurado
4. **Variables de entorno** configuradas

## Pasos para Deployment

### 1. Configuración de Variables de Entorno

Crea un archivo `.env.production` en la raíz del proyecto:

```bash
cp .env.example .env.production
```

Edita `.env.production` con tus credenciales de Firebase de producción:

```env
VITE_FIREBASE_API_KEY=tu_api_key_de_produccion
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto_id
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_messaging_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
```

⚠️ **IMPORTANTE**: NUNCA commitees archivos `.env` al repositorio.

### 2. Instalar Dependencias

```bash
npm ci  # Usa npm ci en lugar de npm install para producción
```

### 3. Build de Producción

```bash
npm run build:prod
```

Esto generará los archivos optimizados en la carpeta `dist/`.

### 4. Verificar el Build Localmente

```bash
npm run serve
```

Abre http://localhost:3000 para verificar que todo funciona correctamente.

### 5. Deployment Options

#### Opción A: Firebase Hosting

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Inicializar (solo primera vez)
firebase init hosting

# Deploy
firebase deploy --only hosting
```

Configuración recomendada en `firebase.json`:
```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

#### Opción B: Vercel

```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

#### Opción C: Netlify

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

Crea un archivo `netlify.toml`:
```toml
[build]
  command = "npm run build:prod"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### Opción D: Servidor Propio (Nginx/Apache)

1. Copia los archivos de `dist/` a tu servidor web
2. Configura el servidor para servir el archivo index.html para todas las rutas

**Nginx example:**
```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    root /var/www/hmh-service/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Checklist de Seguridad Pre-Deployment

- [ ] Variables de entorno configuradas en `.env.production`
- [ ] Credenciales de Firebase actualizadas (no usar las de desarrollo)
- [ ] `.gitignore` incluye archivos `.env*`
- [ ] Contraseñas por defecto cambiadas
- [ ] Firebase Security Rules configuradas
- [ ] HTTPS habilitado en el dominio
- [ ] CORS configurado correctamente en Firebase
- [ ] Build de producción ejecutado sin errores
- [ ] Pruebas manuales completadas en entorno de staging

## Monitoreo Post-Deployment

1. **Firebase Console**: Monitorea autenticación y Firestore
2. **Analytics**: Configura Firebase Analytics o Google Analytics
3. **Error Tracking**: Considera Sentry o similar
4. **Performance**: Firebase Performance Monitoring

## Rollback

Si necesitas hacer rollback:

### Firebase Hosting
```bash
firebase hosting:clone SOURCE_SITE_ID:SOURCE_CHANNEL_ID TARGET_SITE_ID:live
```

### Vercel/Netlify
Usa la interfaz web para revertir a un deployment anterior.

## Soporte

Para problemas, consulta:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Vite Production Build](https://vitejs.dev/guide/build.html)
