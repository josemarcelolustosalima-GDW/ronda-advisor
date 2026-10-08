import React from 'react';

interface GuidewayLogoProps {
  variant?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
}

/**
 * Exact vector reproduction of the official GUIDEWAY logo (PRETO JPEG.png)
 * Preserves the exact proportions:
 * - "gu" and "dewa" in Guideway corporate green (#5EA83A)
 * - Railway Vignoles rail profile silhouette in place of "i"
 * - "y" with perched bird silhouette above right
 * - "OPERAÇÕES INTELIGENTES" with green underlines under "O" and "IN"
 * - "powered by IA" sub-caption
 */
export const GuidewayLogo: React.FC<GuidewayLogoProps> = ({
  variant = 'dark',
  size = 'md',
  showTagline = true,
  className = '',
}) => {
  const dimensions = {
    sm: { width: 136, height: showTagline ? 44 : 32 },
    md: { width: 185, height: showTagline ? 60 : 44 },
    lg: { width: 240, height: showTagline ? 78 : 56 },
    xl: { width: 300, height: showTagline ? 96 : 70 },
  }[size];

  // In PRETO JPEG.png, the secondary elements (rail "i", "y", bird, and "OPERAÇÕES INTELIGENTES")
  // are white/silver on dark backgrounds, and dark slate/silver on light backgrounds.
  const secondaryFill = variant === 'dark' ? '#FFFFFF' : '#1E293B';
  const railFill = variant === 'dark' ? '#F1F5F9' : '#CBD5E1';
  const railStroke = variant === 'dark' ? '#E2E8F0' : '#64748B';
  const subTextFill = variant === 'dark' ? '#CBD5E1' : '#475569';
  const greenFill = '#5EA83A';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={showTagline ? '0 0 560 185' : '0 0 560 130'}
      width={dimensions.width}
      height={dimensions.height}
      className={`select-none shrink-0 ${className}`}
      role="img"
      aria-label="GUIDEWAY Operações Inteligentes"
    >
      {/* Bird perched on top right above 'y' */}
      <g transform="translate(415, 4)">
        <path
          d="M0 24 L30 22 C36 14, 48 6, 62 6 C67 3, 73 2, 78 5 L88 3 L81 9 C81 17, 75 25, 64 29 L56 44 L51 44 L56 31 C45 32, 32 29, 18 27 Z"
          fill={secondaryFill}
        />
      </g>

      {/* "gu" */}
      <text
        x="18"
        y="106"
        fontFamily="'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
        fontSize="94"
        fontWeight="500"
        fill={greenFill}
        letterSpacing="-2"
      >
        gu
      </text>

      {/* Railway Rail Profile "i" */}
      <g transform="translate(136, 26)">
        {/* Rail Head */}
        <path
          d="M16 0 H40 C44 0, 46 3, 46 7 V12 C46 15, 43 17, 38 18 L32 21 V65 L39 71 L56 77 C58 78, 58 81, 55 81 H1 C-2 81, -2 78, 0 77 L17 71 L24 65 V21 L18 18 C13 17, 10 15, 10 12 V7 C10 3, 12 0, 16 0 Z"
          fill={railFill}
          stroke={railStroke}
          strokeWidth="1.2"
        />
      </g>

      {/* "dewa" */}
      <text
        x="198"
        y="106"
        fontFamily="'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
        fontSize="94"
        fontWeight="500"
        fill={greenFill}
        letterSpacing="-2"
      >
        dewa
      </text>

      {/* "y" */}
      <text
        x="438"
        y="106"
        fontFamily="'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
        fontSize="94"
        fontWeight="500"
        fill={secondaryFill}
      >
        y
      </text>

      {showTagline && (
        <g>
          {/* OPERAÇÕES INTELIGENTES */}
          <text
            x="176"
            y="142"
            fontFamily="'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
            fontSize="19"
            fontWeight="500"
            fill={secondaryFill}
            letterSpacing="2.6"
          >
            OPERAÇÕES INTELIGENTES
          </text>
          {/* Green bar under O */}
          <rect x="176" y="149" width="21" height="3.8" fill={greenFill} />
          {/* Green bar under IN */}
          <rect x="319" y="149" width="24" height="3.8" fill={greenFill} />

          {/* powered by IA */}
          <text
            x="366"
            y="172"
            fontFamily="'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
            fontSize="13.5"
            fontWeight="400"
            fill={subTextFill}
            letterSpacing="0.8"
          >
            powered by IA
          </text>
        </g>
      )}
    </svg>
  );
};

/**
 * Renders the official GUIDEWAY logo to a high-DPI PNG data URL for PDF embedding.
 */
export async function renderGuidewayLogoDataUrl(
  variant: 'dark' | 'light' = 'light',
  width = 840,
  height = 278
): Promise<string> {
  const secondaryFill = variant === 'dark' ? '#FFFFFF' : '#0F172A';
  const railFill = variant === 'dark' ? '#F1F5F9' : '#CBD5E1';
  const railStroke = variant === 'dark' ? '#E2E8F0' : '#64748B';
  const subTextFill = variant === 'dark' ? '#CBD5E1' : '#475569';
  const greenFill = '#5EA83A';

  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 185" width="${width}" height="${height}">
    <g transform="translate(415, 4)">
      <path d="M0 24 L30 22 C36 14, 48 6, 62 6 C67 3, 73 2, 78 5 L88 3 L81 9 C81 17, 75 25, 64 29 L56 44 L51 44 L56 31 C45 32, 32 29, 18 27 Z" fill="${secondaryFill}" />
    </g>
    <text x="18" y="106" font-family="Arial, Helvetica, sans-serif" font-size="94" font-weight="bold" fill="${greenFill}" letter-spacing="-2">gu</text>
    <g transform="translate(136, 26)">
      <path d="M16 0 H40 C44 0, 46 3, 46 7 V12 C46 15, 43 17, 38 18 L32 21 V65 L39 71 L56 77 C58 78, 58 81, 55 81 H1 C-2 81, -2 78, 0 77 L17 71 L24 65 V21 L18 18 C13 17, 10 15, 10 12 V7 C10 3, 12 0, 16 0 Z" fill="${railFill}" stroke="${railStroke}" stroke-width="1.5" />
    </g>
    <text x="198" y="106" font-family="Arial, Helvetica, sans-serif" font-size="94" font-weight="bold" fill="${greenFill}" letter-spacing="-2">dewa</text>
    <text x="438" y="106" font-family="Arial, Helvetica, sans-serif" font-size="94" font-weight="bold" fill="${secondaryFill}">y</text>
    <text x="176" y="142" font-family="Arial, Helvetica, sans-serif" font-size="18.5" font-weight="bold" fill="${secondaryFill}" letter-spacing="2.4">OPERAÇÕES INTELIGENTES</text>
    <rect x="176" y="149" width="21" height="4" fill="${greenFill}" />
    <rect x="319" y="149" width="24" height="4" fill="${greenFill}" />
    <text x="366" y="172" font-family="Arial, Helvetica, sans-serif" font-size="13.5" fill="${subTextFill}" letter-spacing="0.8">powered by IA</text>
  </svg>`;

  return new Promise((resolve) => {
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
      }
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve('');
    };
    img.src = url;
  });
}
