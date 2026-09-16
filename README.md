# Diagrama de Guardia · JirafaWeb

PWA para gestionar el diagrama de guardias rotativas

🔗 **Producción:** https://diagramaguardia.vercel.app/

## Qué hace

- Muestra el diagrama mensual/semanal/anual de las 5 guardias rotativas (A a E), con ciclo de 30 días entre 4 turnos de 6 horas (T1–T4) y francos.
- Tarjeta "Hoy" con el turno actual, el turno del día siguiente, el próximo relevante y los días seguidos trabajados.
- Gestión de licencias: V, DC, PG, PA, CT, MA, NA, AD, MU, MH, LM, LS, LP, DP.
- Feriados y recargos por turno/feriado.
- Panel de administración: altas/bajas de usuarios, edición de turnos y licencias, y registro de accesos (usuario, ubicación, dispositivo, horario).
- Horario de combi (lunes a viernes, sábados, domingos/feriados).
- Exportación del diagrama a `.ics` para importar en Google Calendar / Apple Calendar / Outlook.
- Notificaciones push (vía Service Worker) para avisos de licencias.
- Instalable como PWA (funciona offline con Service Worker, estrategia network-first con caché de respaldo).

## Stack técnico

- **Frontend:** un único `index.html` con HTML + CSS + JavaScript inline. Sin build step ni bundler.
- **Reactividad de UI:** [Vue 3](https://vuejs.org/) (build global desde CDN, sin compilación).
- **Backend/datos:** [Firebase Firestore](https://firebase.google.com/docs/firestore) (SDK modular v10, importado desde CDN). Sincronización en tiempo real vía `onSnapshot`, con persistencia offline (`enableIndexedDbPersistence`).
- **PWA:** `manifest.json` + `sw.js` (Service Worker propio, sin librerías externas).
- **Deploy:** [Vercel](https://vercel.com/) (estático, sin servidor propio).

## Estructura del repo

```
JirafaWeb/
├── index.html      # Toda la app: HTML, CSS y JS inline
├── sw.js           # Service Worker (cache, push notifications)
├── manifest.json   # Manifest de la PWA (íconos, nombre, tema)
├── icon-192.png    # Ícono PWA 192x192
├── icon-512.png    # Ícono PWA 512x512
└── README.md
```

Todo el código vive en `index.html`. Es intencional por ahora (proyecto de un solo desarrollador, sin infraestructura de build); la modularización en archivos separados es un trabajo pendiente si el archivo se vuelve difícil de mantener.

## Cómo correr en local

No requiere instalación de dependencias ni build. Alcanza con servir el archivo estático:

```bash
# Con Python
python3 -m http.server 8080

# o con Node (npx)
npx serve .
```

Abrir `http://localhost:8080` en el navegador.

> El Service Worker y `enableIndexedDbPersistence` requieren HTTPS o `localhost` para funcionar — abrir el archivo directamente con `file://` no anda del todo bien.

## Backend (Firebase)

La app se conecta a un proyecto de Firebase (`diagrama-537aa`) usando la configuración pública embebida en `index.html` (esto es normal en apps Firebase del lado del cliente — la seguridad real depende de las **Firestore Security Rules**, no de ocultar esa config).

Colecciones principales en Firestore:
- `users` — usuarios, guardia asignada, hash de contraseña, accesos (ubicación/dispositivo/horario).
- `events` — turnos, francos, licencias y otros eventos por usuario/fecha.
- `recargos` — recargos por turno/feriado.
- `relSched` / `relCov` — cronograma y cobertura del relevante.

**Estado actual de seguridad:** el login es propio (no usa Firebase Authentication) y la verificación de contraseña se hace en el cliente comparando un hash SHA-256. Esto es aceptable hoy porque el sistema lo usa un grupo cerrado de personas conocidas, pero no es apto si la app se abre a más gente. Está planeado migrar a **login con Google (Firebase Authentication)** más adelante, lo que también permitiría cerrar el acceso a los datos vía Firestore Rules basadas en el usuario autenticado.

## Deploy

Deploy automático en Vercel al pushear a `main`. Al ser un sitio estático, no requiere configuración de build (`Build Command` vacío, `Output Directory` la raíz del repo).

## Roadmap

- [ ] Login con Google (Firebase Authentication) en reemplazo del login propio.
- [ ] Reglas de Firestore acordes al nuevo login.
- [ ] Exportación a Excel/PDF del diagrama mensual.
- [ ] Dashboard de horas trabajadas, recargos y francos.
- [ ] Separar CSS y JS del `index.html` en archivos propios.
