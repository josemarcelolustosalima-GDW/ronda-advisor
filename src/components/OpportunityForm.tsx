import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  Check,
  Clock,
  ImagePlus,
  Trash2,
  Zap,
} from 'lucide-react';
import {
  CRITICALITY_CONFIG,
  CriticalityLevel,
  DEADLINES_LIST,
  FINDING_TYPES_LIST,
  Finding,
  FindingPhoto,
  FindingType,
  OPERATIONAL_AREAS_LIST,
  OperationalArea,
  SuggestedDeadline,
} from '../types/round';
import { processImageFile } from '../utils/imageUtils';

interface OpportunityFormProps {
  roundId: string;
  sequenceNumber: number;
  initialArea: OperationalArea;
  initialFastMode?: boolean;
  existingFinding?: Finding | null;
  onSave: (finding: Finding) => Promise<void>;
  onCancel: () => void;
}

export const OpportunityForm: React.FC<OpportunityFormProps> = ({
  roundId,
  sequenceNumber,
  initialArea,
  initialFastMode = false,
  existingFinding,
  onSave,
  onCancel,
}) => {
  const [fastMode, setFastMode] = useState<boolean>(
    existingFinding ? false : initialFastMode
  );
  const [area, setArea] = useState<OperationalArea>(
    existingFinding?.area || initialArea
  );
  const [type, setType] = useState<FindingType>(
    existingFinding?.type || FindingType.NAO_CONFORMIDADE
  );
  const [criticality, setCriticality] = useState<CriticalityLevel>(
    existingFinding?.criticality || CriticalityLevel.MEDIA
  );
  const [photos, setPhotos] = useState<FindingPhoto[]>(
    existingFinding?.photos || []
  );
  const [observation, setObservation] = useState<string>(
    existingFinding?.observation || ''
  );
  const [advisorAnalysis, setAdvisorAnalysis] = useState<string>(
    existingFinding?.advisorAnalysis || ''
  );
  const [recommendation, setRecommendation] = useState<string>(
    existingFinding?.recommendation || ''
  );
  const [responsible, setResponsible] = useState<string>(
    existingFinding?.responsible || ''
  );
  const [deadline, setDeadline] = useState<SuggestedDeadline>(
    existingFinding?.deadline || SuggestedDeadline.A_DEFINIR
  );

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const handlePhotoFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMsg(null);

    const remainingSlots = 5 - photos.length;
    if (remainingSlots <= 0) {
      setErrorMsg('Limite máximo de 5 fotografias por oportunidade atingido.');
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    setIsProcessingPhoto(true);
    try {
      const processed: FindingPhoto[] = [];
      for (const file of filesToProcess) {
        const photoObj = await processImageFile(file);
        processed.push(photoObj);
      }
      setPhotos((prev) => [...prev, ...processed]);
    } catch {
      setErrorMsg('Não foi possível processar a fotografia selecionada.');
    } finally {
      setIsProcessingPhoto(false);
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (photoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  const handleSubmit = async (markPending: boolean) => {
    setErrorMsg(null);

    if (photos.length === 0 && observation.trim().length === 0) {
      setErrorMsg(
        'Informe ao menos uma fotografia ou descreva a observação para registrar a oportunidade.'
      );
      return;
    }

    setIsSaving(true);
    try {
      const now = new Date();
      const isPending =
        markPending ||
        advisorAnalysis.trim().length === 0 ||
        recommendation.trim().length === 0;

      const finding: Finding = {
        id:
          existingFinding?.id ||
          `finding-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        roundId,
        sequenceNumber: existingFinding?.sequenceNumber || sequenceNumber,
        area,
        type,
        criticality,
        photos,
        observation: observation.trim(),
        advisorAnalysis: advisorAnalysis.trim(),
        recommendation: recommendation.trim(),
        responsible: responsible.trim(),
        deadline,
        isPendingCompletion: isPending,
        createdAt: existingFinding?.createdAt || now.toISOString(),
        timeFormatted:
          existingFinding?.timeFormatted ||
          now.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          }),
      };

      await onSave(finding);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* Hidden File Inputs for iPhone Camera and Photo Library */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handlePhotoFiles(e.target.files)}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handlePhotoFiles(e.target.files)}
        className="hidden"
      />

      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>

          <div className="text-center min-w-0">
            <h1 className="text-sm sm:text-base font-bold tracking-tight truncate">
              {existingFinding ? 'EDITAR OPORTUNIDADE' : 'NOVA OPORTUNIDADE'}
            </h1>
            <p className="text-[11px] text-slate-400 font-mono">
              Registro #{String(existingFinding?.sequenceNumber || sequenceNumber).padStart(2, '0')}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setFastMode((prev) => !prev)}
            className={`min-h-[44px] px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              fastMode
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{fastMode ? 'Captura Rápida' : 'Modo Completo'}</span>
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-5 space-y-5">
        {/* Fast Mode Banner */}
        {fastMode && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs text-amber-950">
              <Zap className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Modo Captura Rápida ativo:</strong> Registre foto, área,
                criticidade e observação curta agora e complete a análise depois.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setFastMode(false)}
              className="text-xs font-bold text-amber-900 underline whitespace-nowrap cursor-pointer"
            >
              Expandir campos
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-2.5 text-sm text-red-900">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1. FOTO (Primary capture at top for ergonomic factory walk) */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 tracking-wide">
              FOTOGRAFIAS DA CONSTATAÇÃO ({photos.length}/5)
            </label>
            <span className="text-xs text-slate-500">
              Proporção original preservada
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              disabled={photos.length >= 5 || isProcessingPhoto}
              onClick={() => cameraInputRef.current?.click()}
              className="min-h-[54px] rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Camera className="w-5 h-5 text-[#5EA83A]" />
              <span>📷 TIRAR FOTO</span>
            </button>

            <button
              type="button"
              disabled={photos.length >= 5 || isProcessingPhoto}
              onClick={() => galleryInputRef.current?.click()}
              className="min-h-[54px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              <ImagePlus className="w-5 h-5 text-slate-600" />
              <span>ADICIONAR FOTO</span>
            </button>
          </div>

          {isProcessingPhoto && (
            <p className="text-xs text-slate-500 font-medium animate-pulse">
              Processando imagem em alta definição...
            </p>
          )}

          {photos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              {photos.map((photo, idx) => (
                <div
                  key={photo.id}
                  className="relative rounded-xl border border-slate-200 bg-slate-100 overflow-hidden group"
                >
                  <div className="aspect-4/3 w-full flex items-center justify-center bg-slate-900/5">
                    <img
                      src={photo.dataUrl}
                      alt={`Evidência ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="max-h-36 w-auto h-auto object-contain"
                    />
                  </div>
                  <div className="px-2.5 py-1.5 bg-white border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-mono font-semibold text-slate-700">
                      Foto #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(photo.id)}
                      className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      aria-label="Excluir foto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 2. ÁREA OPERACIONAL */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs">
          <label className="block text-xs font-bold text-slate-700 tracking-wide">
            ÁREA OPERACIONAL
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {OPERATIONAL_AREAS_LIST.map((item) => {
              const isSelected = area === item.area;
              return (
                <button
                  key={item.area}
                  type="button"
                  onClick={() => setArea(item.area)}
                  className={`min-h-[44px] px-3 py-2 rounded-xl text-left text-xs font-bold transition-all cursor-pointer border flex items-center justify-between gap-1.5 ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate">{item.label}</span>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-[#5EA83A] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* 3. CRITICIDADE */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs">
          <label className="block text-xs font-bold text-slate-700 tracking-wide">
            CRITICIDADE
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {(
              [
                CriticalityLevel.BAIXA,
                CriticalityLevel.MEDIA,
                CriticalityLevel.ALTA,
                CriticalityLevel.CRITICA,
              ] as CriticalityLevel[]
            ).map((lvl) => {
              const cfg = CRITICALITY_CONFIG[lvl];
              const isSelected = criticality === lvl;
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setCriticality(lvl)}
                  className={`min-h-[50px] px-3 py-2.5 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isSelected
                      ? `${cfg.activeBgClass} shadow-sm scale-[1.01]`
                      : `${cfg.bgClass} ${cfg.borderClass} ${cfg.textClass} hover:opacity-90`
                  }`}
                >
                  <span>{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 4. TIPO DE REGISTRO */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs">
          <label className="block text-xs font-bold text-slate-700 tracking-wide">
            TIPO DE REGISTRO
          </label>
          <div className="flex flex-wrap gap-2">
            {FINDING_TYPES_LIST.map((t) => {
              const isSelected = type === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#5EA83A] text-white border-[#4e8f2f] shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </section>

        {/* 5. OBSERVAÇÃO */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between">
            <label
              htmlFor="field-observation"
              className="text-xs font-bold text-slate-800 tracking-wide"
            >
              OBSERVAÇÃO (O QUE FOI OBSERVADO)
            </label>
            <span className="text-[11px] text-slate-400">Fato constatado</span>
          </div>
          <textarea
            id="field-observation"
            rows={fastMode ? 3 : 4}
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            placeholder="Descreva de forma objetiva o que foi observado..."
            className="w-full rounded-xl border border-slate-300 bg-slate-50/60 focus:bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
          />
        </section>

        {/* FULL MODE FIELDS: VISÃO DO ADVISOR, RECOMENDAÇÃO, RESPONSÁVEL, PRAZO */}
        {!fastMode && (
          <>
            {/* 6. MINHA VISÃO / ANÁLISE DO ADVISOR */}
            <section className="bg-emerald-50/50 rounded-2xl border-2 border-[#5EA83A]/50 p-5 space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="field-advisor-analysis"
                  className="text-xs font-bold text-[#35631e] tracking-wide"
                >
                  MINHA VISÃO / ANÁLISE DO ADVISOR
                </label>
                <span className="text-[11px] font-semibold text-[#5EA83A]">
                  Julgamento Profissional GUIDEWAY
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Sua interpretação técnica e crítica como Advisor Operacional para
                calibrar a percepção da gestão.
              </p>
              <textarea
                id="field-advisor-analysis"
                rows={4}
                value={advisorAnalysis}
                onChange={(e) => setAdvisorAnalysis(e.target.value)}
                placeholder="Qual é a sua avaliação profissional sobre esta situação? Por que isso merece atenção?"
                className="w-full rounded-xl border border-emerald-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5EA83A] transition-all"
              />
            </section>

            {/* 7. RECOMENDAÇÃO */}
            <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2.5 shadow-xs">
              <label
                htmlFor="field-recommendation"
                className="block text-xs font-bold text-slate-800 tracking-wide"
              >
                RECOMENDAÇÃO
              </label>
              <textarea
                id="field-recommendation"
                rows={3}
                value={recommendation}
                onChange={(e) => setRecommendation(e.target.value)}
                placeholder="Descreva a ação ou melhoria recomendada..."
                className="w-full rounded-xl border border-slate-300 bg-slate-50/60 focus:bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
              />
            </section>

            {/* 8. RESPONSÁVEL & PRAZO SUGERIDO */}
            <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
              <div>
                <label
                  htmlFor="field-responsible"
                  className="block text-xs font-bold text-slate-800 tracking-wide mb-2"
                >
                  RESPONSÁVEL / ÁREA (OPCIONAL)
                </label>
                <input
                  id="field-responsible"
                  type="text"
                  value={responsible}
                  onChange={(e) => setResponsible(e.target.value)}
                  placeholder="Ex.: Coordenação de Manutenção / Engenharia / PCP"
                  className="w-full min-h-[46px] rounded-xl border border-slate-300 bg-slate-50/60 focus:bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 tracking-wide mb-2">
                  PRAZO SUGERIDO
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {DEADLINES_LIST.map((d) => {
                    const isSelected = deadline === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDeadline(d)}
                        className={`min-h-[42px] px-2.5 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Sticky Bottom Save Actions */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3">
        <div className="max-w-3xl mx-auto flex items-center gap-2.5">
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSubmit(true)}
            className="min-h-[50px] px-4 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>COMPLETAR DEPOIS</span>
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSubmit(false)}
            className="flex-1 min-h-[50px] rounded-xl bg-[#5EA83A] hover:bg-[#4e8f2f] active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Check className="w-5 h-5" />
            <span>SALVAR OPORTUNIDADE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
