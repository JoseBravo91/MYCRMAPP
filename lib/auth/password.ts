import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

// Hash válido de una contraseña aleatoria: se compara contra él cuando el usuario no existe
// para que el tiempo de respuesta no revele qué correos están registrados.
const DUMMY_HASH = '$2a$12$iO6ijMJiaXbcYaW4AodA2e7Zc5CumXdA6sx0qbaiWNCKvN8kpxpt6';

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string | null | undefined): Promise<boolean> {
  return bcrypt.compare(plain, hash ?? DUMMY_HASH);
}
