import { BrandLogo } from '@/components/ui/BrandLogo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-brand p-12 text-brand-fg lg:flex">
        {/* Formas decorativas con el color de acento */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent/25 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-brand-fg/10 blur-3xl" aria-hidden="true" />
        <BrandLogo size="md" className="relative" />
        <div className="relative">
          <h2 className="text-4xl font-extrabold leading-tight tracking-tight">
            Relaciones que <span className="text-accent">venden</span>.
          </h2>
          <p className="mt-4 max-w-md text-lg opacity-80">
            Clientes, oportunidades y seguimientos en un solo lugar, con análisis inteligente para PYMES colombianas.
          </p>
        </div>
        <p className="relative text-sm opacity-60">Universidad Nacional Abierta y a Distancia · UNAD</p>
      </div>
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
