import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-5xl font-bold text-brand-ink">404</p>
      <p className="text-slate-600">La página o el registro que buscas no existe.</p>
      <Link href="/dashboard" className="font-medium text-accent-ink hover:underline">
        Volver al inicio
      </Link>
    </div>
  );
}
