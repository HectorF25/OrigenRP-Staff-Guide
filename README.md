# OrigenRP — Panel Staff

Panel de staff para el servidor FiveM OrigenRP con consultor de sanciones IA.

---

## Autor

Desarrollado íntegramente por **Hector Jesid Florez Macias** ([@hectorflorez25](mailto:hectorflorez25@gmail.com)).

Este proyecto fue diseñado, programado y mantenido por el autor desde cero.
Si usas o adaptas este código, se agradece mantener esta atribución.
Consulta el archivo [LICENSE](./LICENSE) para más detalles.

---

## Estructura del proyecto

```
origenrp/
app/
├── page.jsx
├── layout.jsx
├── globals.css
├── components/
│   ├── AuthGate.jsx
│   ├── Sidebar.jsx
│   ├── Topbar.jsx
│   └── Lucide.jsx
├── hooks/
│   └── useAuth.js
└── sections/                
    ├── ConsultorIA.jsx
    ├── Comandos.jsx
    ├── BotTickets.jsx
    ├── ItemsArmas.jsx
    ├── Sanciones.jsx
    ├── OcMafias.jsx
    ├── Ilegales.jsx
    ├── Robos.jsx
    ├── NormaStaff.jsx
    ├── Conceptos.jsx
    ├── Casos.jsx
    ├── Flashcards.jsx
    ├── NormativaCompleta.jsx
    └── Logs.jsx
lib/
├── constants.js             
└── ...
```

## Despliegue en Vercel (gratis)

### 1. Obtener API key de Google Gemini (gratis)

1. Ve a https://aistudio.google.com/app/apikey
2. Crea o inicia sesión con tu cuenta Google
3. Haz clic en **"Create API Key"**
4. Copia la key generada (empieza por `AIza...`)

> El plan gratuito incluye 15 rpm y 1.500.000 tokens/día con Gemini 2.0 Flash.

---

### 2. Actualizaciones futuras

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
