# Instalación local

## Requisitos

- Node.js 20 o superior (probado con 24)
- PostgreSQL 14+ (local o con Docker)
- Git

## Pasos

```bash
# 1. Clonar
git clone https://github.com/<usuario>/MyCrmApp.git
cd MyCrmApp

# 2. Dependencias (genera el cliente de Prisma automáticamente)
npm install

# 3. Variables de entorno
cp .env.example .env.local
openssl rand -base64 48          # pegar el resultado en JWT_SECRET
cp .env.local .env               # la CLI de Prisma solo lee .env (ambos están en .gitignore)

# 4. Base de datos
docker compose up -d             # opción A: contenedor (usuario mycrm / mycrm_local)
# opción B: PostgreSQL instalado -> createdb mycrmapp_dev

# 5. Migraciones y datos de prueba
npx prisma migrate dev
npx prisma db seed

# 6. Ejecutar
npm run dev                      # http://localhost:3000
```

Con Docker, la cadena de conexión es:

```
DATABASE_URL="postgresql://mycrm:mycrm_local@localhost:5432/mycrmapp_dev"
```

## Variables de entorno

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `DATABASE_URL` | Sí | Cadena de conexión PostgreSQL |
| `JWT_SECRET` | Sí | Secreto HS256, mínimo 32 caracteres |
| `JWT_ACCESS_TTL_SECONDS` | No | Vida del access token (por defecto 900 = 15 min) |
| `JWT_REFRESH_TTL_DAYS` | No | Vida del refresh token (por defecto 7 días) |
| `ALLOW_REGISTRATION` | No | `true` habilita el auto-registro (rol Vendedor) |
| `ALLOWED_ORIGINS` | No | Orígenes CORS adicionales separados por coma |
| `GEMINI_API_KEY` | No | Sin ella se usa el análisis local de respaldo |
| `GEMINI_MODEL` | No | Por defecto `gemini-2.5-flash` |
| `SEED_PASSWORD` | No | Contraseña de los usuarios del seed (obligatoria en producción) |

## Verificación

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

## Problemas comunes

- **`JWT_SECRET no está configurado`**: falta la variable o tiene menos de 32 caracteres.
- **PostgreSQL de Homebrew no arranca** (`lock file "postmaster.pid" already exists`): tras un apagado inesperado, verificar que el PID del archivo no corresponda a un proceso `postgres` y eliminar `postmaster.pid` del directorio de datos.
- **`P1001: Can't reach database server`**: revisar que PostgreSQL esté activo y que `DATABASE_URL` sea correcta en `.env`.
