import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  CriticalityLevel,
  FindingType,
  OPERATIONAL_AREAS_LIST,
  Round,
} from '../types/round';
import { renderGuidewayLogoDataUrl } from '../components/GuidewayLogo';

/**
 * Renders a corporate horizontal bar chart onto an offscreen canvas and returns a PNG Data URL
 * for clean embedding in the executive PDF report.
 */
function renderHorizontalChartDataUrl(
  title: string,
  items: { label: string; count: number; color: string }[]
): string {
  const width = 900;
  const rowHeight = 46;
  const headerHeight = 68;
  const footerPadding = 28;
  const activeItems = items.length > 0 ? items : [{ label: 'Sem registros', count: 0, color: '#94A3B8' }];
  const height = headerHeight + activeItems.length * rowHeight + footerPadding;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Card background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Subtle border
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);

  // Top accent bar
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(0, 0, width, 6);

  // Title
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 22px Arial, Helvetica, sans-serif';
  ctx.fillText(title, 28, 44);

  const maxCount = Math.max(...activeItems.map((i) => i.count), 1);
  const labelX = 28;
  const barStartX = 310;
  const maxBarWidth = 490;

  activeItems.forEach((item, idx) => {
    const y = headerHeight + idx * rowHeight;

    // Alternating subtle row line
    if (idx > 0) {
      ctx.strokeStyle = '#F1F5F9';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(28, y - 8);
      ctx.lineTo(width - 28, y - 8);
      ctx.stroke();
    }

    // Label
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 17px Arial, Helvetica, sans-serif';
    const truncatedLabel =
      item.label.length > 26 ? item.label.substring(0, 25) + '…' : item.label;
    ctx.fillText(truncatedLabel, labelX, y + 20);

    // Track background
    ctx.fillStyle = '#F1F5F9';
    ctx.fillRect(barStartX, y + 4, maxBarWidth, 22);

    // Active bar
    const barW = item.count > 0 ? Math.max(Math.round((item.count / maxCount) * maxBarWidth), 12) : 0;
    if (barW > 0) {
      ctx.fillStyle = item.color;
      ctx.fillRect(barStartX, y + 4, barW, 22);
    }

    // Numeric count
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(String(item.count), barStartX + maxBarWidth + 20, y + 21);
  });

  return canvas.toDataURL('image/png');
}

export function computeRoundStatistics(round: Round) {
  const total = round.findings.length;
  const byCriticality = {
    [CriticalityLevel.CRITICA]: round.findings.filter(
      (f) => f.criticality === CriticalityLevel.CRITICA
    ).length,
    [CriticalityLevel.ALTA]: round.findings.filter(
      (f) => f.criticality === CriticalityLevel.ALTA
    ).length,
    [CriticalityLevel.MEDIA]: round.findings.filter(
      (f) => f.criticality === CriticalityLevel.MEDIA
    ).length,
    [CriticalityLevel.BAIXA]: round.findings.filter(
      (f) => f.criticality === CriticalityLevel.BAIXA
    ).length,
  };

  const areaMap = new Map<string, number>();
  OPERATIONAL_AREAS_LIST.forEach((a) => areaMap.set(a.label, 0));
  round.findings.forEach((f) => {
    areaMap.set(f.area, (areaMap.get(f.area) || 0) + 1);
  });

  const byArea = Array.from(areaMap.entries())
    .map(([label, count]) => ({ label, count }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);

  const typeMap = new Map<string, number>();
  Object.values(FindingType).forEach((t) => typeMap.set(t, 0));
  round.findings.forEach((f) => {
    typeMap.set(f.type, (typeMap.get(f.type) || 0) + 1);
  });

  const byType = Array.from(typeMap.entries())
    .map(([label, count]) => ({ label, count }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);

  const distinctAreasCount = byArea.length;

  return {
    total,
    byCriticality,
    byArea,
    byType,
    distinctAreasCount,
  };
}

/**
 * Generates the corporate PDF document for a GUIDEWAY Industrial Round
 * following Sections 12 to 18 of the Master Specification.
 */
export async function generateRoundPdfBlob(round: Round): Promise<{
  blob: Blob;
  filename: string;
}> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 15;
  const contentWidth = pageWidth - margin * 2; // 180mm

  const logoDarkDataUrl = await renderGuidewayLogoDataUrl('dark', 840, 278);
  const logoLightDataUrl = await renderGuidewayLogoDataUrl('light', 840, 278);

  const stats = computeRoundStatistics(round);

  const addHeaderAndFooter = (pageNum: number, totalPages: number) => {
    // Top subtle header on inner pages
    if (pageNum > 1 && pageNum < totalPages) {
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 14, 'F');
      if (logoDarkDataUrl) {
        doc.addImage(logoDarkDataUrl, 'PNG', margin, 2.2, 30, 9.8);
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(226, 232, 240);
      doc.text(
        `RELATÓRIO DE RONDA INDUSTRIAL · ${round.id}`,
        pageWidth - margin,
        8.5,
        { align: 'right' }
      );
    }

    // Bottom footer on all pages except final cover
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `GUIDEWAY Industrial Round · ${round.clientCompany} (${round.plantUnit})`,
      margin,
      pageHeight - 7.5
    );
    doc.text(
      `Página ${pageNum} de ${totalPages}`,
      pageWidth - margin,
      pageHeight - 7.5,
      { align: 'right' }
    );
  };

  // =========================================================================
  // PAGE 1: COVER HEADER + METADATA + EXECUTIVE SUMMARY + INDICATORS
  // =========================================================================

  // Executive Dark Header Banner
  doc.setFillColor(15, 23, 42); // #0F172A
  doc.rect(0, 0, pageWidth, 52, 'F');
  // Green accent stripe
  doc.setFillColor(94, 168, 58); // #5EA83A
  doc.rect(0, 52, pageWidth, 2, 'F');

  if (logoDarkDataUrl) {
    doc.addImage(logoDarkDataUrl, 'PNG', margin, 10, 56, 18.5);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(255, 255, 255);
  doc.text('RELATÓRIO DE RONDA INDUSTRIAL', pageWidth - margin, 20, {
    align: 'right',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Advisor Operacional GUIDEWAY', pageWidth - margin, 27, {
    align: 'right',
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(94, 168, 58);
  doc.text(`ID DA RONDA: ${round.id}`, pageWidth - margin, 36, {
    align: 'right',
  });

  let cursorY = 62;

  // Metadata Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, cursorY, contentWidth, 38, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('CLIENTE / EMPRESA', margin + 5, cursorY + 7);
  doc.text('UNIDADE / PLANTA', margin + 95, cursorY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(round.clientCompany || '-', margin + 5, cursorY + 13);
  doc.text(round.plantUnit || '-', margin + 95, cursorY + 13);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('DATA DA RONDA', margin + 5, cursorY + 23);
  doc.text('HORÁRIO (INÍCIO — FIM)', margin + 50, cursorY + 23);
  doc.text('DURAÇÃO', margin + 105, cursorY + 23);
  doc.text('ADVISOR OPERACIONAL', margin + 135, cursorY + 23);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(round.date, margin + 5, cursorY + 29);
  doc.text(
    `${round.startTime} — ${round.endTime || 'Em aberto'}`,
    margin + 50,
    cursorY + 29
  );
  doc.text(round.durationFormatted || '-', margin + 105, cursorY + 29);
  doc.text(
    (round.advisorName || 'Advisor GUIDEWAY').substring(0, 26),
    margin + 135,
    cursorY + 29
  );

  cursorY += 46;

  // Objective if present
  if (round.objective) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text('OBJETIVO DA RONDA:', margin, cursorY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    const objLines = doc.splitTextToSize(round.objective, contentWidth);
    doc.text(objLines, margin, cursorY + 5);
    cursorY += 6 + objLines.length * 4.5;
  }

  // SECTION 13: RESUMO EXECUTIVO
  cursorY += 3;
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, cursorY, 3, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('1. RESUMO EXECUTIVO', margin + 6, cursorY + 4.8);

  cursorY += 10;
  const summaryText = `Durante a ronda operacional realizada na unidade ${round.clientCompany} (${round.plantUnit}), foram identificadas ${stats.total} oportunidades de atenção distribuídas entre ${stats.distinctAreasCount} áreas operacionais.`;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  const summaryLines = doc.splitTextToSize(summaryText, contentWidth);
  doc.text(summaryLines, margin, cursorY);
  cursorY += summaryLines.length * 5 + 4;

  // Criticality KPI Cards Row
  const kpiWidth = (contentWidth - 9) / 4;
  const kpis = [
    {
      label: 'CRÍTICAS',
      count: stats.byCriticality[CriticalityLevel.CRITICA],
      r: 220,
      g: 38,
      b: 38,
      bgR: 254,
      bgG: 242,
      bgB: 242,
    },
    {
      label: 'ALTA PRIORIDADE',
      count: stats.byCriticality[CriticalityLevel.ALTA],
      r: 249,
      g: 115,
      b: 22,
      bgR: 255,
      bgG: 247,
      bgB: 237,
    },
    {
      label: 'MÉDIA PRIORIDADE',
      count: stats.byCriticality[CriticalityLevel.MEDIA],
      r: 217,
      g: 119,
      b: 6,
      bgR: 255,
      bgG: 251,
      bgB: 235,
    },
    {
      label: 'BAIXA PRIORIDADE',
      count: stats.byCriticality[CriticalityLevel.BAIXA],
      r: 16,
      g: 185,
      b: 129,
      bgR: 236,
      bgG: 253,
      bgB: 245,
    },
  ];

  kpis.forEach((kpi, idx) => {
    const x = margin + idx * (kpiWidth + 3);
    doc.setFillColor(kpi.bgR, kpi.bgG, kpi.bgB);
    doc.setDrawColor(kpi.r, kpi.g, kpi.b);
    doc.setLineWidth(0.35);
    doc.roundedRect(x, cursorY, kpiWidth, 20, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(kpi.r, kpi.g, kpi.b);
    doc.text(kpi.label, x + 4, cursorY + 6.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(15, 23, 42);
    doc.text(String(kpi.count), x + 4, cursorY + 16);
  });

  cursorY += 28;

  // SECTION 15: INDICADORES (Charts)
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, cursorY, 3, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('2. INDICADORES DA RONDA', margin + 6, cursorY + 4.8);
  cursorY += 9;

  // Render charts
  const critChartUrl = renderHorizontalChartDataUrl('OPORTUNIDADES POR CRITICIDADE', [
    {
      label: 'Crítica',
      count: stats.byCriticality[CriticalityLevel.CRITICA],
      color: '#DC2626',
    },
    {
      label: 'Alta',
      count: stats.byCriticality[CriticalityLevel.ALTA],
      color: '#F97316',
    },
    {
      label: 'Média',
      count: stats.byCriticality[CriticalityLevel.MEDIA],
      color: '#F59E0B',
    },
    {
      label: 'Baixa',
      count: stats.byCriticality[CriticalityLevel.BAIXA],
      color: '#10B981',
    },
  ]);

  if (critChartUrl) {
    const chartH = 44;
    doc.addImage(critChartUrl, 'PNG', margin, cursorY, contentWidth, chartH);
    cursorY += chartH + 5;
  }

  const areaChartItems = stats.byArea.slice(0, 6).map((item) => ({
    label: item.label,
    count: item.count,
    color: '#0F172A',
  }));
  const areaChartUrl = renderHorizontalChartDataUrl(
    'OPORTUNIDADES POR ÁREA OPERACIONAL',
    areaChartItems
  );
  if (areaChartUrl) {
    const chartH = Math.min(20 + Math.max(areaChartItems.length, 1) * 7.5, 58);
    if (cursorY + chartH > pageHeight - 18) {
      doc.addPage();
      cursorY = 22;
    }
    doc.addImage(areaChartUrl, 'PNG', margin, cursorY, contentWidth, chartH);
    cursorY += chartH + 5;
  }

  const typeChartItems = stats.byType.slice(0, 6).map((item) => ({
    label: item.label,
    count: item.count,
    color: '#5EA83A',
  }));
  const typeChartUrl = renderHorizontalChartDataUrl(
    'OPORTUNIDADES POR TIPO DE REGISTRO',
    typeChartItems
  );
  if (typeChartUrl) {
    const chartH = Math.min(20 + Math.max(typeChartItems.length, 1) * 7.5, 58);
    if (cursorY + chartH > pageHeight - 18) {
      doc.addPage();
      cursorY = 22;
    }
    doc.addImage(typeChartUrl, 'PNG', margin, cursorY, contentWidth, chartH);
    cursorY += chartH + 8;
  }

  // =========================================================================
  // SECTION 14 & 16: VISÃO DO ADVISOR OPERACIONAL & DETAILED FINDINGS
  // =========================================================================
  doc.addPage();
  cursorY = 22;

  doc.setFillColor(94, 168, 58);
  doc.rect(margin, cursorY, 3, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(15, 23, 42);
  doc.text('3. VISÃO DO ADVISOR OPERACIONAL E DETALHAMENTO', margin + 6, cursorY + 4.8);
  cursorY += 10;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, cursorY, contentWidth, 16, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);
  doc.setTextColor(51, 65, 85);
  const perspectiveIntro = doc.splitTextToSize(
    'Esta seção consolida as constatações de campo separando de forma rigorosa o fato observado, a análise crítica do Advisor Operacional GUIDEWAY (olhar externo especializado para calibragem da gestão) e a ação recomendada.',
    contentWidth - 8
  );
  doc.text(perspectiveIntro, margin + 4, cursorY + 6);
  cursorY += 22;

  for (let i = 0; i < round.findings.length; i++) {
    const f = round.findings[i];
    const seqStr = String(i + 1).padStart(2, '0');

    if (cursorY > pageHeight - 65) {
      doc.addPage();
      cursorY = 22;
    }

    // Finding Header Bar
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(margin, cursorY, contentWidth, 10, 1.2, 1.2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`OPORTUNIDADE #${seqStr}  ·  ${f.area}`, margin + 4, cursorY + 6.5);

    // Criticality Badge inside Header
    const critColors: Record<CriticalityLevel, [number, number, number]> = {
      [CriticalityLevel.CRITICA]: [220, 38, 38],
      [CriticalityLevel.ALTA]: [249, 115, 22],
      [CriticalityLevel.MEDIA]: [217, 119, 6],
      [CriticalityLevel.BAIXA]: [16, 185, 129],
    };
    const [cr, cg, cb] = critColors[f.criticality] || [100, 116, 139];
    doc.setFillColor(cr, cg, cb);
    doc.roundedRect(pageWidth - margin - 38, cursorY + 1.8, 35, 6.4, 1, 1, 'F');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`CRITICIDADE: ${f.criticality}`, pageWidth - margin - 20.5, cursorY + 6, {
      align: 'center',
    });

    cursorY += 13;

    // Sub-metadata row: Tipo & Horário
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Tipo: ${f.type}    |    Horário do Registro: ${f.timeFormatted}`,
      margin,
      cursorY
    );
    cursorY += 5.5;

    // 1. O QUE FOI OBSERVADO
    const obsText = f.observation || 'Não informado.';
    const obsLines = doc.splitTextToSize(obsText, contentWidth - 6);
    const obsBlockH = obsLines.length * 4.5 + 8;

    if (cursorY + obsBlockH > pageHeight - 20) {
      doc.addPage();
      cursorY = 22;
    }

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, cursorY, contentWidth, obsBlockH, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('O QUE FOI OBSERVADO', margin + 3, cursorY + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(obsLines, margin + 3, cursorY + 10);
    cursorY += obsBlockH + 3;

    // 2. VISÃO / ANÁLISE DO ADVISOR (Prominent Guideway Highlight)
    const analysisText =
      f.advisorAnalysis ||
      'Análise técnica em consolidação pelo Advisor Operacional.';
    const analysisLines = doc.splitTextToSize(analysisText, contentWidth - 8);
    const analysisBlockH = analysisLines.length * 4.5 + 9;

    if (cursorY + analysisBlockH > pageHeight - 20) {
      doc.addPage();
      cursorY = 22;
    }

    doc.setFillColor(240, 253, 244); // Subtle green tint
    doc.setDrawColor(94, 168, 58);
    doc.rect(margin, cursorY, contentWidth, analysisBlockH, 'FD');
    doc.setFillColor(94, 168, 58);
    doc.rect(margin, cursorY, 2.2, analysisBlockH, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(45, 90, 27);
    doc.text('VISÃO / ANÁLISE DO ADVISOR GUIDEWAY', margin + 5, cursorY + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(analysisLines, margin + 5, cursorY + 10.2);
    cursorY += analysisBlockH + 3;

    // 3. RECOMENDAÇÃO + RESPONSÁVEL + PRAZO
    const recText = f.recommendation || 'A definir em conjunto com a gestão da área.';
    const recLines = doc.splitTextToSize(recText, contentWidth - 6);
    const recBlockH = recLines.length * 4.5 + 15;

    if (cursorY + recBlockH > pageHeight - 20) {
      doc.addPage();
      cursorY = 22;
    }

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, cursorY, contentWidth, recBlockH, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('RECOMENDAÇÃO', margin + 3, cursorY + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(recLines, margin + 3, cursorY + 10);

    const metaRowY = cursorY + recBlockH - 3.2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Responsável / Área: ${f.responsible || 'A definir'}     ·     Prazo sugerido: ${f.deadline || 'A definir'}`,
      margin + 3,
      metaRowY
    );
    cursorY += recBlockH + 4;

    // 4. PHOTOGRAPHS (Maintaining strict aspect ratio, never distorted, sequential numbering)
    if (f.photos && f.photos.length > 0) {
      const colWidth = (contentWidth - 6) / 2; // 2 photos per row max
      const maxBoxH = 58;

      let colIdx = 0;
      let rowMaxH = 0;

      for (let pIdx = 0; pIdx < f.photos.length; pIdx++) {
        const photo = f.photos[pIdx];
        const ratio =
          photo.width && photo.height ? photo.width / photo.height : 4 / 3;

        // Calculate proportional width & height inside bounding box (colWidth x maxBoxH)
        let drawW = colWidth;
        let drawH = drawW / ratio;
        if (drawH > maxBoxH) {
          drawH = maxBoxH;
          drawW = drawH * ratio;
        }

        if (colIdx === 0 && cursorY + maxBoxH + 10 > pageHeight - 18) {
          doc.addPage();
          cursorY = 22;
        }

        const cellX = margin + colIdx * (colWidth + 6);
        const offsetX = cellX + (colWidth - drawW) / 2;

        // Clean background frame
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.rect(cellX, cursorY, colWidth, drawH + 7, 'FD');

        try {
          doc.addImage(photo.dataUrl, 'JPEG', offsetX, cursorY + 1, drawW, drawH);
        } catch {
          // Fallback if PNG dataUrl
          try {
            doc.addImage(photo.dataUrl, 'PNG', offsetX, cursorY + 1, drawW, drawH);
          } catch {
            // ignore corrupted image
          }
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        doc.text(
          `Foto #${seqStr}.${pIdx + 1} — ${f.area}`,
          cellX + 3,
          cursorY + drawH + 5.2
        );

        rowMaxH = Math.max(rowMaxH, drawH + 9);
        colIdx++;

        if (colIdx === 2 || pIdx === f.photos.length - 1) {
          cursorY += rowMaxH + 3;
          colIdx = 0;
          rowMaxH = 0;
        }
      }
    }

    cursorY += 6;
  }

  // =========================================================================
  // SECTION 17: PLANO DE AÇÃO RECOMENDADO
  // =========================================================================
  doc.addPage();
  cursorY = 22;

  doc.setFillColor(15, 23, 42);
  doc.rect(margin, cursorY, 3, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(15, 23, 42);
  doc.text('4. PLANO DE AÇÃO RECOMENDADO', margin + 6, cursorY + 4.8);
  cursorY += 10;

  const tableRows = round.findings.map((f, idx) => [
    String(idx + 1).padStart(2, '0'),
    f.area,
    f.observation || f.type,
    f.criticality,
    f.recommendation || 'Definir plano de tratativa com gestor da área',
    f.responsible || 'A definir',
    f.deadline || 'A definir',
  ]);

  autoTable(doc, {
    startY: cursorY,
    head: [
      [
        '#',
        'Área',
        'Oportunidade',
        'Criticidade',
        'Ação Recomendada',
        'Responsável',
        'Prazo',
      ],
    ],
    body:
      tableRows.length > 0
        ? tableRows
        : [['-', '-', 'Nenhuma oportunidade registrada', '-', '-', '-', '-']],
    margin: { left: margin, right: margin, bottom: 18 },
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 9, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 26, fontStyle: 'bold' },
      2: { cellWidth: 42 },
      3: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 45 },
      5: { cellWidth: 22 },
      6: { cellWidth: 16, halign: 'center' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        const val = String(data.cell.raw);
        if (val === CriticalityLevel.CRITICA) {
          data.cell.styles.textColor = [220, 38, 38];
        } else if (val === CriticalityLevel.ALTA) {
          data.cell.styles.textColor = [234, 88, 12];
        } else if (val === CriticalityLevel.MEDIA) {
          data.cell.styles.textColor = [180, 83, 9];
        } else if (val === CriticalityLevel.BAIXA) {
          data.cell.styles.textColor = [5, 150, 105];
        }
      }
    },
  });

  // =========================================================================
  // SECTION 18: FINAL PAGE (CLOSING CORPORATE PAGE)
  // =========================================================================
  doc.addPage();
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Subtle decorative green bar
  doc.setFillColor(94, 168, 58);
  doc.rect(margin, pageHeight / 2 - 48, 24, 1.5, 'F');

  if (logoDarkDataUrl) {
    doc.addImage(
      logoDarkDataUrl,
      'PNG',
      (pageWidth - 96) / 2,
      pageHeight / 2 - 38,
      96,
      31.8
    );
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('GUIDEWAY', pageWidth / 2, pageHeight / 2 + 10, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(203, 213, 225);
  const missionLines = doc.splitTextToSize(
    'Promover a Excelência nas empresas por meio da Educação e Transformação.',
    140
  );
  doc.text(missionLines, pageWidth / 2, pageHeight / 2 + 20, {
    align: 'center',
  });

  // Final Page Footer
  doc.setDrawColor(51, 65, 85);
  doc.line(margin, pageHeight - 36, pageWidth - margin, pageHeight - 36);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Documento gerado pelo aplicativo GUIDEWAY Industrial Round.',
    pageWidth / 2,
    pageHeight - 26,
    { align: 'center' }
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(94, 168, 58);
  doc.text(
    `Data: ${round.endDate || round.date}   ·   ID da Ronda: ${round.id}`,
    pageWidth / 2,
    pageHeight - 18,
    { align: 'center' }
  );

  // Add headers and footers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p < totalPages; p++) {
    doc.setPage(p);
    addHeaderAndFooter(p, totalPages);
  }

  // Silence unused variable warning if light logo wasn't needed
  void logoLightDataUrl;

  const safeClient = (round.clientCompany || 'Empresa')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 24);
  const filename = `Relatorio_Ronda_${round.id}_${safeClient}.pdf`;
  const blob = doc.output('blob');

  return { blob, filename };
}

/**
 * Handles Section 19: Native Sharing (WhatsApp, Email, AirDrop, Files) or direct PDF download.
 */
export async function shareOrDownloadRoundPdf(
  round: Round,
  mode: 'share' | 'download'
): Promise<{ sharedNatively: boolean; filename: string }> {
  const { blob, filename } = await generateRoundPdfBlob(round);

  if (mode === 'share' && typeof navigator !== 'undefined' && navigator.share) {
    const file = new File([blob], filename, { type: 'application/pdf' });
    const shareData: ShareData = {
      title: `Relatório de Ronda Industrial — ${round.id}`,
      text: `Relatório de Ronda Operacional GUIDEWAY realizado em ${round.clientCompany} (${round.plantUnit}) — ${round.date}.`,
      files: [file],
    };

    if (!navigator.canShare || navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return { sharedNatively: true, filename };
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') {
          return { sharedNatively: false, filename };
        }
        // Fallback to download if file share failed
      }
    }
  }

  // Trigger standard browser download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 5000);

  return { sharedNatively: false, filename };
}
