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
import { GuidewayLogo } from './GuidewayLogo';
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
        setFeedbackMsg('Relatório compartilhado com sucesso.');
      } else {
        setFeedbackMsg(`PDF gerado: ${result.filename}`);
      }
    } catch {
      setFeedbackMsg('Não foi possível gerar o PDF. Tente novamente.');
    } finally {
      setIsGenerating(false);
      setTimeout(() => setFeedbackMsg(null), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-28">
      {/* Top Action Bar */}
      <div className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 px-4 py-3 no-print">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="min-h-[44px] px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>

          <div className="flex items-center gap-2 overflow-x-auto">
            {onReopenRound && (
              <button
                onClick={() => onReopenRound(round)}
                className="min-h-[44px] px-3.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-colors cursor-pointer whitespace-nowrap"
              >
                Reabrir Ronda
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="hidden sm:flex min-h-[44px] px-3.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={() => handlePdfAction('download')}
              disabled={isGenerating}
              className="min-h-[44px] px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-[#5EA83A]" />
              <span>{isGenerating ? 'Gerando PDF...' : 'Baixar PDF'}</span>
            </button>
            <button
              onClick={() => handlePdfAction('share')}
              disabled={isGenerating}
              className="min-h-[44px] px-4 rounded-xl bg-[#5EA83A] hover:bg-[#4e8f2f] text-xs font-bold text-white flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shadow-sm disabled:opacity-50"
            >
              <Share2 className="w-4 h-4" />
              <span>COMPARTILHAR RELATÓRIO</span>
            </button>
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div className="max-w-5xl mx-auto px-4 mt-4 no-print">
          <div className="rounded-xl bg-emerald-900 text-emerald-50 px-4 py-3 text-sm font-medium flex items-center gap-2 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        </div>
      )}

      {/* Corporate Document Container */}
      <div className="max-w-5xl mx-auto px-4 pt-6 space-y-6">
        {/* 12. COVER / HEADER */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="bg-slate-900 text-white p-6 sm:p-8 border-b-4 border-[#5EA83A]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <GuidewayLogo variant="dark" size="lg" showTagline={true} />
              <div className="sm:text-right">
                <p className="text-xs font-mono uppercase tracking-widest text-[#5EA83A] font-semibold">
                  ID DA RONDA · {round.id}
                </p>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
                  RELATÓRIO DE RONDA INDUSTRIAL
                </h1>
                <p className="text-sm text-slate-300 mt-0.5">
                  Advisor Operacional GUIDEWAY
                </p>
              </div>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="p-6 sm:p-8 bg-slate-50/70 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 border-b border-slate-200">
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
              <p className="text-xs text-slate-500 font-medium">Data e Horário</p>
              <p className="text-sm font-semibold text-slate-900 mt-0.5 font-mono tabular-nums">
                {round.date} · {round.startTime} às {round.endTime || 'Em aberto'}
              </p>
              {round.durationFormatted && (
                <p className="text-xs text-slate-500 mt-0.5">
                  Duração total: {round.durationFormatted}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Advisor Operacional</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">
                {round.advisorName}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{round.advisorRole}</p>
            </div>
          </div>

          {round.objective && (
            <div className="px-6 sm:px-8 py-4 bg-white border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-500">
                Objetivo da Ronda
              </p>
              <p className="text-sm text-slate-700 mt-1 leading-relaxed">
                {round.objective}
              </p>
            </div>
          )}

          {/* 13. RESUMO EXECUTIVO */}
          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-slate-900 rounded-xs inline-block" />
                <span>RESUMO EXECUTIVO</span>
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-700 leading-relaxed">
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
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-4 rounded-xl bg-slate-900 text-white">
                <p className="text-xs text-slate-300 font-medium">Total de Registros</p>
                <p className="text-2xl font-bold font-mono tabular-nums mt-1">
                  {stats.total}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                <p className="text-xs text-red-800 font-semibold">🔴 Críticas</p>
                <p className="text-2xl font-bold text-red-900 font-mono tabular-nums mt-1">
                  {stats.byCriticality[CriticalityLevel.CRITICA]}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-orange-50 border border-orange-200">
                <p className="text-xs text-orange-800 font-semibold">🟠 Altas</p>
                <p className="text-2xl font-bold text-orange-900 font-mono tabular-nums mt-1">
                  {stats.byCriticality[CriticalityLevel.ALTA]}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-xs text-amber-900 font-semibold">🟡 Médias</p>
                <p className="text-2xl font-bold text-amber-950 font-mono tabular-nums mt-1">
                  {stats.byCriticality[CriticalityLevel.MEDIA]}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 col-span-2 sm:col-span-1">
                <p className="text-xs text-emerald-800 font-semibold">🟢 Baixas</p>
                <p className="text-2xl font-bold text-emerald-900 font-mono tabular-nums mt-1">
                  {stats.byCriticality[CriticalityLevel.BAIXA]}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 15. INDICADORES VISUAIS */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-[#5EA83A] rounded-xs inline-block" />
            <span>INDICADORES OPERACIONAIS DA RONDA</span>
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Oportunidades por Área */}
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <h3 className="text-xs font-bold text-slate-700 tracking-wide">
                OPORTUNIDADES POR ÁREA
              </h3>
              {stats.byArea.length === 0 ? (
                <p className="text-xs text-slate-400 py-4">Nenhum registro na ronda.</p>
              ) : (
                <div className="space-y-2.5">
                  {stats.byArea.map((item) => {
                    const pct = Math.round(
                      (item.count / Math.max(stats.total, 1)) * 100
                    );
                    return (
                      <div key={item.label} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800 truncate pr-2">
                            {item.label}
                          </span>
                          <span className="font-mono font-bold text-slate-900 tabular-nums">
                            {item.count} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-slate-900 rounded-full"
                            style={{ width: `${Math.max(pct, 6)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Oportunidades por Criticidade */}
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <h3 className="text-xs font-bold text-slate-700 tracking-wide">
                OPORTUNIDADES POR CRITICIDADE
              </h3>
              <div className="space-y-3">
                {[
                  {
                    level: CriticalityLevel.CRITICA,
                    label: '🔴 Crítica',
                    barClass: 'bg-red-600',
                    count: stats.byCriticality[CriticalityLevel.CRITICA],
                  },
                  {
                    level: CriticalityLevel.ALTA,
                    label: '🟠 Alta',
                    barClass: 'bg-orange-500',
                    count: stats.byCriticality[CriticalityLevel.ALTA],
                  },
                  {
                    level: CriticalityLevel.MEDIA,
                    label: '🟡 Média',
                    barClass: 'bg-amber-500',
                    count: stats.byCriticality[CriticalityLevel.MEDIA],
                  },
                  {
                    level: CriticalityLevel.BAIXA,
                    label: '🟢 Baixa',
                    barClass: 'bg-emerald-500',
                    count: stats.byCriticality[CriticalityLevel.BAIXA],
                  },
                ].map((c) => {
                  const pct =
                    stats.total > 0 ? Math.round((c.count / stats.total) * 100) : 0;
                  return (
                    <div key={c.level} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">{c.label}</span>
                        <span className="font-mono font-bold text-slate-900 tabular-nums">
                          {c.count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${c.barClass} rounded-full`}
                          style={{ width: `${c.count > 0 ? Math.max(pct, 6) : 0}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Oportunidades por Tipo */}
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <h3 className="text-xs font-bold text-slate-700 tracking-wide">
                OPORTUNIDADES POR TIPO
              </h3>
              {stats.byType.length === 0 ? (
                <p className="text-xs text-slate-400 py-4">Nenhum registro na ronda.</p>
              ) : (
                <div className="space-y-2.5">
                  {stats.byType.map((item) => {
                    const pct = Math.round(
                      (item.count / Math.max(stats.total, 1)) * 100
                    );
                    return (
                      <div key={item.label} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800 truncate pr-2">
                            {item.label}
                          </span>
                          <span className="font-mono font-bold text-slate-900 tabular-nums">
                            {item.count} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#5EA83A] rounded-full"
                            style={{ width: `${Math.max(pct, 6)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 14 & 16. VISÃO DO ADVISOR OPERACIONAL + DETALHAMENTO DAS OPORTUNIDADES */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-slate-900 rounded-xs inline-block" />
              <span>VISÃO DO ADVISOR OPERACIONAL & CONSTATAÇÕES DETALHADAS</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
              Consolidação técnica elaborada pelo Advisor Operacional GUIDEWAY,
              distinguindo de forma objetiva o fato constatado em fábrica, a
              interpretação especializada de impacto operacional e a ação recomendada
              para calibragem da gestão.
            </p>
          </div>

          {round.findings.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              Nenhuma oportunidade foi registrada nesta ronda.
            </div>
          ) : (
            <div className="space-y-8">
              {round.findings.map((f, index) => {
                const seq = String(index + 1).padStart(2, '0');
                const critCfg = CRITICALITY_CONFIG[f.criticality];

                return (
                  <div
                    key={f.id}
                    className="rounded-2xl border border-slate-200 overflow-hidden bg-white"
                  >
                    {/* Finding Header */}
                    <div className="bg-slate-900 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-[#5EA83A]">
                          OPORTUNIDADE #{seq}
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className="text-sm font-bold tracking-tight">
                          {f.area}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-slate-300">{f.type}</span>
                        <span className="text-slate-600">·</span>
                        <span className="font-mono text-slate-300 tabular-nums">
                          Horário: {f.timeFormatted}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-md font-bold text-xs ${critCfg.activeBgClass}`}
                        >
                          {critCfg.label}
                        </span>
                      </div>
                    </div>

                    {/* Three Distinct Pillars: Observado / Visão do Advisor / Recomendação */}
                    <div className="p-5 space-y-4">
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                        <p className="text-xs font-bold text-slate-700 tracking-wide">
                          O QUE FOI OBSERVADO
                        </p>
                        <p className="text-sm text-slate-900 mt-1.5 leading-relaxed whitespace-pre-line">
                          {f.observation || 'Registro fotográfico em campo.'}
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-emerald-50/60 border-l-4 border-[#5EA83A] border-t border-r border-b border-emerald-200/70">
                        <p className="text-xs font-bold text-[#3d7223] tracking-wide">
                          VISÃO / ANÁLISE DO ADVISOR
                        </p>
                        <p className="text-sm text-slate-900 mt-1.5 leading-relaxed whitespace-pre-line">
                          {f.advisorAnalysis ||
                            'Análise complementar pendente de preenchimento pelo Advisor.'}
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-white border border-slate-200">
                        <p className="text-xs font-bold text-slate-800 tracking-wide">
                          RECOMENDAÇÃO
                        </p>
                        <p className="text-sm text-slate-900 mt-1.5 leading-relaxed whitespace-pre-line">
                          {f.recommendation ||
                            'Definir plano de ação corretiva com o responsável da área.'}
                        </p>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600">
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
                      </div>

                      {/* Photographs maintaining natural aspect ratio */}
                      {f.photos && f.photos.length > 0 && (
                        <div className="pt-2">
                          <p className="text-xs font-bold text-slate-500 mb-3">
                            REGISTROS FOTOGRÁFICOS ({f.photos.length})
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {f.photos.map((photo, pIdx) => (
                              <figure
                                key={photo.id}
                                className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 flex flex-col justify-between"
                              >
                                <div className="w-full flex items-center justify-center bg-slate-900/5 rounded-lg overflow-hidden">
                                  <img
                                    src={photo.dataUrl}
                                    alt={`Foto ${seq}.${pIdx + 1} - ${f.area}`}
                                    referrerPolicy="no-referrer"
                                    className="max-h-72 w-auto h-auto object-contain mx-auto"
                                  />
                                </div>
                                <figcaption className="mt-2 px-1 flex items-center justify-between text-xs text-slate-600 font-mono">
                                  <span className="font-semibold text-slate-800">
                                    Foto #{seq}.{pIdx + 1} — {f.area}
                                  </span>
                                  <span>{photo.timestamp}</span>
                                </figcaption>
                              </figure>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 17. PLANO DE AÇÃO RECOMENDADO */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-xs overflow-hidden">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-[#5EA83A] rounded-xs inline-block" />
            <span>PLANO DE AÇÃO RECOMENDADO</span>
          </h2>
          <p className="text-xs text-slate-500">
             Quadro consolidado para acompanhamento gerencial e desdobramento operacional.
          </p>

          <div className="overflow-x-auto -mx-6 sm:mx-0 px-6 sm:px-0">
            <table className="w-full text-left border-collapse min-w-[720px]">
              <thead>
                <tr className="bg-slate-900 text-white text-xs">
                  <th className="py-3 px-3 font-semibold rounded-tl-lg w-12">#</th>
                  <th className="py-3 px-3 font-semibold w-36">Área</th>
                  <th className="py-3 px-3 font-semibold">Oportunidade</th>
                  <th className="py-3 px-3 font-semibold w-28">Criticidade</th>
                  <th className="py-3 px-3 font-semibold">Ação Recomendada</th>
                  <th className="py-3 px-3 font-semibold w-36">Responsável</th>
                  <th className="py-3 px-3 font-semibold rounded-tr-lg w-24">
                    Prazo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
                {round.findings.map((f, idx) => {
                  const critCfg = CRITICALITY_CONFIG[f.criticality];
                  return (
                    <tr key={f.id} className="hover:bg-slate-50/80 align-top">
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-900 tabular-nums">
                        {String(idx + 1).padStart(2, '0')}
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-slate-900">
                        {f.area}
                      </td>
                      <td className="py-3.5 px-3 text-slate-700">
                        {f.observation || f.type}
                      </td>
                      <td className="py-3.5 px-3 font-semibold whitespace-nowrap">
                        <span className={critCfg.textClass}>{critCfg.label}</span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-800">
                        {f.recommendation || 'A definir'}
                      </td>
                      <td className="py-3.5 px-3 text-slate-700">
                        {f.responsible || 'A definir'}
                      </td>
                      <td className="py-3.5 px-3 font-mono font-semibold text-slate-900 whitespace-nowrap">
                        {f.deadline || 'A definir'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 18. FINAL PAGE (ENCERRAMENTO INSTITUCIONAL) */}
        <div className="bg-slate-900 text-white rounded-2xl p-8 sm:p-12 text-center space-y-6 border-t-4 border-[#5EA83A]">
          <div className="flex justify-center">
            <GuidewayLogo variant="dark" size="xl" showTagline={true} />
          </div>
          <div className="max-w-lg mx-auto space-y-2">
            <p className="text-lg font-bold tracking-wide text-white">GUIDEWAY</p>
            <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed">
              Promover a Excelência nas empresas por meio da Educação e
              Transformação.
            </p>
          </div>
          <div className="pt-6 border-t border-slate-800 text-xs text-slate-400 space-y-1">
            <p>Documento gerado pelo aplicativo GUIDEWAY Industrial Round.</p>
            <p className="font-mono text-[#5EA83A] font-semibold">
              Data: {round.endDate || round.date} · ID da Ronda: {round.id}
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 sm:hidden no-print">
        <div className="grid grid-cols-2 gap-2.5 max-w-md mx-auto">
          <button
            onClick={() => handlePdfAction('download')}
            disabled={isGenerating}
            className="min-h-[48px] rounded-xl bg-slate-900 text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-[#5EA83A]" />
            <span>{isGenerating ? 'Gerando...' : 'GERAR PDF'}</span>
          </button>
          <button
            onClick={() => handlePdfAction('share')}
            disabled={isGenerating}
            className="min-h-[48px] rounded-xl bg-[#5EA83A] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>COMPARTILHAR</span>
          </button>
        </div>
      </div>
    </div>
  );
};
