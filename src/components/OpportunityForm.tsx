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
        advisorAnalysis: '',
        recommendation: '',
        responsible: responsible.trim(),
        deadline,
        isPendingCompletion: markPending,
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
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-50 pb-28">
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
      <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 px-3 sm:px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[42px] px-2.5 sm:px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>

          <div className="text-center min-w-0 flex-1">
            <h1 className="text-xs sm:text-base font-bold tracking-tight truncate">
              {existingFinding ? 'EDITAR OPORTUNIDADE' : 'NOVA OPORTUNIDADE'}
            </h1>
            <p className="text-[11px] text-slate-400 font-mono">
              Registro #{String(existingFinding?.sequenceNumber || sequenceNumber).padStart(2, '0')}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setFastMode((prev) => !prev)}
            className={`min-h-[42px] px-2.5 sm:px-3 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0 ${
              fastMode
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Zap className="w-3.5 h-3.5 shrink-0" />
            <span>{fastMode ? 'Rápida' : 'Completo'}</span>
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-3 sm:px-4 pt-4 space-y-4">
        {errorMsg && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-2.5 text-sm text-red-900">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1. FOTO */}
        <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-bold text-slate-700 tracking-wide">
              FOTOGRAFIAS ({photos.length}/5)
            </label>
            <span className="text-[11px] text-slate-500">
              Proporção original
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={photos.length >= 5 || isProcessingPhoto}
              onClick={() => cameraInputRef.current?.click()}
              className="min-h-[50px] px-3 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Camera className="w-4 h-4 text-[#5EA83A] shrink-0" />
              <span className="truncate">TIRAR FOTO</span>
            </button>

            <button
              type="button"
              disabled={photos.length >= 5 || isProcessingPhoto}
              onClick={() => galleryInputRef.current?.click()}
              className="min-h-[50px] px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              <ImagePlus className="w-4 h-4 text-slate-600 shrink-0" />
              <span className="truncate">ADICIONAR FOTO</span>
            </button>
          </div>

          {isProcessingPhoto && (
            <p className="text-xs text-slate-500 font-medium animate-pulse">
              Processando imagem...
            </p>
          )}

          {photos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
              {photos.map((photo, idx) => (
                <div
                  key={photo.id}
                  className="relative rounded-xl border border-slate-200 bg-slate-100 overflow-hidden"
                >
                  <div className="aspect-4/3 w-full flex items-center justify-center bg-slate-900/5">
                    <img
                      src={photo.dataUrl}
                      alt={`Evidência ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="max-h-32 w-auto h-auto object-contain"
                    />
                  </div>
                  <div className="px-2.5 py-1.5 bg-white border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-mono font-semibold text-slate-700">
                      Foto #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(photo.id)}
                      className="min-h-[30px] min-w-[30px] flex items-center justify-center rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
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
        <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-3 shadow-xs">
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
                  className={`min-h-[42px] px-2.5 py-2 rounded-xl text-left text-xs font-bold transition-all cursor-pointer border flex items-center justify-between gap-1 ${
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
        <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-3 shadow-xs">
          <label className="block text-xs font-bold text-slate-700 tracking-wide">
            CRITICIDADE
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                  className={`min-h-[46px] px-2.5 py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? `${cfg.activeBgClass} shadow-xs`
                      : `${cfg.bgClass} ${cfg.borderClass} ${cfg.textClass} hover:opacity-90`
                  }`}
                >
                  <span className="truncate">{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 4. TIPO DE REGISTRO */}
        <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-3 shadow-xs">
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
                  className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
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
        <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between">
            <label
              htmlFor="field-observation"
              className="text-xs font-bold text-slate-800 tracking-wide"
            >
              OBSERVAÇÃO
            </label>
            <span className="text-[11px] text-slate-400">O que foi observado</span>
          </div>
          <textarea
            id="field-observation"
            rows={fastMode ? 3 : 4}
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            placeholder="Descreva de forma objetiva o que foi observado..."
            className="w-full rounded-xl border border-slate-300 bg-slate-50/60 focus:bg-white px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
          />
        </section>

        {/* 6. RESPONSÁVEL & PRAZO SUGERIDO */}
        {!fastMode && (
          <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4 shadow-xs">
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
                className="w-full min-h-[46px] rounded-xl border border-slate-300 bg-slate-50/60 focus:bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
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
                      className={`min-h-[40px] px-2 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer truncate ${
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
        )}
      </main>

      {/* Sticky Bottom Save Actions — Strictly Contained within Mobile Screen */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2.5">
        <div className="max-w-3xl mx-auto grid grid-cols-12 gap-2">
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSubmit(true)}
            className="col-span-5 min-h-[48px] px-2.5 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-w-0"
          >
            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="truncate">COMPLETAR DEPOIS</span>
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSubmit(false)}
            className="col-span-7 min-h-[48px] px-3 rounded-xl bg-[#5EA83A] hover:bg-[#4e8f2f] active:scale-[0.99] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer min-w-0"
          >
            <Check className="w-4 h-4 shrink-0" />
            <span className="truncate">SALVAR OPORTUNIDADE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
