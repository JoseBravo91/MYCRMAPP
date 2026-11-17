import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { getAppSettings } from '@/lib/settings';
import { hojaDeEstilos } from '@/lib/theme';
import { assetUrl } from '@/lib/assets';
import { SettingsProvider, type ClientSettings } from '@/components/providers/SettingsProvider';
import { ToastProvider } from '@/components/ui/Toast';
import './globals.css';

const fuente = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

export async function generateMetadata(): Promise<Metadata> {
  const { marca } = await getAppSettings();
  const logo = assetUrl(marca.logoId);
  return {
    title: { default: marca.nombre, template: `%s · ${marca.nombre}` },
    description: 'Gestión de relaciones con clientes para PYMES colombianas',
    icons: logo ? { icon: logo, apple: logo } : undefined,
  };
}

export async function generateViewport(): Promise<Viewport> {
  const { tema } = await getAppSettings();
  return { themeColor: tema.primario };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { tema, marca, iconos } = await getAppSettings();
  const settings: ClientSettings = {
    tema,
    marca: { nombre: marca.nombre, logoUrl: assetUrl(marca.logoId), mostrarNombre: marca.mostrarNombre },
    iconos: Object.fromEntries(Object.entries(iconos).map(([slot, id]) => [slot, assetUrl(id)!])),
  };

  return (
    <html lang="es-CO" className={fuente.variable}>
      <head>
        {/* Valores calculados a partir de colores validados con regex: no hay contenido del usuario sin escapar */}
        <style id="tema">{hojaDeEstilos(tema)}</style>
      </head>
      <body className="min-h-screen font-sans">
        <SettingsProvider value={settings}>
          <ToastProvider>{children}</ToastProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
