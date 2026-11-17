import type { Metadata } from 'next';
import { requirePageUser } from '@/lib/auth/session';
import { getAppSettings } from '@/lib/settings';
import { assetUrl } from '@/lib/assets';
import { ThemeEditor } from '@/components/config/ThemeEditor';
import { BrandingEditor } from '@/components/config/BrandingEditor';

export const metadata: Metadata = { title: 'Apariencia' };

export default async function AparienciaPage() {
  await requirePageUser(['ADMIN']);
  const { tema, marca } = await getAppSettings();
  return (
    <div className="space-y-6">
      <ThemeEditor inicial={tema} />
      <BrandingEditor inicial={{ ...marca, logoUrl: assetUrl(marca.logoId) }} />
    </div>
  );
}
