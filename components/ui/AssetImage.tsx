/* eslint-disable @next/next/no-img-element -- imágenes dinámicas ya optimizadas al subirse */

const SIZES = { xs: 14, sm: 16, md: 20, lg: 24, xl: 40, '2xl': 64 } as const;
export type IconSize = keyof typeof SIZES;

interface Props {
  src: string | null | undefined;
  size?: IconSize;
  className?: string;
  alt?: string;
}

/**
 * Marco de tamaño fijo para cualquier imagen subida: la imagen se ajusta con object-contain,
 * así un icono grande o con proporciones distintas nunca altera el diseño.
 */
export function AssetImage({ src, size = 'md', className = '', alt = '' }: Props) {
  if (!src) return null;
  const px = SIZES[size];
  return (
    <span className={`inline-flex shrink-0 items-center justify-center overflow-hidden ${className}`} style={{ width: px, height: px }}>
      <img src={src} alt={alt} width={px} height={px} loading="lazy" decoding="async" className="h-full w-full object-contain" />
    </span>
  );
}
