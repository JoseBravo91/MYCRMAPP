-- CreateEnum
CREATE TYPE "TipoAsset" AS ENUM ('ICON', 'LOGO', 'AVATAR');

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "avatar_id" TEXT;

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "tipo" "TipoAsset" NOT NULL,
    "nombre" VARCHAR(80) NOT NULL,
    "mime_type" VARCHAR(40) NOT NULL,
    "data" BYTEA NOT NULL,
    "bytes" INTEGER NOT NULL,
    "ancho" INTEGER,
    "alto" INTEGER,
    "autor_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" TEXT NOT NULL,
    "etiqueta" VARCHAR(40) NOT NULL,
    "href" VARCHAR(300),
    "icono_id" TEXT,
    "padre_id" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "roles" "Rol"[] DEFAULT ARRAY[]::"Rol"[],

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion" (
    "clave" VARCHAR(40) NOT NULL,
    "valor" JSONB NOT NULL,
    "actualizado_por" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracion_pkey" PRIMARY KEY ("clave")
);

-- CreateIndex
CREATE INDEX "assets_tipo_idx" ON "assets"("tipo");

-- CreateIndex
CREATE INDEX "menu_items_padre_id_orden_idx" ON "menu_items"("padre_id", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_avatar_id_key" ON "usuarios"("avatar_id");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_avatar_id_fkey" FOREIGN KEY ("avatar_id") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_icono_id_fkey" FOREIGN KEY ("icono_id") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_padre_id_fkey" FOREIGN KEY ("padre_id") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

