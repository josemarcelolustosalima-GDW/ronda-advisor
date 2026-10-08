import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  CriticalityLevel,
  FindingType,
  OPERATIONAL_AREAS_LIST,
  Round,
} from '../types/round';

/**
 * Renders a compact corporate horizontal bar chart onto an offscreen canvas
 * and returns a PNG Data URL for clean embedding in the 1-page executive PDF report.
 */
function renderCompactChartDataUrl(
  title: string,
  items: { label: string; count: number; color: string }[]
): string {
  const width = 640;
  const height = 240;
  const activeItems =
    items.length > 0
      ? items.slice(0, 4)
      : [{ label: 'Sem registros', count: 0, color: '#94A3B8' }];

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Card background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Border
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);

  // Top accent bar
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(0, 0, width, 5);

  // Title
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 18px Arial, Helvetica, sans-serif';
  ctx.fillText(title, 20, 34);

  const maxCount = Math.max(...activeItems.map((i) => i.count), 1);
  const startY = 54;
  const rowHeight = 42;
  const labelX = 20;
  const barStartX = 235;
  const maxBarWidth = 330;

  activeItems.forEach((item, idx) => {
    const y = startY + idx * rowHeight;

    ctx.fillStyle = '#334155';
    ctx.font = 'bold 15px Arial, Helvetica, sans-serif';
    const truncatedLabel =
      item.label.length > 22 ? item.label.substring(0, 21) + '…' : item.label;
    ctx.fillText(truncatedLabel, labelX, y + 18);

    // Track
    ctx.fillStyle = '#F1F5F9';
    ctx.fillRect(barStartX, y + 4, maxBarWidth, 18);

    // Bar
    const barW =
      item.count > 0
        ? Math.max(Math.round((item.count / maxCount) * maxBarWidth), 10)
        : 0;
    if (barW > 0) {
      ctx.fillStyle = item.color;
      ctx.fillRect(barStartX, y + 4, barW, 18);
    }

    // Count
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(String(item.count), barStartX + maxBarWidth + 14, y + 19);
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
 * Generates a strictly SINGLE-PAGE (1 página apenas) corporate PDF report
 * without graphical logo and without the excluded fields (Análise do Advisor / Recomendação).
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

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 10;
  const contentWidth = pageWidth - margin * 2; // 190mm

  const stats = computeRoundStatistics(round);

  // =========================================================================
  // 1. COMPACT EXECUTIVE HEADER (0mm to 22mm) — NO GRAPHICAL LOGO
  // =========================================================================
  doc.setFillColor(15, 23, 42); // #0F172A
  doc.rect(0, 0, pageWidth, 21, 'F');
  doc.setFillColor(94, 168, 58); // #5EA83A
  doc.rect(0, 21, pageWidth, 1.2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('RELATÓRIO DE RONDA INDUSTRIAL', margin, 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Diagnóstico e Registro de Oportunidades Operacionais', margin, 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(94, 168, 58);
  doc.text(`ID DA RONDA: ${round.id}`, pageWidth - margin, 10, {
    align: 'right',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(226, 232, 240);
  doc.text(
    `Data: ${round.date}  |  Início: ${round.startTime} — Fim: ${round.endTime || 'Em aberto'} (${round.durationFormatted || '-'})`,
    pageWidth - margin,
    16,
    { align: 'right' }
  );

  let cursorY = 26;

  // =========================================================================
  // 2. METADATA & EXECUTIVE SUMMARY (26mm to 62mm)
  // =========================================================================
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, cursorY, contentWidth, 15, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('CLIENTE / EMPRESA', margin + 4, cursorY + 5);
  doc.text('UNIDADE / PLANTA', margin + 70, cursorY + 5);
  doc.text('ADVISOR OPERACIONAL', margin + 132, cursorY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(
    (round.clientCompany || '-').substring(0, 34),
    margin + 4,
    cursorY + 11
  );
  doc.text(
    (round.plantUnit || '-').substring(0, 32),
    margin + 70,
    cursorY + 11
  );
  doc.text(
    (round.advisorName || '-').substring(0, 30),
    margin + 132,
    cursorY + 11
  );

  cursorY += 18;

  // 1-Line Executive Summary + 5 KPI Boxes
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(51, 65, 85);
  const summaryLine = `Resumo Executivo: Foram identificadas ${stats.total} oportunidades de atenção distribuídas entre ${stats.distinctAreasCount} áreas operacionais na unidade ${round.clientCompany} (${round.plantUnit}).`;
  doc.text(summaryLine.substring(0, 125), margin, cursorY);
  cursorY += 3;

  const kpiWidth = (contentWidth - 8) / 5;
  const kpis = [
    {
      label: 'TOTAL REGISTROS',
      count: stats.total,
      r: 15,
      g: 23,
      b: 42,
      bgR: 241,
      bgG: 245,
      bgB: 249,
    },
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
      label: 'ALTAS',
      count: stats.byCriticality[CriticalityLevel.ALTA],
      r: 234,
      g: 88,
      b: 12,
      bgR: 255,
      bgG: 247,
      bgB: 237,
    },
    {
      label: 'MÉDIAS',
      count: stats.byCriticality[CriticalityLevel.MEDIA],
      r: 180,
      g: 83,
      b: 9,
      bgR: 255,
      bgG: 251,
      bgB: 235,
    },
    {
      label: 'BAIXAS',
      count: stats.byCriticality[CriticalityLevel.BAIXA],
      r: 5,
      g: 150,
      b: 105,
      bgR: 236,
      bgG: 253,
      bgB: 245,
    },
  ];

  kpis.forEach((kpi, idx) => {
    const x = margin + idx * (kpiWidth + 2);
    doc.setFillColor(kpi.bgR, kpi.bgG, kpi.bgB);
    doc.setDrawColor(kpi.r, kpi.g, kpi.b);
    doc.setLineWidth(0.25);
    doc.roundedRect(x, cursorY, kpiWidth, 12.5, 1, 1, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(kpi.r, kpi.g, kpi.b);
    doc.text(kpi.label, x + 3, cursorY + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(String(kpi.count), x + 3, cursorY + 10.5);
  });

  cursorY += 16;

  // =========================================================================
  // 3. SIDE-BY-SIDE COMPACT CHARTS (31mm tall)
  // =========================================================================
  const halfWidth = (contentWidth - 4) / 2; // 93mm each
  const chartHeight = 30;

  const areaChartUrl = renderCompactChartDataUrl(
    'OPORTUNIDADES POR ÁREA',
    stats.byArea.slice(0, 4).map((item) => ({
      label: item.label,
      count: item.count,
      color: '#0F172A',
    }))
  );
  const typeChartUrl = renderCompactChartDataUrl(
    'OPORTUNIDADES POR TIPO',
    stats.byType.slice(0, 4).map((item) => ({
      label: item.label,
      count: item.count,
      color: '#5EA83A',
    }))
  );

  if (areaChartUrl) {
    doc.addImage(areaChartUrl, 'PNG', margin, cursorY, halfWidth, chartHeight);
  }
  if (typeChartUrl) {
    doc.addImage(
      typeChartUrl,
      'PNG',
      margin + halfWidth + 4,
      cursorY,
      halfWidth,
      chartHeight
    );
  }

  cursorY += chartHeight + 5;

  // =========================================================================
  // 4. SINGLE-PAGE CONSOLIDATED OPPORTUNITIES TABLE
  // =========================================================================
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, cursorY, 2.5, 4.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('OPORTUNIDADES REGISTRADAS E PLANO DE ACOMPANHAMENTO', margin + 4.5, cursorY + 3.6);
  cursorY += 6;

  // Flatten all photos across findings to know if we need space for the photo strip at the bottom
  const allPhotos: {
    seqStr: string;
    area: string;
    dataUrl: string;
    width: number;
    height: number;
  }[] = [];

  round.findings.forEach((f, idx) => {
    const seqStr = String(idx + 1).padStart(2, '0');
    f.photos?.forEach((p) => {
      if (allPhotos.length < 4) {
        allPhotos.push({
          seqStr,
          area: f.area,
          dataUrl: p.dataUrl,
          width: p.width,
          height: p.height,
        });
      }
    });
  });

  const maxFindingsToFit = Math.min(round.findings.length, 14);
  const dynamicFontSize =
    maxFindingsToFit > 10 ? 6.5 : maxFindingsToFit > 6 ? 7.2 : 7.8;
  const dynamicPadding = maxFindingsToFit > 10 ? 1.2 : 1.8;
  const maxObsChars = maxFindingsToFit > 10 ? 95 : 140;

  const tableRows = round.findings.slice(0, maxFindingsToFit).map((f, idx) => {
    const obsClean = (f.observation || 'Registro fotográfico em campo').replace(
      /\s+/g,
      ' '
    );
    const obsTruncated =
      obsClean.length > maxObsChars
        ? obsClean.substring(0, maxObsChars - 1) + '…'
        : obsClean;

    return [
      String(idx + 1).padStart(2, '0'),
      f.timeFormatted || '-',
      f.area,
      f.type,
      f.criticality,
      obsTruncated,
      (f.responsible || 'A definir').substring(0, 22),
      f.deadline || 'A definir',
    ];
  });

  autoTable(doc, {
    startY: cursorY,
    head: [
      [
        '#',
        'Hora',
        'Área',
        'Tipo',
        'Criticidade',
        'Observação Constatada',
        'Responsável',
        'Prazo',
      ],
    ],
    body:
      tableRows.length > 0
        ? tableRows
        : [['-', '-', '-', '-', '-', 'Nenhuma oportunidade registrada na ronda.', '-', '-']],
    margin: { left: margin, right: margin, bottom: 14 },
    pageBreak: 'avoid',
    rowPageBreak: 'avoid',
    styles: {
      font: 'helvetica',
      fontSize: dynamicFontSize,
      cellPadding: dynamicPadding,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: dynamicFontSize,
    },
    columnStyles: {
      0: { cellWidth: 7, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 11, halign: 'center' },
      2: { cellWidth: 26, fontStyle: 'bold' },
      3: { cellWidth: 25 },
      4: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      5: { cellWidth: 63 },
      6: { cellWidth: 24 },
      7: { cellWidth: 16, halign: 'center' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 4) {
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

  // Get Y position after table
  const finalTableY =
    (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable
      ?.finalY || cursorY + 45;
  cursorY = finalTableY + 4;

  // =========================================================================
  // 5. COMPACT PHOTOGRAPHIC EVIDENCE STRIP (IF SPACE PERMITS ON PAGE 1)
  // =========================================================================
  const maxFooterY = pageHeight - 13; // 284mm
  const availablePhotoHeight = maxFooterY - cursorY;

  if (allPhotos.length > 0 && availablePhotoHeight >= 28) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('EVIDÊNCIAS FOTOGRÁFICAS SELECIONADAS', margin, cursorY + 3);
    cursorY += 5;

    const boxHeight = Math.min(availablePhotoHeight - 9, 36);
    const colGap = 3;
    const colWidth = (contentWidth - colGap * 3) / 4; // 4 columns

    allPhotos.slice(0, 4).forEach((photo, idx) => {
      const cellX = margin + idx * (colWidth + colGap);
      const ratio =
        photo.width && photo.height ? photo.width / photo.height : 4 / 3;

      let drawW = colWidth - 2;
      let drawH = drawW / ratio;
      if (drawH > boxHeight - 6) {
        drawH = boxHeight - 6;
        drawW = drawH * ratio;
      }

      const offsetX = cellX + (colWidth - drawW) / 2;

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.rect(cellX, cursorY, colWidth, boxHeight, 'FD');

      try {
        doc.addImage(photo.dataUrl, 'JPEG', offsetX, cursorY + 1, drawW, drawH);
      } catch {
        try {
          doc.addImage(photo.dataUrl, 'PNG', offsetX, cursorY + 1, drawW, drawH);
        } catch {
          // ignore
        }
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(51, 65, 85);
      doc.text(
        `#${photo.seqStr} · ${photo.area.substring(0, 14)}`,
        cellX + 2,
        cursorY + boxHeight - 1.5
      );
    });
  }

  // =========================================================================
  // STRICT 1-PAGE ENFORCEMENT & FOOTER
  // =========================================================================
  while (doc.getNumberOfPages() > 1) {
    doc.deletePage(doc.getNumberOfPages());
  }

  doc.setPage(1);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Relatório de Ronda Industrial · ${round.clientCompany} (${round.plantUnit}) · ID: ${round.id}`,
    margin,
    pageHeight - 5.5
  );
  doc.setFont('helvetica', 'bold');
  doc.text('Página 1 de 1', pageWidth - margin, pageHeight - 5.5, {
    align: 'right',
  });

  const safeClient = (round.clientCompany || 'Empresa')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 24);
  const filename = `Relatorio_Ronda_${round.id}_${safeClient}.pdf`;
  const blob = doc.output('blob');

  return { blob, filename };
}

/**
 * Handles Native Sharing (WhatsApp, Email, AirDrop, Files) or direct PDF download.
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
      text: `Relatório de Ronda Operacional realizado em ${round.clientCompany} (${round.plantUnit}) — ${round.date}.`,
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
      }
    }
  }

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
