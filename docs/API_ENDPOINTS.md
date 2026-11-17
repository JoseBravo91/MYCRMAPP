# API REST

Base: `/api`. Todas las peticiones y respuestas usan JSON (`Content-Type: application/json` obligatorio en escrituras).

## Autenticación

El navegador usa cookies `httpOnly` (`mycrm_at` access token, `mycrm_rt` refresh token). Clientes como Postman pueden usar el `accessToken` devuelto por el login en el header `Authorization: Bearer <token>`.

### Errores

```json
{ "error": "Mensaje legible", "details": { "campo": ["mensaje"] } }
```

| Código | Significado |
| --- | --- |
| 400 | Datos inválidos (`details` contiene errores por campo) |
| 401 | No autenticado o token vencido |
| 403 | Sin permisos para la acción / origen no permitido |
| 404 | Recurso inexistente o fuera del alcance del usuario |
| 409 | Conflicto (correo duplicado, último administrador…) |
| 415 | Content-Type no soportado |
| 423 | Cuenta bloqueada por intentos fallidos |
| 429 | Límite de peticiones alcanzado (ver header `Retry-After`) |

## Auth

| Método | Ruta | Auth | Descripción |
| --- | --- | --- | --- |
| POST | `/auth/login` | No | `{ email, password }` → `{ user, accessToken }` + cookies |
| POST | `/auth/register` | No | `{ nombre, email, password }` → crea VENDEDOR (si `ALLOW_REGISTRATION=true`) |
| POST | `/auth/refresh` | Cookie refresh | Rota el refresh token y emite un nuevo access token |
| GET | `/auth/refresh?redirect=/ruta` | Cookie refresh | Igual que POST pero redirige (usado al navegar) |
| POST | `/auth/logout` | – | Revoca el refresh token y borra cookies |
| GET | `/auth/me` | Sí | Usuario autenticado |
| PUT | `/auth/password` | Sí | `{ actual, nueva }` – cierra las demás sesiones |

Política de contraseñas: 8–72 caracteres, al menos una mayúscula, una minúscula y un número. Tras 5 intentos fallidos la cuenta se bloquea 15 minutos.

## Clientes

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/clientes?page=1&pageSize=10&q=texto` | Listado paginado; `q` busca en nombre, email y empresa |
| POST | `/clientes` | Crear |
| GET | `/clientes/:id` | Detalle con oportunidades, seguimientos y etiquetas |
| PUT | `/clientes/:id` | Actualizar |
| DELETE | `/clientes/:id` | Eliminación lógica (también oculta sus oportunidades) → 204 |

Cuerpo:

```json
{
  "nombre": "Laura Restrepo",
  "email": "laura@cafeandino.co",
  "telefono": "+57 310 1234567",
  "empresa": "Café Andino SAS",
  "industria": "Alimentos",
  "ciudad": "Medellín",
  "notas": "…",
  "estado": "PROSPECTO | ACTIVO | INACTIVO",
  "etiquetaIds": ["<id>"],
  "ownerId": "<id> (solo ADMIN/GERENTE)"
}
```

## Oportunidades

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/oportunidades?page=&pageSize=&q=&etapa=` | Listado paginado |
| GET | `/oportunidades?vista=pipeline` | Todas las visibles, para el Kanban |
| POST | `/oportunidades` | Crear |
| GET | `/oportunidades/:id` | Detalle con seguimientos |
| PUT | `/oportunidades/:id` | Actualizar |
| PATCH | `/oportunidades/:id` | `{ etapa }` – mover en el pipeline (ajusta probabilidad y fecha de cierre) |
| DELETE | `/oportunidades/:id` | Eliminación lógica → 204 |

```json
{
  "titulo": "Portal B2B",
  "descripcion": "…",
  "valorEstimado": 18500000,
  "probabilidad": 40,
  "etapa": "PROSPECTO | COTIZACION | CIERRE | GANADO | PERDIDO",
  "fechaCierreEstimada": "2026-12-15",
  "clienteId": "<id>",
  "ownerId": "<id> (opcional)"
}
```

## Seguimientos

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/seguimientos?clienteId=&oportunidadId=&pendientes=true` | Listado filtrado |
| POST | `/seguimientos` | `{ tipo, asunto, descripcion?, fechaProgramada?, clienteId, oportunidadId? }` |
| PATCH | `/seguimientos/:id` | `{ completado: boolean }` |
| DELETE | `/seguimientos/:id` | Eliminar → 204 |

`tipo`: `TAREA | LLAMADA | EMAIL | REUNION`.

## Usuarios

| Método | Ruta | Rol | Descripción |
| --- | --- | --- | --- |
| GET | `/usuarios` | ADMIN, GERENTE | ADMIN: todos; GERENTE: activos (para asignar) |
| POST | `/usuarios` | ADMIN | `{ nombre, email, password, rol }` |
| PATCH | `/usuarios/:id` | ADMIN | `{ nombre?, rol?, activo?, password? }` – revoca sesiones si cambia rol, estado o contraseña |

| POST | `/usuarios/:id/avatar` | Propio o ADMIN | `multipart/form-data` con `archivo` (PNG/JPG/WebP, máx. 512 KB y 1024 px) – reemplaza la foto anterior |
| DELETE | `/usuarios/:id/avatar` | Propio o ADMIN | Quita la foto de perfil |

Siempre debe quedar al menos un administrador activo; un administrador no puede desactivarse ni cambiar su propio rol.

## Imágenes

| Método | Ruta | Rol | Descripción |
| --- | --- | --- | --- |
| GET | `/assets?tipo=ICON\|LOGO` | ADMIN | Biblioteca con tamaño y número de usos |
| POST | `/assets` | ADMIN | `multipart/form-data`: `archivo`, `tipo` (`ICON` máx. 256 KB/512 px, `LOGO` máx. 512 KB/1200 px), `nombre` |
| GET | `/assets/:id` | Público (avatares: con sesión) | Sirve la imagen con caché inmutable, `nosniff` y CSP `sandbox` |
| DELETE | `/assets/:id` | ADMIN | Elimina la imagen y la quita del menú, de las ubicaciones y del logo |

El formato se valida por la firma binaria del archivo, no por la extensión. Los SVG se convierten a PNG en el navegador antes de subirse.

## Configuración (solo ADMIN)

| Método | Ruta | Cuerpo |
| --- | --- | --- |
| GET/PUT | `/configuracion/tema` | `{ primario: "#RRGGBB", acento: "#RRGGBB" }` |
| GET/PUT | `/configuracion/marca` | `{ nombre, logoId \| null, mostrarNombre }` |
| GET/PUT | `/configuracion/iconos` | `{ "<ubicación>": "<assetId>" }` (p. ej. `kpi.clientes`, `accion.nuevo`) |
| GET/PUT | `/configuracion/menu` | `[{ etiqueta, href \| null, iconoId \| null, visible, roles: Rol[], hijos: [...] }]` – dos niveles; `href` interno (`/ruta`) o `https://`; `roles` vacío = todos; Configuración siempre debe quedar visible para ADMIN |

Cada cambio queda registrado en `audit_logs`.

## Otros

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/dashboard/kpis` | KPIs y series para gráficos (según alcance del rol) |
| GET | `/etiquetas` | Catálogo de etiquetas |
| POST | `/gemini/analizar` | `{ clienteId }` → `{ fuente: "gemini" \| "fallback", contenido, modelo?, motivoFallback? }` |

`/gemini/analizar` admite 10 peticiones por minuto por usuario y 60 por minuto en total; cada llamada queda registrada en `audit_logs`.

## Ejemplo con cURL

```bash
curl -c cookies.txt -H 'Content-Type: application/json' \
  -d '{"email":"admin@mycrmapp.co","password":"Demo1234*"}' \
  http://localhost:3000/api/auth/login

curl -b cookies.txt "http://localhost:3000/api/clientes?q=cafe"
```
