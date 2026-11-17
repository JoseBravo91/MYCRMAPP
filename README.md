# MyCrmApp

Sistema de Gestión de Relaciones con Clientes (CRM) para PYMES colombianas.
Proyecto de Grado · Universidad Nacional Abierta y a Distancia (UNAD) · Fase 4 – Prototipo funcional (TRL5).

**Equipo:** José Fernando Bravo Franco · César Augusto Lozano Gómez

## Funcionalidades

| Módulo | Descripción |
| --- | --- |
| Autenticación | Login/registro, JWT de acceso + refresh token rotativo en cookies `httpOnly`, logout, sesión persistente, bloqueo por intentos fallidos |
| Usuarios y roles | `ADMIN`, `GERENTE`, `VENDEDOR` con control de acceso por rol y por propiedad de los registros |
| Clientes | Listado paginado, búsqueda, creación, edición, eliminación lógica (soft delete), etiquetas, detalle con histórico |
| Oportunidades | CRUD, pipeline Kanban con drag & drop (Prospecto → Cotización → Cierre → Ganado/Perdido), valor y probabilidad |
| Seguimientos | Tareas, llamadas, emails y reuniones por cliente/oportunidad; marcar completados |
| Dashboard | Total clientes, valor del pipeline, oportunidades abiertas, tasa de conversión, seguimientos pendientes y gráficos |
| Configuración (ADMIN) | Menú lateral editable (orden, grupos, iconos, visibilidad por rol), color principal y de acento con control de contraste, logo y nombre de la marca, biblioteca de iconos y gestión de usuarios |
| Imágenes | Iconos, logo y fotos de perfil se recortan en el navegador al tamaño exacto; nunca rompen el diseño |
| Análisis con Gemini | Estrategia de venta sugerida por cliente, con límite de 60 req/min, timeout, *fallback* local y bitácora |

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Prisma 6 · PostgreSQL · Tailwind CSS 3 · Zod 4 · jose (JWT) · bcrypt · Recharts · Vitest

## Inicio rápido

```bash
npm install
cp .env.example .env.local      # editar valores
cp .env.local .env              # Prisma CLI lee .env
docker compose up -d            # o PostgreSQL local
npx prisma migrate dev
npx prisma db seed
npm run dev                     # http://localhost:3000
```

Usuarios de prueba creados por el seed (contraseña `Demo1234*`, o la definida en `SEED_PASSWORD`):

| Rol | Correo |
| --- | --- |
| Administrador | admin@mycrmapp.co |
| Gerente | gerente@mycrmapp.co |
| Vendedor | vendedor@mycrmapp.co · vendedor2@mycrmapp.co |

## Scripts

| Comando | Uso |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Build y servidor de producción |
| `npm run lint` / `npm run typecheck` | Calidad de código |
| `npm test` | Pruebas unitarias (auth, roles, KPIs, validadores, rate limit) |
| `npm run db:migrate` / `db:deploy` / `db:seed` / `db:studio` | Base de datos |

## Documentación

- [docs/SETUP.md](docs/SETUP.md) – instalación local
- [docs/DEPLOY.md](docs/DEPLOY.md) – despliegue en Vercel + Railway
- [docs/API_ENDPOINTS.md](docs/API_ENDPOINTS.md) – referencia de la API REST
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) – arquitectura, modelo de datos y seguridad
