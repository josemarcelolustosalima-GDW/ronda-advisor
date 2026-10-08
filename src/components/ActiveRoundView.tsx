import React, { useState } from 'react';
import {
  ArrowLeft,
  Boxes,
  Building2,
  Camera,
  CheckCircle2,
  Clock,
  Copy,
  Edit3,
  Eye,
  Factory,
  FileText,
  GitBranch,
  Leaf,
  MoreHorizontal,
  PackageSearch,
  Plus,
  ShieldAlert,
  Trash2,
  Truck,
  Users,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import {
  CRITICALITY_CONFIG,
  CriticalityLevel,
  Finding,
  OPERATIONAL_AREAS_LIST,
  OperationalArea,
  Round,
} from '../types/round';
import { computeRoundStatistics } from '../utils/pdfGenerator';

interface ActiveRoundViewProps {
  round: Round;
  toastMessage: string | null;
  onBackToHome: () => void;
  onStartNewOpportunity: (area: OperationalArea, fastMode?: boolean) => void;
  onEditOpportunity: (finding: Finding) => void;
  onDuplicateOpportunity: (finding: Finding) => void;
  onDeleteOpportunity: (findingId: string) => void;
  onFinishRound: () => void;
}

export const AreaIcon: React.FC<{ iconName: string; className?: string }> = ({
  iconName,
  className = 'w-5 h-5',
}) => {
  switch (iconName) {
    case 'Factory':
      return <Factory className={className} />;
    case 'Wrench':
      return <Wrench className={className} />;
    case 'CheckCircle2':
      return <CheckCircle2 className={className} />;
    case 'ShieldAlert':
      return <ShieldAlert className={className} />;
    case 'Boxes':
      return <Boxes className={className} />;
    case 'PackageSearch':
      return <PackageSearch className={className} />;
    case 'Truck':
      return <Truck className={className} />;
    case 'GitBranch':
      return <GitBranch className={className} />;
    case 'Users':
      return <Users className={className} />;
    case 'Leaf':
      return <Leaf className={className} />;
    case 'Building2':
      return <Building2 className={className} />;
    default:
      return <MoreHorizontal className={className} />;
  }
};

export const ActiveRoundView: React.FC<ActiveRoundViewProps> = ({
  round,
  toastMessage,
  onBackToHome,
  onStartNewOpportunity,
  onEditOpportunity,
  onDuplicateOpportunity,
  onDeleteOpportunity,
  onFinishRound,
}) => {
  const [selectedArea, setSelectedArea] = useState<OperationalArea>(
    OperationalArea.PRODUCAO
  );
  const [activeTab, setActiveTab] = useState<'AREAS' | 'REGISTROS'>('AREAS');
  const [filterMode, setFilterMode] = useState<'ALL' | 'CRITICA' | 'PENDING'>('ALL');
  const [inspectingFinding, setInspectingFinding] = useState<Finding | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showEndRoundModal, setShowEndRoundModal] = useState<boolean>(false);

  const stats = computeRoundStatistics(round);
  const pendingCount = round.findings.filter((f) => f.isPendingCompletion).length;

  const filteredFindings = round.findings.filter((f) => {
    if (filterMode === 'CRITICA') return f.criticality === CriticalityLevel.CRITICA;
    if (filterMode === 'PENDING') return f.isPendingCompletion;
    return true;
  });

  const computeLiveDuration = () => {
    const diffMs = Math.max(Date.now() - round.startTimestamp, 60000);
    const totalMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins} min`;
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-50 pb-28">
      {/* Top Corporate Bar — No Graphical Logo */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 px-3 sm:px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={onBackToHome}
              className="min-h-[42px] min-w-[42px] rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-200 transition-colors cursor-pointer shrink-0"
              aria-label="Voltar ao Início"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <span className="block text-sm font-bold tracking-wider uppercase text-white truncate">
                RONDA INDUSTRIAL
              </span>
              <span className="block text-[11px] font-mono text-[#5EA83A] font-semibold truncate">
                {round.id}
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowEndRoundModal(true)}
            className="min-h-[42px] px-3 sm:px-3.5 rounded-xl bg-slate-800 hover:bg-red-950/80 border border-slate-700 hover:border-red-500/40 text-xs font-bold text-slate-100 transition-colors cursor-pointer shrink-0"
          >
            ENCERRAR RONDA
          </button>
        </div>
      </header>

      {/* Confirmation Toast */}
      {toastMessage && (
        <div className="max-w-5xl mx-auto px-3 sm:px-4 mt-3">
          <div className="rounded-xl bg-emerald-900 text-emerald-50 px-4 py-3 text-xs sm:text-sm font-semibold flex items-center gap-2.5 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-[#5EA83A] shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-3 sm:px-4 pt-4 space-y-4">
        {/* Active Round Status Card — Enquadrado 100% na tela mobile */}
        <section className="bg-slate-900 text-white rounded-2xl p-4 sm:p-6 border-l-4 border-[#5EA83A] shadow-xs overflow-hidden">
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#5EA83A] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#5EA83A] animate-pulse shrink-0" />
                <span className="truncate">RONDA EM ANDAMENTO · {round.id}</span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-white mt-1 break-words">
                Empresa: {round.clientCompany}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5 break-words">
                Unidade: <strong className="text-white">{round.plantUnit}</strong>{' '}
                <span className="mx-1 text-slate-600">·</span> Início:{' '}
                <span className="font-mono tabular-nums">
                  {round.date} — {round.startTime}
                </span>
              </p>
            </div>

            {/* Strictly Contained 2-Column Action Grid inside Card */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => onStartNewOpportunity(selectedArea, true)}
                className="min-h-[46px] px-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-w-0"
              >
                <Zap className="w-4 h-4 shrink-0" />
                <span className="truncate">CAPTURA RÁPIDA</span>
              </button>
              <button
                type="button"
                onClick={() => onStartNewOpportunity(selectedArea, false)}
                className="min-h-[46px] px-2.5 rounded-xl bg-[#5EA83A] hover:bg-[#4e8f2f] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs min-w-0"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span className="truncate">NOVA OPORTUNIDADE</span>
              </button>
            </div>
          </div>

          {/* Live Statistics Strip */}
          <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
            <div className="bg-slate-800/90 rounded-xl px-3 py-2.5">
              <span className="text-slate-400 block">Total</span>
              <span className="text-sm sm:text-base font-bold font-mono tabular-nums text-white">
                {stats.total} {stats.total === 1 ? 'registro' : 'registros'}
              </span>
            </div>
            <div className="bg-slate-800/70 rounded-xl px-3 py-2.5">
              <span className="text-slate-300 block">🔴 Críticos</span>
              <span className="text-sm sm:text-base font-bold font-mono tabular-nums text-red-400">
                {stats.byCriticality[CriticalityLevel.CRITICA]}
              </span>
            </div>
            <div className="bg-slate-800/70 rounded-xl px-3 py-2.5">
              <span className="text-slate-300 block">🟠 Altos</span>
              <span className="text-sm sm:text-base font-bold font-mono tabular-nums text-orange-400">
                {stats.byCriticality[CriticalityLevel.ALTA]}
              </span>
            </div>
            <div className="bg-slate-800/70 rounded-xl px-3 py-2.5">
              <span className="text-slate-300 block">🟡 Médios</span>
              <span className="text-sm sm:text-base font-bold font-mono tabular-nums text-amber-300">
                {stats.byCriticality[CriticalityLevel.MEDIA]}
              </span>
            </div>
            <div className="bg-slate-800/70 rounded-xl px-3 py-2.5">
              <span className="text-slate-300 block">🟢 Baixos</span>
              <span className="text-sm sm:text-base font-bold font-mono tabular-nums text-emerald-400">
                {stats.byCriticality[CriticalityLevel.BAIXA]}
              </span>
            </div>
            <div className="bg-slate-800/70 rounded-xl px-3 py-2.5">
              <span className="text-slate-300 block">Pendentes</span>
              <span className="text-sm sm:text-base font-bold font-mono tabular-nums text-amber-400">
                {pendingCount}
              </span>
            </div>
          </div>
        </section>

        {/* Segmented View Selector */}
        <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-200/80 rounded-xl">
          <button
            onClick={() => setActiveTab('AREAS')}
            className={`min-h-[42px] px-2 rounded-lg text-xs font-bold transition-all cursor-pointer truncate ${
              activeTab === 'AREAS'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ÁREAS OPERACIONAIS (12)
          </button>
          <button
            onClick={() => setActiveTab('REGISTROS')}
            className={`min-h-[42px] px-2 rounded-lg text-xs font-bold transition-all cursor-pointer truncate ${
              activeTab === 'REGISTROS'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            REGISTROS ({round.findings.length})
          </button>
        </div>

        {/* TAB 1: SECTION 7 — OPERATIONAL AREAS */}
        {activeTab === 'AREAS' && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs sm:text-sm font-bold text-slate-800">
                Selecione a Área Operacional para registrar uma oportunidade
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {OPERATIONAL_AREAS_LIST.map((item) => {
                const countInArea = round.findings.filter(
                  (f) => f.area === item.area
                ).length;
                const criticalInArea = round.findings.filter(
                  (f) =>
                    f.area === item.area &&
                    f.criticality === CriticalityLevel.CRITICA
                ).length;
                const isCurrent = selectedArea === item.area;

                return (
                  <div
                    key={item.area}
                    onClick={() => {
                      setSelectedArea(item.area);
                      onStartNewOpportunity(item.area, false);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setSelectedArea(item.area);
                        onStartNewOpportunity(item.area, false);
                      }
                    }}
                    className={`rounded-2xl p-4 border transition-all cursor-pointer flex flex-col justify-between gap-3 active:scale-[0.99] ${
                      isCurrent
                        ? 'bg-white border-slate-900 ring-1 ring-slate-900 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-400 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                            isCurrent
                              ? 'bg-slate-900 text-[#5EA83A]'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          <AreaIcon iconName={item.iconName} className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-slate-900 truncate">
                            {item.label}
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-slate-600 font-mono">
                        <span>
                          {countInArea}{' '}
                          {countInArea === 1 ? 'registro' : 'registros'}
                        </span>
                        {criticalInArea > 0 && (
                          <>
                            <span>·</span>
                            <span className="text-red-600 font-bold">
                              🔴 {criticalInArea}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedArea(item.area);
                            onStartNewOpportunity(item.area, true);
                          }}
                          className="min-h-[34px] px-2.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-950 font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                          title="Captura Rápida nesta área"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Rápida</span>
                        </button>
                        <span className="font-bold text-[#5EA83A] px-1">
                          + Registrar
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* TAB 2: SECTION 10 — FINDINGS CARDS IN ACTIVE ROUND */}
        {(activeTab === 'REGISTROS' || round.findings.length > 0) && (
          <section className="space-y-4 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Registros da Ronda ({filteredFindings.length})
              </h2>

              <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-xl max-w-full overflow-x-auto">
                <button
                  onClick={() => setFilterMode('ALL')}
                  className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    filterMode === 'ALL'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Todos ({round.findings.length})
                </button>
                <button
                  onClick={() => setFilterMode('CRITICA')}
                  className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    filterMode === 'CRITICA'
                      ? 'bg-white text-red-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🔴 Críticos ({stats.byCriticality[CriticalityLevel.CRITICA]})
                </button>
                <button
                  onClick={() => setFilterMode('PENDING')}
                  className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    filterMode === 'PENDING'
                      ? 'bg-white text-amber-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pendentes ({pendingCount})
                </button>
              </div>
            </div>

            {filteredFindings.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
                <p className="text-sm font-semibold text-slate-700">
                  Nenhuma oportunidade encontrada para este filtro.
                </p>
                <p className="text-xs text-slate-500">
                  Selecione uma Área Operacional acima ou toque em &ldquo;NOVA
                  OPORTUNIDADE&rdquo; para iniciar o registro.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFindings.map((finding, idx) => {
                  const critCfg = CRITICALITY_CONFIG[finding.criticality];
                  const thumb = finding.photos?.[0];
                  const seq = String(
                    round.findings.findIndex((item) => item.id === finding.id) + 1 ||
                      idx + 1
                  ).padStart(2, '0');

                  return (
                    <div
                      key={finding.id}
                      className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Thumbnail */}
                        {thumb ? (
                          <div
                            onClick={() => setInspectingFinding(finding)}
                            className="w-full sm:w-32 h-36 sm:h-28 rounded-xl bg-slate-900/5 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center cursor-pointer relative"
                          >
                            <img
                              src={thumb.dataUrl}
                              alt={finding.area}
                              referrerPolicy="no-referrer"
                              className="max-h-full max-w-full object-contain"
                            />
                            {finding.photos.length > 1 && (
                              <span className="absolute bottom-1.5 right-1.5 bg-slate-900/85 text-white text-[10px] font-mono px-1.5 py-0.5 rounded-md">
                                +{finding.photos.length - 1} foto(s)
                              </span>
                            )}
                          </div>
                        ) : (
                          <div
                            onClick={() => onEditOpportunity(finding)}
                            className="w-full sm:w-32 h-24 sm:h-28 rounded-xl bg-slate-100 border border-dashed border-slate-300 shrink-0 flex flex-col items-center justify-center text-slate-400 text-xs cursor-pointer hover:bg-slate-200/60"
                          >
                            <Camera className="w-5 h-5 mb-1" />
                            <span>Sem foto</span>
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                              <span className="font-mono font-bold text-slate-900">
                                #{seq}
                              </span>
                              <span>·</span>
                              <span className="font-bold text-slate-900">
                                {finding.area}
                              </span>
                              <span>·</span>
                              <span className="text-slate-600">{finding.type}</span>
                              <span>·</span>
                              <span className="font-mono tabular-nums">
                                {finding.timeFormatted}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {finding.isPendingCompletion && (
                                <span className="text-xs font-semibold text-amber-700 flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>Pendente</span>
                                </span>
                              )}
                              <span
                                className={`text-xs font-bold ${critCfg.textClass}`}
                              >
                                {critCfg.label}
                              </span>
                            </div>
                          </div>

                          <p className="text-sm text-slate-900 font-medium line-clamp-2">
                            {finding.observation ||
                              'Registro fotográfico rápido sem descrição textual.'}
                          </p>

                          {(finding.responsible || finding.deadline) && (
                            <p className="text-xs text-slate-500">
                              <span>
                                <strong>Responsável:</strong>{' '}
                                {finding.responsible || 'A definir'}
                              </span>
                              <span className="mx-1.5">·</span>
                              <span>
                                <strong>Prazo:</strong> {finding.deadline}
                              </span>
                            </p>
                          )}

                          {/* Action Buttons */}
                          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setInspectingFinding(finding)}
                                className="min-h-[36px] px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Abrir</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onEditOpportunity(finding)}
                                className="min-h-[36px] px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Editar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onDuplicateOpportunity(finding)}
                                className="min-h-[36px] px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                <span>Duplicar</span>
                              </button>
                            </div>

                            {confirmDeleteId === finding.id ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    onDeleteOpportunity(finding.id);
                                    setConfirmDeleteId(null);
                                  }}
                                  className="min-h-[36px] px-2.5 rounded-lg bg-red-600 text-white text-xs font-bold cursor-pointer"
                                >
                                  Confirmar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="min-h-[36px] px-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium cursor-pointer"
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(finding.id)}
                                className="min-h-[36px] px-2 rounded-lg text-red-600 hover:bg-red-50 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Excluir</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Sticky Bottom Ergonomic Thumb Bar — Strictly Framed on All Mobile Viewports */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2.5">
        <div className="max-w-5xl mx-auto grid grid-cols-12 gap-2">
          <button
            type="button"
            onClick={() => onStartNewOpportunity(selectedArea, true)}
            className="col-span-4 min-h-[48px] px-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer min-w-0"
          >
            <Camera className="w-4 h-4 shrink-0" />
            <span className="truncate">RÁPIDA</span>
          </button>

          <button
            type="button"
            onClick={() => onStartNewOpportunity(selectedArea, false)}
            className="col-span-5 min-h-[48px] px-2 rounded-xl bg-[#5EA83A] hover:bg-[#4e8f2f] text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition-colors cursor-pointer min-w-0"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="truncate">OPORTUNIDADE</span>
          </button>

          <button
            type="button"
            onClick={() => setShowEndRoundModal(true)}
            className="col-span-3 min-h-[48px] px-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer min-w-0"
          >
            <FileText className="w-3.5 h-3.5 text-[#5EA83A] shrink-0" />
            <span className="truncate">ENCERRAR</span>
          </button>
        </div>
      </div>

      {/* Modal: Inspect Finding Detail */}
      {inspectingFinding && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 space-y-4 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-[#5EA83A]">
                  {inspectingFinding.area} · {inspectingFinding.type}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Detalhes da Oportunidade ({inspectingFinding.timeFormatted})
                </h3>
              </div>
              <button
                onClick={() => setInspectingFinding(null)}
                className="min-h-[40px] min-w-[40px] rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs font-bold text-slate-600">
                  OBSERVAÇÃO CONSTATADA
                </p>
                <p className="text-slate-900 mt-1 whitespace-pre-line">
                  {inspectingFinding.observation || 'Não informado.'}
                </p>
                <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex flex-wrap gap-4 text-xs text-slate-600">
                  <span>
                    <strong>Criticidade:</strong>{' '}
                    {CRITICALITY_CONFIG[inspectingFinding.criticality].label}
                  </span>
                  <span>
                    <strong>Responsável:</strong>{' '}
                    {inspectingFinding.responsible || 'A definir'}
                  </span>
                  <span>
                    <strong>Prazo:</strong> {inspectingFinding.deadline}
                  </span>
                </div>
              </div>

              {inspectingFinding.photos.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {inspectingFinding.photos.map((p, i) => (
                    <div
                      key={p.id}
                      className="rounded-xl border border-slate-200 p-2 bg-slate-50"
                    >
                      <img
                        src={p.dataUrl}
                        alt={`Foto ${i + 1}`}
                        referrerPolicy="no-referrer"
                        className="max-h-56 w-auto mx-auto object-contain rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  const target = inspectingFinding;
                  setInspectingFinding(null);
                  onEditOpportunity(target);
                }}
                className="min-h-[44px] px-4 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>Editar Oportunidade</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 11: ENDING THE ROUND — RESUMO DA RONDA MODAL */}
      {showEndRoundModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-5 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <p className="text-xs font-mono font-bold text-[#5EA83A]">
                  ENCERRAMENTO · {round.id}
                </p>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  RESUMO DA RONDA
                </h3>
              </div>
              <button
                onClick={() => setShowEndRoundModal(false)}
                className="min-h-[40px] min-w-[40px] rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Cliente / Planta</span>
                  <strong className="text-slate-900 text-sm">
                    {round.clientCompany} — {round.plantUnit}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Duração Estimada</span>
                  <strong className="text-slate-900 text-sm font-mono">
                    {computeLiveDuration()}
                  </strong>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-400 font-semibold">
                    TOTAL CONSOLIDADO
                  </span>
                  <span className="text-2xl font-bold font-mono tabular-nums text-white">
                    {stats.total} {stats.total === 1 ? 'registro' : 'registros'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-800 text-sm font-mono">
                  <div className="flex items-center justify-between bg-slate-800/80 px-3 py-2 rounded-lg">
                    <span>🔴 Críticos</span>
                    <strong className="text-red-400">
                      {stats.byCriticality[CriticalityLevel.CRITICA]}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between bg-slate-800/80 px-3 py-2 rounded-lg">
                    <span>🟠 Altos</span>
                    <strong className="text-orange-400">
                      {stats.byCriticality[CriticalityLevel.ALTA]}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between bg-slate-800/80 px-3 py-2 rounded-lg">
                    <span>🟡 Médios</span>
                    <strong className="text-amber-300">
                      {stats.byCriticality[CriticalityLevel.MEDIA]}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between bg-slate-800/80 px-3 py-2 rounded-lg">
                    <span>🟢 Baixos</span>
                    <strong className="text-emerald-400">
                      {stats.byCriticality[CriticalityLevel.BAIXA]}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setShowEndRoundModal(false)}
                className="min-h-[48px] px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm cursor-pointer"
              >
                Continuar Ronda
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowEndRoundModal(false);
                  onFinishRound();
                }}
                className="min-h-[48px] px-3 rounded-xl bg-[#5EA83A] hover:bg-[#4e8f2f] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span className="truncate">GERAR RELATÓRIO</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
