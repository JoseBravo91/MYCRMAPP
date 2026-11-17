import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

interface AuditEntry {
  usuarioId?: string | null;
  accion: string;
  entidad?: string;
  entidadId?: string;
  metadata?: Prisma.InputJsonValue;
  ip?: string | null;
}

// La auditoría nunca debe tumbar la operación principal: los fallos se registran y se ignoran.
export async function audit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({ data: { ...entry, ip: entry.ip ?? null } });
  } catch (err) {
    console.error('[audit] no se pudo registrar el evento', entry.accion, err);
  }
}
