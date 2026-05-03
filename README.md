# OrigenRP — Panel Staff

Panel de staff para el servidor FiveM OrigenRP con consultor de sanciones IA.

## Estructura del proyecto

```
origenrp/
├── api/
│   └── consultar.js     ← Función serverless (la API key vive aquí, privada)
├── public/
│   └── index.html       ← Frontend estático
└── vercel.json          ← Configuración de Vercel
```

## Despliegue en Vercel (gratis)

### 1. Obtener API key de Google Gemini (gratis)

1. Ve a https://aistudio.google.com/app/apikey
2. Crea o inicia sesión con tu cuenta Google
3. Haz clic en **"Create API Key"**
4. Copia la key generada (empieza por `AIza...`)

> El plan gratuito incluye 15 rpm y 1.500.000 tokens/día con Gemini 2.0 Flash.

---

### 2. Subir el proyecto a GitHub

1. Crea un repo en https://github.com/new (puede ser privado)
2. Sube la carpeta `origenrp/` completa:

```bash
cd origenrp
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TU_USUARIO/origenrp.git
git push -u origin main
```

---

### 3. Desplegar en Vercel

1. Ve a https://vercel.com y crea cuenta (gratis con GitHub)
2. Haz clic en **"Add New Project"**
3. Importa tu repositorio de GitHub
4. En la configuración del proyecto:
   - **Framework Preset**: Other
   - **Root Directory**: `/` (la raíz del repo)
5. Haz clic en **"Environment Variables"** y añade:
   - **Name**: `GOOGLE_API_KEY`
   - **Value**: `AIzaSy...` (tu key de Gemini)
6. Haz clic en **"Deploy"**

¡Listo! Vercel te dará una URL como `https://origenrp.vercel.app`

---

### 4. Actualizaciones futuras

Cada vez que hagas `git push` al repo, Vercel redespliegue automáticamente.

---

## Cómo funciona la seguridad

```
Navegador (staff)
      │
      │  POST /api/consultar
      │  { "situacion": "..." }
      ▼
Vercel Serverless Function (api/consultar.js)
      │  ← API key guardada en variables de entorno de Vercel
      │  Solo el servidor la conoce, nunca llega al navegador
      │
      │  POST https://generativelanguage.googleapis.com/...?key=SECRET
      ▼
Google Gemini API
      │
      │  { "text": "VEREDICTO: ..." }
      ▼
Vercel → Navegador
```

La API key **nunca aparece en el código del frontend** ni en el HTML que reciben los usuarios.
