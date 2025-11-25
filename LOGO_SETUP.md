# Instrucciones para Agregar el Logo

## Paso 1: Descargar el Logo

1. Abre este enlace en tu navegador:
   https://i.postimg.cc/NMShcK2W/Logo-HMH.png

2. Haz click derecho en la imagen > "Guardar imagen como..."

3. Guárdala con el nombre **`logo.png`**

## Paso 2: Colocar el Logo en el Proyecto

Copia el archivo `logo.png` que descargaste en la carpeta:

```
HMH_Service/public/logo.png
```

Si la carpeta `public` no existe, créala en la raíz del proyecto.

## Estructura Esperada

```
HMH_Service/
├── public/
│   └── logo.png          ← Coloca aquí el logo descargado
├── pages/
├── components/
├── package.json
└── ...
```

## Verificación

Una vez que hayas colocado el logo:

1. Si el servidor está corriendo, reinícialo:
   ```bash
   # Presiona Ctrl+C para detener
   npm run dev
   ```

2. Abre http://localhost:3000/login

3. Deberías ver:
   - ✅ El logo de HMH en la página de login
   - ✅ El logo como favicon en la pestaña del navegador

## Troubleshooting

Si no ves el logo:
- Verifica que el archivo se llame exactamente `logo.png` (minúsculas)
- Verifica que esté en la carpeta `public/`
- Refresca el navegador con Ctrl+F5 (hard refresh)
- Limpia la caché del navegador

Si sigue sin funcionar, verás un ícono azul con un escudo como fallback.
