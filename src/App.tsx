import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Download,
  FileText,
  History,
  Play,
  Plus,
  Search,
  Settings,
  Share2,
  Trash2,
  Upload,
  UserCheck,
} from 'lucide-react';
import {
  AdvisorSettings,
  CriticalityLevel,
  Finding,
  OperationalArea,
  Round,
} from './types/round';
import {
  DEFAULT_SETTINGS,
  deleteRound,
  ensureInitialSeedRound,
  generateNextRoundId,
  getAllRounds,
  getSettings,
  saveRound,
  saveSettings,
} from './db/indexedDb';
import { OfflineIndicator, PWAInstallButton } from './components/PWAInstallPrompt';
import { ActiveRoundView } from './components/ActiveRoundView';
import { OpportunityForm } from './components/OpportunityForm';
import { RoundReportView } from './components/RoundReportModal';
import { shareOrDownloadRoundPdf } from './utils/pdfGenerator';

type ScreenState =
  | 'HOME'
  | 'NEW_ROUND'
  | 'ACTIVE_ROUND'
  | 'OPPORTUNITY_FORM'
  | 'REPORT_VIEW'
  | 'HISTORY'
  | 'SETTINGS';

export default function App() {
  const [screen, setScreen] = useState<ScreenState>('HOME');
  const [rounds, setRounds] = useState<Round[]>([]);
  const [settings, setSettings] = useState<AdvisorSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Active Round & Opportunity Form state
  const [currentRoundId, setCurrentRoundId] = useState<string | null>(null);
  const [selectedAreaForForm, setSelectedAreaForForm] = useState<OperationalArea>(
    OperationalArea.PRODUCAO
  );
  const [fastModeForForm, setFastModeForForm] = useState<boolean>(false);
  const [editingFinding, setEditingFinding] = useState<Finding | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Round Form fields
  const [newClientCompany, setNewClientCompany] = useState<string>('');
  const [newPlantUnit, setNewPlantUnit] = useState<string>('');
  const [newDate, setNewDate] = useState<string>('');
  const [newStartTime, setNewStartTime] = useState<string>('');
  const [newAdvisorName, setNewAdvisorName] = useState<string>('');
  const [newObjective, setNewObjective] = useState<string>('');
  const [newRoundError, setNewRoundError] = useState<string | null>(null);

  // History search & filter
  const [historySearch, setHistorySearch] = useState<string>('');
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'EM_ANDAMENTO' | 'CONCLUIDA'>('ALL');
  const [confirmDeleteRoundId, setConfirmDeleteRoundId] = useState<string | null>(null);

  useEffect(() => {
    async function initApp() {
      setIsLoading(true);
      try {
        const [loadedSettings, seededRounds] = await Promise.all([
          getSettings(),
          ensureInitialSeedRound(),
        ]);
        setSettings(loadedSettings);
        setRounds(seededRounds);
      } catch {
        const fallbackRounds = await getAllRounds().catch(() => []);
        setRounds(fallbackRounds);
      } finally {
        setIsLoading(false);
      }
    }
    initApp();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  const refreshRounds = async () => {
    const list = await getAllRounds();
    setRounds(list);
    return list;
  };

  const currentRound = rounds.find((r) => r.id === currentRoundId) || null;
  const activeInProgressRound = rounds.find((r) => r.status === 'EM_ANDAMENTO') || null;

  // Global Summary Statistics for Home Screen
  const totalRoundsCount = rounds.length;
  const totalFindingsCount = rounds.reduce((acc, r) => acc + r.findings.length, 0);
  const totalCriticalCount = rounds.reduce(
    (acc, r) =>
      acc +
      r.findings.filter((f) => f.criticality === CriticalityLevel.CRITICA).length,
    0
  );
  const totalPendingCount = rounds.reduce(
    (acc, r) => acc + r.findings.filter((f) => f.isPendingCompletion).length,
    0
  );

  // Prepare & Open "NOVA RONDA" screen
  const handleOpenNewRoundScreen = () => {
    const now = new Date();
    setNewClientCompany('');
    setNewPlantUnit('');
    setNewDate(now.toLocaleDateString('pt-BR'));
    setNewStartTime(
      now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    );
    setNewAdvisorName(settings.advisorName);
    setNewObjective(
      settings.defaultObjective ||
        'Ronda operacional para avaliação das condições de Produção, Manutenção, Qualidade e Segurança.'
    );
    setNewRoundError(null);
    setScreen('NEW_ROUND');
  };

  // Start a New Round
  const handleCreateRound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientCompany.trim() || !newPlantUnit.trim()) {
      setNewRoundError(
        'Preencha os campos obrigatórios: Cliente / Empresa e Unidade / Planta.'
      );
      return;
    }

    const nextId = generateNextRoundId(rounds);
    const newRound: Round = {
      id: nextId,
      clientCompany: newClientCompany.trim(),
      plantUnit: newPlantUnit.trim(),
      date: newDate.trim() || new Date().toLocaleDateString('pt-BR'),
      startTime:
        newStartTime.trim() ||
        new Date().toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      startTimestamp: Date.now(),
      advisorName: newAdvisorName.trim() || settings.advisorName,
      advisorRole: settings.advisorRole,
      objective: newObjective.trim(),
      status: 'EM_ANDAMENTO',
      findings: [],
    };

    await saveRound(newRound);
    await refreshRounds();
    setCurrentRoundId(newRound.id);
    setScreen('ACTIVE_ROUND');
    showToast(`Ronda ${newRound.id} iniciada com sucesso.`);
  };

  // Save or Update Finding in Active Round
  const handleSaveFinding = async (finding: Finding) => {
    if (!currentRound) return;
    const exists = currentRound.findings.some((f) => f.id === finding.id);
    const updatedFindings = exists
      ? currentRound.findings.map((f) => (f.id === finding.id ? finding : f))
      : [...currentRound.findings, finding];

    const updatedRound: Round = {
      ...currentRound,
      findings: updatedFindings,
    };

    await saveRound(updatedRound);
    await refreshRounds();
    setEditingFinding(null);
    setScreen('ACTIVE_ROUND');
    showToast('Oportunidade registrada com sucesso.');
  };

  const handleDuplicateFinding = async (finding: Finding) => {
    if (!currentRound) return;
    const now = new Date();
    const duplicated: Finding = {
      ...finding,
      id: `finding-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sequenceNumber: currentRound.findings.length + 1,
      createdAt: now.toISOString(),
      timeFormatted: now.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    const updatedRound: Round = {
      ...currentRound,
      findings: [...currentRound.findings, duplicated],
    };
    await saveRound(updatedRound);
    await refreshRounds();
    showToast('Oportunidade duplicada com sucesso.');
  };

  const handleDeleteFinding = async (findingId: string) => {
    if (!currentRound) return;
    const updatedFindings = currentRound.findings
      .filter((f) => f.id !== findingId)
      .map((f, idx) => ({ ...f, sequenceNumber: idx + 1 }));

    const updatedRound: Round = {
      ...currentRound,
      findings: updatedFindings,
    };
    await saveRound(updatedRound);
    await refreshRounds();
    showToast('Registro excluído da ronda.');
  };

  // Finish Round & Open Report
  const handleFinishRound = async () => {
    if (!currentRound) return;
    const now = new Date();
    const diffMs = Math.max(Date.now() - currentRound.startTimestamp, 60000);
    const totalMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    const durationFormatted = hours > 0 ? `${hours}h ${mins}min` : `${mins} min`;

    const finishedRound: Round = {
      ...currentRound,
      endDate: now.toLocaleDateString('pt-BR'),
      endTime: now.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      endTimestamp: Date.now(),
      durationFormatted: currentRound.durationFormatted || durationFormatted,
      status: 'CONCLUIDA',
    };

    await saveRound(finishedRound);
    await refreshRounds();
    setScreen('REPORT_VIEW');
  };

  const handleReopenRound = async (roundToReopen: Round) => {
    const updated: Round = {
      ...roundToReopen,
      status: 'EM_ANDAMENTO',
    };
    await saveRound(updated);
    await refreshRounds();
    setCurrentRoundId(updated.id);
    setScreen('ACTIVE_ROUND');
    showToast(`Ronda ${updated.id} reaberta para edição.`);
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    const data = JSON.stringify({ rounds, settings, exportedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GUIDEWAY_Backup_Rondas_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Backup local exportado com sucesso.');
  };

  // Import JSON Backup
  const handleImportBackup = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const parsed = JSON.parse(String(e.target?.result));
        if (Array.isArray(parsed.rounds)) {
          for (const r of parsed.rounds) {
            await saveRound(r);
          }
          await refreshRounds();
          showToast('Backup restaurado com sucesso no IndexedDB.');
        }
      } catch {
        showToast('Arquivo de backup inválido.');
      }
    };
    reader.readAsText(files[0]);
  };

  // =========================================================================
  // RENDER SUB-SCREENS
  // =========================================================================

  if (screen === 'ACTIVE_ROUND' && currentRound) {
    return (
      <>
        <OfflineIndicator />
        <ActiveRoundView
          round={currentRound}
          toastMessage={toastMessage}
          onBackToHome={() => setScreen('HOME')}
          onStartNewOpportunity={(area, fastMode = false) => {
            setSelectedAreaForForm(area);
            setFastModeForForm(fastMode);
            setEditingFinding(null);
            setScreen('OPPORTUNITY_FORM');
          }}
          onEditOpportunity={(finding) => {
            setEditingFinding(finding);
            setSelectedAreaForForm(finding.area);
            setFastModeForForm(false);
            setScreen('OPPORTUNITY_FORM');
          }}
          onDuplicateOpportunity={handleDuplicateFinding}
          onDeleteOpportunity={handleDeleteFinding}
          onFinishRound={handleFinishRound}
        />
      </>
    );
  }

  if (screen === 'OPPORTUNITY_FORM' && currentRound) {
    return (
      <>
        <OfflineIndicator />
        <OpportunityForm
          roundId={currentRound.id}
          sequenceNumber={currentRound.findings.length + 1}
          initialArea={selectedAreaForForm}
          initialFastMode={fastModeForForm}
          existingFinding={editingFinding}
          onSave={handleSaveFinding}
          onCancel={() => {
            setEditingFinding(null);
            setScreen('ACTIVE_ROUND');
          }}
        />
      </>
    );
  }

  if (screen === 'REPORT_VIEW' && currentRound) {
    return (
      <>
        <OfflineIndicator />
        <RoundReportView
          round={currentRound}
          onBack={() => setScreen('HOME')}
          onReopenRound={handleReopenRound}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-50 text-slate-900 flex flex-col">
      <OfflineIndicator />

      {/* Top Bar Contract: Zone 1 (Brand) — Zone 2 (Nav Links) — Zone 3 (Primary Actions) */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 px-3 sm:px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
          {/* Zone 1: Brand Title */}
          <a
            href="#inicio"
            onClick={(e) => {
              e.preventDefault();
              setScreen('HOME');
            }}
            className="text-sm sm:text-base font-bold tracking-wider uppercase text-white whitespace-nowrap truncate"
          >
            RONDA INDUSTRIAL
          </a>

          {/* Zone 2: Clean Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <button
              onClick={() => setScreen('HOME')}
              className={`hover:text-white transition-colors cursor-pointer whitespace-nowrap ${
                screen === 'HOME' ? 'text-white underline underline-offset-8 decoration-[#5EA83A] decoration-2' : ''
              }`}
            >
              Início
            </button>
            <button
              onClick={handleOpenNewRoundScreen}
              className={`hover:text-white transition-colors cursor-pointer whitespace-nowrap ${
                screen === 'NEW_ROUND' ? 'text-white underline underline-offset-8 decoration-[#5EA83A] decoration-2' : ''
              }`}
            >
              Nova Ronda
            </button>
            <button
              onClick={() => setScreen('HISTORY')}
              className={`hover:text-white transition-colors cursor-pointer whitespace-nowrap ${
                screen === 'HISTORY' ? 'text-white underline underline-offset-8 decoration-[#5EA83A] decoration-2' : ''
              }`}
            >
              Histórico
            </button>
            <button
              onClick={() => setScreen('SETTINGS')}
              className={`hover:text-white transition-colors cursor-pointer whitespace-nowrap ${
                screen === 'SETTINGS' ? 'text-white underline underline-offset-8 decoration-[#5EA83A] decoration-2' : ''
              }`}
            >
              Configurações
            </button>
          </nav>

          {/* Zone 3: 1-2 Primary Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <PWAInstallButton />
            <button
              onClick={handleOpenNewRoundScreen}
              className="min-h-[40px] px-3 sm:px-4 py-2 text-xs font-bold text-white bg-[#5EA83A] hover:bg-[#4e8f2f] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              + NOVA RONDA
            </button>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="max-w-5xl w-full mx-auto px-3 sm:px-4 mt-3">
          <div className="rounded-xl bg-emerald-900 text-emerald-50 px-4 py-3 text-xs sm:text-sm font-medium flex items-center gap-2.5 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-[#5EA83A] shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* =====================================================================
          SECTION 5: HOME SCREEN
      ===================================================================== */}
      {screen === 'HOME' && (
        <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 py-5 pb-24 space-y-5">
          {/* Corporate Hero Card without Graphical Logo */}
          <section className="rounded-2xl bg-slate-900 text-white p-5 sm:p-8 border-b-4 border-[#5EA83A] shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
              <div className="space-y-2">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                    Ronda Industrial
                  </h1>
                  <p className="text-sm sm:text-base font-medium text-[#5EA83A] mt-0.5">
                    Advisor Operacional · {settings.advisorName}
                  </p>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                  Ferramenta corporativa de observação técnica, documentação
                  fotográfica em campo e emissão de diagnóstico operacional em
                  página única.
                </p>
              </div>

              {/* Primary & Secondary Action Stack */}
              <div className="flex flex-col gap-2.5 sm:min-w-[240px]">
                <button
                  onClick={handleOpenNewRoundScreen}
                  className="min-h-[50px] px-5 py-3 rounded-xl bg-[#5EA83A] hover:bg-[#4e8f2f] active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-5 h-5 shrink-0" />
                  <span className="truncate">NOVA RONDA</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setScreen('HISTORY')}
                    className="min-h-[44px] px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-w-0"
                  >
                    <History className="w-4 h-4 text-slate-300 shrink-0" />
                    <span className="truncate">HISTÓRICO</span>
                  </button>
                  <button
                    onClick={() => setScreen('SETTINGS')}
                    className="min-h-[44px] px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-w-0"
                  >
                    <Settings className="w-4 h-4 text-slate-300 shrink-0" />
                    <span className="truncate">AJUSTES</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Active Round Resume Banner (if a round is currently EM_ANDAMENTO) */}
          {activeInProgressRound && (
            <section className="rounded-2xl bg-white border-2 border-[#5EA83A] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#3d7223]">
                  <span className="w-2 h-2 rounded-full bg-[#5EA83A] animate-pulse" />
                  <span>RONDA EM ANDAMENTO · {activeInProgressRound.id}</span>
                </div>
                <h2 className="text-base font-bold text-slate-900">
                  {activeInProgressRound.clientCompany} —{' '}
                  {activeInProgressRound.plantUnit}
                </h2>
                <p className="text-xs text-slate-600">
                  Iniciada em {activeInProgressRound.date} às{' '}
                  {activeInProgressRound.startTime} ·{' '}
                  <strong>{activeInProgressRound.findings.length}</strong>{' '}
                  oportunidade(s) registrada(s)
                </p>
              </div>
              <button
                onClick={() => {
                  setCurrentRoundId(activeInProgressRound.id);
                  setScreen('ACTIVE_ROUND');
                }}
                className="min-h-[46px] px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Play className="w-4 h-4 text-[#5EA83A]" />
                <span>CONTINUAR RONDA</span>
              </button>
            </section>
          )}

          {/* Summary KPI Cards: Rondas realizadas, Oportunidades registradas, Críticas, Pendentes */}
          <section className="space-y-3">
            <h2 className="text-xs font-bold text-slate-500 tracking-wider">
              RESUMO OPERACIONAL NO DISPOSITIVO (INDEXEDDB)
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-semibold">Rondas realizadas</span>
                  <ClipboardCheck className="w-4 h-4 text-slate-700" />
                </div>
                <p className="text-3xl font-bold text-slate-900 font-mono tabular-nums mt-2">
                  {isLoading ? '—' : totalRoundsCount}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Histórico salvo localmente
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-semibold">
                    Oportunidades registradas
                  </span>
                  <FileText className="w-4 h-4 text-[#5EA83A]" />
                </div>
                <p className="text-3xl font-bold text-slate-900 font-mono tabular-nums mt-2">
                  {isLoading ? '—' : totalFindingsCount}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Constatações e boas práticas
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between text-red-700">
                  <span className="text-xs font-semibold">Críticas</span>
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>
                <p className="text-3xl font-bold text-red-600 font-mono tabular-nums mt-2">
                  {isLoading ? '—' : totalCriticalCount}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Atenção imediata requerida
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between text-amber-800">
                  <span className="text-xs font-semibold">Pendentes</span>
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-3xl font-bold text-amber-600 font-mono tabular-nums mt-2">
                  {isLoading ? '—' : totalPendingCount}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Marcadas &ldquo;Completar depois&rdquo;
                </p>
              </div>
            </div>
          </section>

          {/* Recent Rounds List */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                Rondas Recentes
              </h2>
              <button
                onClick={() => setScreen('HISTORY')}
                className="text-xs font-bold text-[#3d7223] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Ver todo o histórico</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {rounds.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
                <p className="text-sm font-semibold text-slate-800">
                  Nenhuma ronda registrada até o momento.
                </p>
                <button
                  onClick={handleOpenNewRoundScreen}
                  className="min-h-[44px] px-5 rounded-xl bg-[#5EA83A] text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Iniciar Primeira Ronda</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {rounds.slice(0, 4).map((r) => {
                  const critCount = r.findings.filter(
                    (f) => f.criticality === CriticalityLevel.CRITICA
                  ).length;
                  const highCount = r.findings.filter(
                    (f) => f.criticality === CriticalityLevel.ALTA
                  ).length;

                  return (
                    <div
                      key={r.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="font-mono font-bold text-slate-900">
                            {r.id}
                          </span>
                          <span>·</span>
                          <span className="font-mono tabular-nums">
                            {r.date} ({r.startTime}
                            {r.endTime ? ` — ${r.endTime}` : ''})
                          </span>
                          <span>·</span>
                          <span
                            className={`font-bold ${
                              r.status === 'EM_ANDAMENTO'
                                ? 'text-amber-700'
                                : 'text-[#3d7223]'
                            }`}
                          >
                            {r.status === 'EM_ANDAMENTO'
                              ? 'Ronda em Andamento'
                              : 'Concluída'}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-slate-900">
                          {r.clientCompany} — {r.plantUnit}
                        </h3>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-mono">
                          <span>{r.findings.length} registros</span>
                          {critCount > 0 && (
                            <>
                              <span>·</span>
                              <span className="text-red-600 font-bold">
                                🔴 {critCount} críticos
                              </span>
                            </>
                          )}
                          {highCount > 0 && (
                            <>
                              <span>·</span>
                              <span className="text-orange-600 font-bold">
                                🟠 {highCount} altos
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {r.status === 'EM_ANDAMENTO' ? (
                          <button
                            onClick={() => {
                              setCurrentRoundId(r.id);
                              setScreen('ACTIVE_ROUND');
                            }}
                            className="min-h-[42px] px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5 text-[#5EA83A]" />
                            <span>Continuar Ronda</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setCurrentRoundId(r.id);
                              setScreen('ACTIVE_ROUND');
                            }}
                            className="min-h-[42px] px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Editar Registros
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setCurrentRoundId(r.id);
                            setScreen('REPORT_VIEW');
                          }}
                          className="min-h-[42px] px-4 rounded-xl bg-[#5EA83A] hover:bg-[#4e8f2f] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Relatório da Ronda</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      )}

      {/* =====================================================================
          SECTION 6: STARTING A NEW ROUND ("NOVA RONDA")
      ===================================================================== */}
      {screen === 'NEW_ROUND' && (
        <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-6 pb-24 space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setScreen('HOME')}
              className="min-h-[42px] px-3 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>
            <span className="text-xs font-mono font-bold text-[#3d7223]">
              ID PREVISTO: {generateNextRoundId(rounds)}
            </span>
          </div>

          <form
            onSubmit={handleCreateRound}
            className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-5 shadow-xs"
          >
            <div className="border-b border-slate-100 pb-4">
              <h1 className="text-xl font-bold text-slate-900">NOVA RONDA</h1>
              <p className="text-xs text-slate-500 mt-1">
                Identifique a empresa e unidade industrial para iniciar o
                registro estruturado em campo.
              </p>
            </div>

            {newRoundError && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3.5 text-xs font-semibold text-red-800">
                {newRoundError}
              </div>
            )}

            <div>
              <label
                htmlFor="input-client"
                className="block text-xs font-bold text-slate-700 tracking-wide mb-1.5"
              >
                CLIENTE / EMPRESA *
              </label>
              <input
                id="input-client"
                type="text"
                required
                value={newClientCompany}
                onChange={(e) => setNewClientCompany(e.target.value)}
                placeholder="Ex.: XYZ Industrial S.A."
                className="w-full min-h-[48px] rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label
                htmlFor="input-plant"
                className="block text-xs font-bold text-slate-700 tracking-wide mb-1.5"
              >
                UNIDADE / PLANTA *
              </label>
              <input
                id="input-plant"
                type="text"
                required
                value={newPlantUnit}
                onChange={(e) => setNewPlantUnit(e.target.value)}
                placeholder="Ex.: Planta 01 — Matriz"
                className="w-full min-h-[48px] rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="input-date"
                  className="block text-xs font-bold text-slate-700 tracking-wide mb-1.5"
                >
                  DATA
                </label>
                <div className="relative">
                  <input
                    id="input-date"
                    type="text"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full min-h-[48px] rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-2.5 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label
                  htmlFor="input-time"
                  className="block text-xs font-bold text-slate-700 tracking-wide mb-1.5"
                >
                  HORA DE INÍCIO
                </label>
                <div className="relative">
                  <input
                    id="input-time"
                    type="text"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full min-h-[48px] rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-2.5 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  <Clock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="input-advisor"
                className="block text-xs font-bold text-slate-700 tracking-wide mb-1.5"
              >
                ADVISOR OPERACIONAL
              </label>
              <div className="relative">
                <input
                  id="input-advisor"
                  type="text"
                  value={newAdvisorName}
                  onChange={(e) => setNewAdvisorName(e.target.value)}
                  className="w-full min-h-[48px] rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <UserCheck className="w-4 h-4 text-[#5EA83A] absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label
                htmlFor="input-objective"
                className="block text-xs font-bold text-slate-700 tracking-wide mb-1.5"
              >
                OBJETIVO DA RONDA (OPCIONAL)
              </label>
              <textarea
                id="input-objective"
                rows={3}
                value={newObjective}
                onChange={(e) => setNewObjective(e.target.value)}
                placeholder="Ronda operacional para avaliação das condições de Produção, Manutenção, Qualidade e Segurança."
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <button
              type="submit"
              className="w-full min-h-[54px] rounded-xl bg-[#5EA83A] hover:bg-[#4e8f2f] active:scale-[0.99] text-white font-bold text-base flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Play className="w-5 h-5" />
              <span>INICIAR RONDA</span>
            </button>
          </form>
        </main>
      )}

      {/* =====================================================================
          HISTÓRICO SCREEN
      ===================================================================== */}
      {screen === 'HISTORY' && (
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 pb-24 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                HISTÓRICO DE RONDAS
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Consulte, edite, compartilhe ou gere relatórios PDF de rondas
                anteriores.
              </p>
            </div>
            <button
              onClick={handleOpenNewRoundScreen}
              className="min-h-[44px] px-4 rounded-xl bg-[#5EA83A] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ NOVA RONDA</span>
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Buscar por empresa, unidade ou ID (ex.: GR-2026-001)..."
                className="w-full min-h-[42px] pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              {(
                [
                  { id: 'ALL', label: 'Todas' },
                  { id: 'EM_ANDAMENTO', label: 'Em Andamento' },
                  { id: 'CONCLUIDA', label: 'Concluídas' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setHistoryFilter(tab.id)}
                  className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    historyFilter === tab.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filtered Rounds List */}
          <div className="space-y-3">
            {rounds
              .filter((r) => {
                if (historyFilter !== 'ALL' && r.status !== historyFilter)
                  return false;
                if (!historySearch.trim()) return true;
                const q = historySearch.toLowerCase();
                return (
                  r.clientCompany.toLowerCase().includes(q) ||
                  r.plantUnit.toLowerCase().includes(q) ||
                  r.id.toLowerCase().includes(q)
                );
              })
              .map((r) => {
                const critCount = r.findings.filter(
                  (f) => f.criticality === CriticalityLevel.CRITICA
                ).length;

                return (
                  <div
                    key={r.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-mono font-bold text-slate-900">
                            {r.id}
                          </span>
                          <span>·</span>
                          <span className="font-mono tabular-nums">
                            {r.date} · {r.startTime}
                            {r.endTime ? ` às ${r.endTime}` : ''}
                          </span>
                          <span>·</span>
                          <span
                            className={`font-bold ${
                              r.status === 'EM_ANDAMENTO'
                                ? 'text-amber-700'
                                : 'text-[#3d7223]'
                            }`}
                          >
                            {r.status === 'EM_ANDAMENTO'
                              ? 'Em Andamento'
                              : 'Concluída'}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900">
                          {r.clientCompany} — {r.plantUnit}
                        </h3>
                        <p className="text-xs text-slate-500">
                          Advisor: {r.advisorName} ·{' '}
                          <strong className="text-slate-800">
                            {r.findings.length} oportunidades
                          </strong>{' '}
                          ({critCount} críticas)
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => {
                            setCurrentRoundId(r.id);
                            setScreen('ACTIVE_ROUND');
                          }}
                          className="min-h-[40px] px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold cursor-pointer"
                        >
                          {r.status === 'EM_ANDAMENTO' ? 'Abrir Ronda' : 'Editar'}
                        </button>

                        <button
                          onClick={() => {
                            setCurrentRoundId(r.id);
                            setScreen('REPORT_VIEW');
                          }}
                          className="min-h-[40px] px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#5EA83A]" />
                          <span>Relatório</span>
                        </button>

                        <button
                          onClick={async () => {
                            await shareOrDownloadRoundPdf(r, 'share');
                          }}
                          className="min-h-[40px] px-3.5 rounded-xl bg-[#5EA83A] hover:bg-[#4e8f2f] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Compartilhar</span>
                        </button>

                        {confirmDeleteRoundId === r.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={async () => {
                                await deleteRound(r.id);
                                await refreshRounds();
                                setConfirmDeleteRoundId(null);
                                showToast(`Ronda ${r.id} excluída.`);
                              }}
                              className="min-h-[40px] px-3 rounded-xl bg-red-600 text-white text-xs font-bold cursor-pointer"
                            >
                              Confirmar
                            </button>
                            <button
                              onClick={() => setConfirmDeleteRoundId(null)}
                              className="min-h-[40px] px-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteRoundId(r.id)}
                            className="min-h-[40px] min-w-[40px] rounded-xl text-red-600 hover:bg-red-50 flex items-center justify-center cursor-pointer"
                            aria-label="Excluir ronda"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </main>
      )}

      {/* =====================================================================
          CONFIGURAÇÕES SCREEN
      ===================================================================== */}
      {screen === 'SETTINGS' && (
        <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-6 pb-24 space-y-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">CONFIGURAÇÕES</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Perfil do Advisor Operacional GUIDEWAY e gerenciamento do banco de
              dados local (IndexedDB).
            </p>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await saveSettings(settings);
              showToast('Configurações do Advisor salvas com sucesso.');
            }}
            className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs"
          >
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Identificação do Advisor
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                NOME DO ADVISOR
              </label>
              <input
                type="text"
                value={settings.advisorName}
                onChange={(e) =>
                  setSettings({ ...settings, advisorName: e.target.value })
                }
                className="w-full min-h-[46px] rounded-xl border border-slate-300 px-4 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                CARGO / CREDENCIAL
              </label>
              <input
                type="text"
                value={settings.advisorRole}
                onChange={(e) =>
                  setSettings({ ...settings, advisorRole: e.target.value })
                }
                className="w-full min-h-[46px] rounded-xl border border-slate-300 px-4 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  E-MAIL CORPORATIVO
                </label>
                <input
                  type="email"
                  value={settings.advisorEmail}
                  onChange={(e) =>
                    setSettings({ ...settings, advisorEmail: e.target.value })
                  }
                  className="w-full min-h-[46px] rounded-xl border border-slate-300 px-4 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  TELEFONE / WHATSAPP
                </label>
                <input
                  type="text"
                  value={settings.advisorPhone}
                  onChange={(e) =>
                    setSettings({ ...settings, advisorPhone: e.target.value })
                  }
                  className="w-full min-h-[46px] rounded-xl border border-slate-300 px-4 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                TEXTO PADRÃO DE OBJETIVO DA RONDA
              </label>
              <textarea
                rows={3}
                value={settings.defaultObjective}
                onChange={(e) =>
                  setSettings({ ...settings, defaultObjective: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full min-h-[48px] rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm cursor-pointer transition-colors"
            >
              SALVAR CONFIGURAÇÕES
            </button>
          </form>

          {/* IndexedDB Local Persistence Management */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Armazenamento Local no Dispositivo (IndexedDB)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Todas as rondas, observações e fotografias ficam armazenadas de
                forma segura e offline no banco IndexedDB deste dispositivo.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleExportBackup}
                className="min-h-[44px] px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#5EA83A]" />
                <span>Exportar Backup (JSON)</span>
              </button>

              <label className="min-h-[44px] px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4 text-slate-700" />
                <span>Restaurar Backup</span>
                <input
                  type="file"
                  accept="application/json"
                  onChange={(e) => handleImportBackup(e.target.files)}
                  className="hidden"
                />
              </label>
            </div>
          </section>
        </main>
      )}

      {/* Mobile Fixed Bottom Navigation Bar (Natural Thumb Zone) */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 md:hidden">
        <div className="grid grid-cols-4 items-center h-16 max-w-md mx-auto">
          <button
            onClick={() => setScreen('HOME')}
            className={`h-full flex flex-col items-center justify-center cursor-pointer ${
              screen === 'HOME' ? 'text-[#5EA83A] font-bold' : 'text-slate-500'
            }`}
          >
            <ClipboardCheck className="w-5 h-5" />
            <span className="text-[10px] mt-1">Início</span>
          </button>

          <button
            onClick={handleOpenNewRoundScreen}
            className={`h-full flex flex-col items-center justify-center cursor-pointer ${
              screen === 'NEW_ROUND' ? 'text-[#5EA83A] font-bold' : 'text-slate-500'
            }`}
          >
            <Plus className="w-5 h-5" />
            <span className="text-[10px] mt-1">Nova Ronda</span>
          </button>

          <button
            onClick={() => setScreen('HISTORY')}
            className={`h-full flex flex-col items-center justify-center cursor-pointer ${
              screen === 'HISTORY' ? 'text-[#5EA83A] font-bold' : 'text-slate-500'
            }`}
          >
            <History className="w-5 h-5" />
            <span className="text-[10px] mt-1">Histórico</span>
          </button>

          <button
            onClick={() => setScreen('SETTINGS')}
            className={`h-full flex flex-col items-center justify-center cursor-pointer ${
              screen === 'SETTINGS' ? 'text-[#5EA83A] font-bold' : 'text-slate-500'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px] mt-1">Ajustes</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
