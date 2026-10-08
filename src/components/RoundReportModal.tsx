import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  Printer,
  Share2,
} from 'lucide-react';
import { CRITICALITY_CONFIG, CriticalityLevel, Round } from '../types/round';
import {
  computeRoundStatistics,
  shareOrDownloadRoundPdf,
} from '../utils/pdfGenerator';

interface RoundReportViewProps {
  round: Round;
  onBack: () => void;
  onReopenRound?: (round: Round) => void;
}

export const RoundReportView: React.FC<RoundReportViewProps> = ({
  round,
  onBack,
  onReopenRound,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const stats = computeRoundStatistics(round);

  const handlePdfAction = async (mode: 'share' | 'download') => {
    setIsGenerating(true);
    setFeedbackMsg(null);
    try {
      const result = await shareOrDownloadRoundPdf(round, mode);
      if (result.sharedNatively) {
        setFeedbackMsg('Relatório PDF (1 página) compartilhado com sucesso.');
      } else {
        setFeedbackMsg(`PDF de 1 página gerado: ${result.filename}`);
      }
    } catch {
      setFeedbackMsg('Não foi possível gerar o PDF. Tente novamente.');
    } finally {
      setIsGenerating(false);
      setTimeout(() => setFeedbackMsg(null), 5000);
    }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-100 pb-28">
      {/* Top Action Bar */}
      <div className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 px-3 sm:px-4 py-3 no-print">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
          <button
            onClick={onBack}
            className="min-h-[42px] px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>

          <div className="flex items-center gap-2 min-w-0">
            {onReopenRound && (
              <button
                onClick={() => onReopenRound(round)}
                className="min-h-[42px] px-3 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-colors cursor-pointer whitespace-nowrap"
              >
                Reabrir Ronda
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="hidden sm:flex min-h-[42px] px-3.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={() => handlePdfAction('download')}
              disabled={isGenerating}
              className="hidden sm:flex min-h-[42px] px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-semibold text-white items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-[#5EA83A]" />
              <span>{isGenerating ? 'Gerando PDF...' : 'Baixar PDF (1 Pág.)'}</span>
            </button>
            <button
              onClick={() => handlePdfAction('share')}
              disabled={isGenerating}
              className="min-h-[42px] px-3.5 sm:px-4 rounded-xl bg-[#5EA83A] hover:bg-[#4e8f2f] text-xs font-bold text-white flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shadow-xs disabled:opacity-50"
            >
              <Share2 className="w-4 h-4 shrink-0" />
              <span className="truncate">COMPARTILHAR PDF</span>
            </button>
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div className="max-w-5xl mx-auto px-3 sm:px-4 mt-3 no-print">
          <div className="rounded-xl bg-emerald-900 text-emerald-50 px-4 py-3 text-xs sm:text-sm font-medium flex items-center gap-2 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        </div>
      )}

      {/* Corporate Single-Page Style Document Container */}
      <div className="max-w-5xl mx-auto px-3 sm:px-4 pt-5 space-y-5">
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          {/* Header without Graphical Logo */}
          <div className="bg-slate-900 text-white p-5 sm:p-7 border-b-4 border-[#5EA83A]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-[#5EA83A] font-semibold">
                  RELATÓRIO EXECUTIVO (FORMATO PDF 1 PÁGINA) · {round.id}
                </p>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
                  RELATÓRIO DE RONDA INDUSTRIAL
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                  Diagnóstico Operacional de Campo
                </p>
              </div>
              <div className="sm:text-right text-xs text-slate-300 font-mono">
                <p>Data: {round.date}</p>
                <p>
                  Horário: {round.startTime} às {round.endTime || 'Em aberto'}
                </p>
                {round.durationFormatted && (
                  <p>Duração: {round.durationFormatted}</p>
                )}
              </div>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="p-5 sm:p-6 bg-slate-50/70 grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-slate-200">
            <div>
              <p className="text-xs text-slate-500 font-medium">Cliente / Empresa</p>
              <p className="text-base font-bold text-slate-900 mt-0.5">
                {round.clientCompany}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Unidade / Planta</p>
              <p className="text-base font-bold text-slate-900 mt-0.5">
                {round.plantUnit}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Advisor Operacional</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">
                {round.advisorName}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{round.advisorRole}</p>
            </div>
          </div>

          {/* RESUMO EXECUTIVO */}
          <div className="p-5 sm:p-6 space-y-5">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-slate-900 rounded-xs inline-block" />
                <span>RESUMO EXECUTIVO</span>
              </h2>
              <p className="mt-2.5 text-sm text-slate-700 leading-relaxed">
                Durante a ronda operacional realizada na unidade{' '}
                <strong className="text-slate-900">
                  {round.clientCompany} ({round.plantUnit})
                </strong>
                , foram identificadas{' '}
                <strong className="text-slate-900 font-mono tabular-nums">
                  {stats.total}
                </strong>{' '}
                oportunidades de atenção distribuídas entre{' '}
                <strong className="text-slate-900 font-mono tabular-nums">
                  {stats.distinctAreasCount}
                </strong>{' '}
                áreas operacionais.
              </p>
            </div>

            {/* Summary KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div className="p-3.5 rounded-xl bg-slate-900 text-white">
                <p className="text-xs text-slate-300 font-medium">Total</p>
                <p className="text-2xl font-bold font-mono tabular-nums mt-1">
                  {stats.total}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200">
                <p className="text-xs text-red-800 font-semibold">🔴 Críticas</p>
                <p className="text-2xl font-bold text-red-900 font-mono tabular-nums mt-1">
                  {stats.byCriticality[CriticalityLevel.CRITICA]}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-orange-50 border border-orange-200">
                <p className="text-xs text-orange-800 font-semibold">🟠 Altas</p>
                <p className="text-2xl font-bold text-orange-900 font-mono tabular-nums mt-1">
                  {stats.byCriticality[CriticalityLevel.ALTA]}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-xs text-amber-900 font-semibold">🟡 Médias</p>
                <p className="text-2xl font-bold text-amber-950 font-mono tabular-nums mt-1">
                  {stats.byCriticality[CriticalityLevel.MEDIA]}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 col-span-2 sm:col-span-1">
                <p className="text-xs text-emerald-800 font-semibold">🟢 Baixas</p>
                <p className="text-2xl font-bold text-emerald-900 font-mono tabular-nums mt-1">
                  {stats.byCriticality[CriticalityLevel.BAIXA]}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* QUADRO CONSOLIDADO DE OPORTUNIDADES (SEM ANÁLISE / SEM RECOMENDAÇÃO) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-xs">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-[#5EA83A] rounded-xs inline-block" />
            <span>OPORTUNIDADES REGISTRADAS ({round.findings.length})</span>
          </h2>

          {round.findings.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">
              Nenhuma oportunidade foi registrada nesta ronda.
            </div>
          ) : (
            <div className="space-y-4">
              {round.findings.map((f, index) => {
                const seq = String(index + 1).padStart(2, '0');
                const critCfg = CRITICALITY_CONFIG[f.criticality];

                return (
                  <div
                    key={f.id}
                    className="rounded-xl border border-slate-200 overflow-hidden bg-white"
                  >
                    <div className="bg-slate-900 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <span className="font-mono font-bold text-[#5EA83A]">
                          #{seq}
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className="font-bold">{f.area}</span>
                        <span className="text-slate-600">·</span>
                        <span className="text-slate-300 text-xs">{f.type}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono text-slate-300">
                          {f.timeFormatted}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-xs ${critCfg.activeBgClass}`}
                        >
                          {critCfg.label}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      <div>
                        <p className="text-xs font-bold text-slate-600">
                          OBSERVAÇÃO CONSTATADA
                        </p>
                        <p className="text-sm text-slate-900 mt-1 leading-relaxed whitespace-pre-line">
                          {f.observation || 'Registro fotográfico em campo.'}
                        </p>
                      </div>

                      <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-x-6 gap-y-1.5 text-xs text-slate-600">
                        <div>
                          <span className="font-semibold text-slate-900">
                            Responsável / Área:
                          </span>{' '}
                          <span>{f.responsible || 'A definir'}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900">
                            Prazo sugerido:
                          </span>{' '}
                          <span className="font-mono font-semibold text-slate-900">
                            {f.deadline || 'A definir'}
                          </span>
                        </div>
                      </div>

                      {f.photos && f.photos.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                          {f.photos.map((photo, pIdx) => (
                            <figure
                              key={photo.id}
                              className="rounded-xl border border-slate-200 bg-slate-50 p-2 flex flex-col justify-between"
                            >
                              <div className="w-full flex items-center justify-center bg-slate-900/5 rounded-lg overflow-hidden">
                                <img
                                  src={photo.dataUrl}
                                  alt={`Foto ${seq}.${pIdx + 1}`}
                                  referrerPolicy="no-referrer"
                                  className="max-h-44 w-auto h-auto object-contain mx-auto"
                                />
                              </div>
                              <figcaption className="mt-1.5 px-1 flex items-center justify-between text-[11px] text-slate-600 font-mono">
                                <span className="font-semibold text-slate-800">
                                  Foto #{seq}.{pIdx + 1}
                                </span>
                                <span>{photo.timestamp}</span>
                              </figcaption>
                            </figure>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Fixed Bottom Action Bar — Strictly Contained */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2.5 sm:hidden no-print">
        <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
          <button
            onClick={() => handlePdfAction('download')}
            disabled={isGenerating}
            className="min-h-[48px] px-2 rounded-xl bg-slate-900 text-white font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer min-w-0"
          >
            <FileText className="w-4 h-4 text-[#5EA83A] shrink-0" />
            <span className="truncate">
              {isGenerating ? 'Gerando...' : 'BAIXAR PDF (1 PÁG)'}
            </span>
          </button>
          <button
            onClick={() => handlePdfAction('share')}
            disabled={isGenerating}
            className="min-h-[48px] px-2 rounded-xl bg-[#5EA83A] text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer min-w-0"
          >
            <Share2 className="w-4 h-4 shrink-0" />
            <span className="truncate">COMPARTILHAR</span>
          </button>
        </div>
      </div>
    </div>
  );
};
