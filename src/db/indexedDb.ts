import {
  AdvisorSettings,
  CriticalityLevel,
  FindingType,
  OperationalArea,
  Round,
  SuggestedDeadline,
} from '../types/round';
import { createDemoIndustrialPhoto } from '../utils/imageUtils';

const DB_NAME = 'GuidewayIndustrialRoundDB';
const DB_VERSION = 1;
const STORE_ROUNDS = 'rounds';
const STORE_SETTINGS = 'settings';

export const DEFAULT_SETTINGS: AdvisorSettings = {
  advisorName: 'Eng. Carlos Eduardo Mendes',
  advisorRole: 'Advisor Operacional Sênior — GUIDEWAY',
  advisorEmail: 'advisor@guideway.com.br',
  advisorPhone: '+55 (11) 99800-0000',
  defaultObjective:
    'Ronda operacional para avaliação das condições de Produção, Manutenção, Qualidade, Logística e Segurança Ocupacional.',
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_ROUNDS)) {
        const roundStore = db.createObjectStore(STORE_ROUNDS, { keyPath: 'id' });
        roundStore.createIndex('status', 'status', { unique: false });
        roundStore.createIndex('startTimestamp', 'startTimestamp', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllRounds(): Promise<Round[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ROUNDS, 'readonly');
    const store = tx.objectStore(STORE_ROUNDS);
    const req = store.getAll();
    req.onsuccess = () => {
      const list = (req.result as Round[]) || [];
      list.sort((a, b) => b.startTimestamp - a.startTimestamp);
      resolve(list);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveRound(round: Round): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ROUNDS, 'readwrite');
    const store = tx.objectStore(STORE_ROUNDS);
    const req = store.put(round);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteRound(roundId: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ROUNDS, 'readwrite');
    const store = tx.objectStore(STORE_ROUNDS);
    const req = store.delete(roundId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getSettings(): Promise<AdvisorSettings> {
  const db = await openDatabase();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_SETTINGS, 'readonly');
    const store = tx.objectStore(STORE_SETTINGS);
    const req = store.get('advisor_profile');
    req.onsuccess = () => {
      if (req.result && req.result.value) {
        resolve({ ...DEFAULT_SETTINGS, ...req.result.value });
      } else {
        resolve(DEFAULT_SETTINGS);
      }
    };
    req.onerror = () => resolve(DEFAULT_SETTINGS);
  });
}

export async function saveSettings(settings: AdvisorSettings): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SETTINGS, 'readwrite');
    const store = tx.objectStore(STORE_SETTINGS);
    const req = store.put({ key: 'advisor_profile', value: settings });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Generates the next sequential Round ID (e.g., GR-2026-001, GR-2026-002)
 */
export function generateNextRoundId(existingRounds: Round[]): string {
  const year = new Date().getFullYear();
  const prefix = `GR-${year}-`;
  let maxNumber = 0;

  for (const r of existingRounds) {
    if (r.id.startsWith(prefix)) {
      const numPart = parseInt(r.id.replace(prefix, ''), 10);
      if (!isNaN(numPart) && numPart > maxNumber) {
        maxNumber = numPart;
      }
    }
  }

  const nextNum = String(maxNumber + 1).padStart(3, '0');
  return `${prefix}${nextNum}`;
}

/**
 * Seeds a single realistic completed industrial round on very first launch so the Advisor
 * can immediately inspect an example round and test PDF Report generation.
 */
export async function ensureInitialSeedRound(): Promise<Round[]> {
  const existing = await getAllRounds();
  if (existing.length > 0) {
    return existing;
  }

  const seededFlag = localStorage.getItem('guideway_seeded_v1');
  if (seededFlag === 'true') {
    return [];
  }

  const photo1 = createDemoIndustrialPhoto(
    'Proteção lateral removida em esteira',
    'PRODUÇÃO · Linha 02',
    'OP-01',
    '#DC2626'
  );
  const photo2 = createDemoIndustrialPhoto(
    'Vazamento pneumático no manifold central',
    'MANUTENÇÃO · Compressores',
    'OP-02',
    '#F97316'
  );
  const photo3 = createDemoIndustrialPhoto(
    'Acúmulo de WIP sem identificação FIFO',
    'ESTOQUES · Corredor B',
    'OP-03',
    '#F59E0B'
  );
  const photo4 = createDemoIndustrialPhoto(
    'Quadro de Gestão à Vista atualizado no turno',
    'PESSOAS / GESTÃO · Célula Usinagem',
    'OP-04',
    '#10B981'
  );

  const sampleRound: Round = {
    id: 'GR-2026-001',
    clientCompany: 'Metalúrgica Vale do Aço S.A.',
    plantUnit: 'Planta 01 — Unidade Industrial Sul',
    date: '07/10/2026',
    startTime: '08:15',
    startTimestamp: Date.now() - 3600 * 1000 * 3,
    endDate: '07/10/2026',
    endTime: '10:30',
    endTimestamp: Date.now() - 3600 * 1000 * 0.75,
    durationFormatted: '2h 15min',
    advisorName: DEFAULT_SETTINGS.advisorName,
    advisorRole: DEFAULT_SETTINGS.advisorRole,
    objective:
      'Ronda operacional para avaliação das condições de Produção, Manutenção, Qualidade, Estoques e Segurança Ocupacional.',
    status: 'CONCLUIDA',
    findings: [
      {
        id: 'finding-seed-1',
        roundId: 'GR-2026-001',
        sequenceNumber: 1,
        area: OperationalArea.SEGURANCA,
        type: FindingType.RISCO,
        criticality: CriticalityLevel.CRITICA,
        photos: [photo1],
        observation:
          'Grade de proteção física do acoplamento rotativo da Linha de Estampagem 02 encontrava-se removida e apoiada na coluna lateral com o equipamento em regime automático.',
        advisorAnalysis:
          'Exposição direta de partes móveis rotativas no corredor de passagem do operador. Indica que houve intervenção corretiva recente sem cumprimento do checklist de retorno seguro à operação (LOTO / liberação de máquina).',
        recommendation:
          'Interromper imediatamente o ciclo da Linha 02 para reinstalação e fixação mecânica da carenagem. Auditar o procedimento de liberação pós-manutenção junto aos líderes de turno.',
        responsible: 'Coordenação de Manutenção e SESMT',
        deadline: SuggestedDeadline.IMEDIATO,
        isPendingCompletion: false,
        createdAt: new Date(Date.now() - 3600 * 1000 * 2.6).toISOString(),
        timeFormatted: '08:38',
      },
      {
        id: 'finding-seed-2',
        roundId: 'GR-2026-001',
        sequenceNumber: 2,
        area: OperationalArea.MANUTENCAO,
        type: FindingType.DESPERDICIO,
        criticality: CriticalityLevel.ALTA,
        photos: [photo2],
        observation:
          'Vazamento contínuo de ar comprimido audível na conexão rápida do manifold principal da célula de solda robotizada (queda de pressão local em 1,2 bar).',
        advisorAnalysis:
          'Além do desperdício energético permanente de geração de ar comprimido, a oscilação de pressão reduz a força de fechamento dos grampos pneumáticos, gerando variação dimensional no ponteamento.',
        recommendation:
          'Substituir engate rápido e vedação do bloco distribuidor na parada de entreturno e incluir rota de inspeção ultrassônica mensal na linha tronco.',
        responsible: 'Engenharia de Manutenção',
        deadline: SuggestedDeadline.SETE_DIAS,
        isPendingCompletion: false,
        createdAt: new Date(Date.now() - 3600 * 1000 * 2.1).toISOString(),
        timeFormatted: '09:12',
      },
      {
        id: 'finding-seed-3',
        roundId: 'GR-2026-001',
        sequenceNumber: 3,
        area: OperationalArea.ESTOQUES,
        type: FindingType.INEFICIENCIA,
        criticality: CriticalityLevel.MEDIA,
        photos: [photo3],
        observation:
          'Quatro paletes de semiacabados posicionados fora da demarcação amarela no corredor de abastecimento B, sem etiqueta de rastreabilidade de lote e data de entrada.',
        advisorAnalysis:
          'O bloqueio parcial do corredor força manobras adicionais da empilhadeira e a ausência de identificação visual rompe a disciplina de FIFO, elevando o risco de oxidação superficial em lotes antigos.',
        recommendation:
          'Endereçar imediatamente os paletes no porta-paletes P-04, emitir etiqueta padrão de WIP e restabelecer a regra de recebimento apenas mediante identificação completa.',
        responsible: 'Supervisão de Logística Interna / PCP',
        deadline: SuggestedDeadline.QUINZE_DIAS,
        isPendingCompletion: false,
        createdAt: new Date(Date.now() - 3600 * 1000 * 1.5).toISOString(),
        timeFormatted: '09:48',
      },
      {
        id: 'finding-seed-4',
        roundId: 'GR-2026-001',
        sequenceNumber: 4,
        area: OperationalArea.PESSOAS_GESTAO,
        type: FindingType.BOA_PRATICA,
        criticality: CriticalityLevel.BAIXA,
        photos: [photo4],
        observation:
          'Reunião rápida de 10 minutos no quadro de Gestão à Vista da Usinagem conduzida pelo líder com apontamento horário de OEE, refugo e tratativa de desvios do turno anterior.',
        advisorAnalysis:
          'Demonstra maturidade operacional da equipe local e propriedade sobre os indicadores de rotina, servindo como referência prática para replicação nas demais linhas da fábrica.',
        recommendation:
          'Padronizar o ritual da Célula de Usinagem como modelo corporativo e promover visita cruzada dos supervisores de Estampagem e Montagem.',
        responsible: 'Gerência de Operações',
        deadline: SuggestedDeadline.TRINTA_DIAS,
        isPendingCompletion: false,
        createdAt: new Date(Date.now() - 3600 * 1000 * 1.1).toISOString(),
        timeFormatted: '10:14',
      },
    ],
  };

  await saveRound(sampleRound);
  localStorage.setItem('guideway_seeded_v1', 'true');
  return [sampleRound];
}
