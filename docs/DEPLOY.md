# Despliegue (Vercel + Railway)

La aplicación es full-stack (Next.js sirve frontend y API), por lo que se despliega en **Vercel** y la base de datos PostgreSQL vive en **Railway**.

## 1. Base de datos en Railway

1. Crear un proyecto en [railway.app](https://railway.app) → **New → Database → PostgreSQL**.
2. En la pestaña **Variables** del servicio copiar `DATABASE_PUBLIC_URL` (acceso desde fuera de Railway).
3. Agregar `?sslmode=require` al final si no lo incluye.

## 2. Aplicación en Vercel

1. Importar el repositorio de GitHub en [vercel.com](https://vercel.com/new). Vercel detecta Next.js automáticamente.
2. En **Settings → Environment Variables** (entorno *Production*):

| Variable | Valor |
| --- | --- |
| `DATABASE_URL` | URL pública de Railway |
| `JWT_SECRET` | `openssl rand -base64 48` (distinto al de desarrollo) |
| `ALLOW_REGISTRATION` | `false` recomendado en producción |
| `ALLOWED_ORIGINS` | `https://<tu-app>.vercel.app` |
| `GEMINI_API_KEY` | API key de Google AI Studio |
| `GEMINI_MODEL` | `gemini-2.5-flash` |

3. Desplegar. El script `build` ejecuta `prisma generate` antes de `next build`.

## 3. Migraciones y datos iniciales

Desde una máquina con acceso a la base de datos de producción:

```bash
DATABASE_URL="<url-railway>" npx prisma migrate deploy
DATABASE_URL="<url-railway>" SEED_PASSWORD="<contraseña-fuerte>" NODE_ENV=production npx prisma db seed   # opcional
```

`migrate deploy` solo aplica migraciones versionadas en `prisma/migrations`, nunca genera cambios nuevos.
Después del seed, iniciar sesión como administrador y cambiar la contraseña desde **Mi perfil**.

## 4. Checklist de producción

- [ ] `JWT_SECRET` único y de al menos 48 bytes aleatorios
- [ ] `ALLOW_REGISTRATION=false` salvo que se quiera auto-registro
- [ ] `ALLOWED_ORIGINS` limitado al dominio de la app
- [ ] Contraseñas del seed cambiadas
- [ ] HTTPS (Vercel lo activa por defecto; las cookies usan `Secure` en producción)
- [ ] Ningún archivo `.env*` en el repositorio (`git ls-files | grep .env` solo debe mostrar `.env.example`)

## Notas de escalabilidad

El limitador de peticiones (login y Gemini) es en memoria por instancia. Con múltiples instancias serverless el límite efectivo se multiplica; para un entorno productivo con alto tráfico se recomienda moverlo a Redis (p. ej. Upstash).
