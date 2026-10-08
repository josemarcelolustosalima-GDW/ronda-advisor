import { FindingPhoto } from '../types/round';

/**
 * Reads an image File (from iPhone camera or library), resizes it proportionally
 * while strictly preserving its original aspect ratio, and returns a FindingPhoto object.
 */
export async function processImageFile(
  file: File,
  maxDimension = 1600,
  quality = 0.85
): Promise<FindingPhoto> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) {
        reject(new Error('Falha ao ler o arquivo de imagem.'));
        return;
      }
      const img = new Image();
      img.onload = () => {
        const origW = img.naturalWidth || img.width;
        const origH = img.naturalHeight || img.height;

        let targetW = origW;
        let targetH = origH;

        if (origW > maxDimension || origH > maxDimension) {
          if (origW >= origH) {
            targetW = maxDimension;
            targetH = Math.round((origH / origW) * maxDimension);
          } else {
            targetH = maxDimension;
            targetW = Math.round((origW / origH) * maxDimension);
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Contexto gráfico indisponível.'));
          return;
        }

        // Fill white background in case of transparent PNG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetW, targetH);
        ctx.drawImage(img, 0, 0, targetW, targetH);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        const now = new Date();
        const timestamp = now.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        });

        resolve({
          id: `photo-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          dataUrl: compressedDataUrl,
          width: targetW,
          height: targetH,
          timestamp,
        });
      };
      img.onerror = () => reject(new Error('Formato de imagem inválido.'));
      img.src = dataUrl;
    };
    reader.onerror = () => reject(new Error('Erro ao processar fotografia.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Generates a realistic technical industrial diagram/photo on canvas for initial demo record
 * so the Advisor can preview a complete PDF report immediately on first launch.
 */
export function createDemoIndustrialPhoto(
  title: string,
  sector: string,
  code: string,
  accentHex: string
): FindingPhoto {
  const width = 960;
  const height = 640;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Industrial dark slate background
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#1E293B');
    grad.addColorStop(1, '#0F172A');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Subtle structural grid
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 48) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Industrial equipment silhouette / schematic frame
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.28)';
    ctx.lineWidth = 3;
    ctx.strokeRect(80, 96, width - 160, height - 210);

    // Machine bays / gauges
    ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
    ctx.fillRect(120, 140, 280, 260);
    ctx.strokeRect(120, 140, 280, 260);

    ctx.fillRect(440, 140, 400, 260);
    ctx.strokeRect(440, 140, 400, 260);

    // Highlighted inspection point
    ctx.strokeStyle = accentHex;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(260, 270, 68, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = accentHex;
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.fillText(`PONTO DE INSPEÇÃO · ${code}`, 470, 205);

    ctx.fillStyle = '#F8FAFC';
    ctx.font = 'bold 28px Arial, sans-serif';
    ctx.fillText(title, 470, 255);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '20px Arial, sans-serif';
    ctx.fillText(`Setor: ${sector}`, 470, 298);
    ctx.fillText('Registro Fotográfico em Campo · GUIDEWAY', 470, 336);

    // Bottom metadata bar
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.fillRect(0, height - 76, width, 76);
    ctx.fillStyle = '#5EA83A';
    ctx.fillRect(0, height - 76, 8, 76);

    ctx.fillStyle = '#E2E8F0';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(`EVIDÊNCIA OPERACIONAL [${code}] — ${sector}`, 28, height - 32);
  }

  return {
    id: `demo-photo-${code}`,
    dataUrl: canvas.toDataURL('image/jpeg', 0.88),
    width,
    height,
    timestamp: '08:42',
  };
}
