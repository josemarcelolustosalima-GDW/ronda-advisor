export enum OperationalArea {
  PRODUCAO = 'PRODUÇÃO',
  MANUTENCAO = 'MANUTENÇÃO',
  QUALIDADE = 'QUALIDADE',
  SEGURANCA = 'SEGURANÇA OCUPACIONAL',
  ESTOQUES = 'ESTOQUES',
  ALMOXARIFADO = 'ALMOXARIFADO',
  LOGISTICA = 'LOGÍSTICA',
  PROCESSOS = 'PROCESSOS',
  PESSOAS_GESTAO = 'PESSOAS / GESTÃO',
  MEIO_AMBIENTE = 'MEIO AMBIENTE',
  INFRAESTRUTURA = 'INFRAESTRUTURA',
  OUTROS = 'OUTROS',
}

export enum FindingType {
  NAO_CONFORMIDADE = 'Não Conformidade',
  RISCO = 'Risco',
  DESPERDICIO = 'Desperdício',
  INEFICIENCIA = 'Ineficiência',
  OPORTUNIDADE_MELHORIA = 'Oportunidade de Melhoria',
  BOA_PRATICA = 'Boa Prática',
  SUGESTAO = 'Sugestão',
}

export enum CriticalityLevel {
  BAIXA = 'BAIXA',
  MEDIA = 'MÉDIA',
  ALTA = 'ALTA',
  CRITICA = 'CRÍTICA',
}

export enum SuggestedDeadline {
  IMEDIATO = 'Imediato',
  SETE_DIAS = '7 dias',
  QUINZE_DIAS = '15 dias',
  TRINTA_DIAS = '30 dias',
  SESSENTA_DIAS = '60 dias',
  A_DEFINIR = 'A definir',
}

export interface FindingPhoto {
  id: string;
  dataUrl: string;
  width: number;
  height: number;
  timestamp: string;
}

export interface Finding {
  id: string;
  roundId: string;
  sequenceNumber: number;
  area: OperationalArea;
  type: FindingType;
  criticality: CriticalityLevel;
  photos: FindingPhoto[];
  observation: string;
  advisorAnalysis: string;
  recommendation: string;
  responsible: string;
  deadline: SuggestedDeadline;
  isPendingCompletion: boolean;
  createdAt: string;
  timeFormatted: string;
}

export interface Round {
  id: string;
  clientCompany: string;
  plantUnit: string;
  date: string;
  startTime: string;
  startTimestamp: number;
  endDate?: string;
  endTime?: string;
  endTimestamp?: number;
  durationFormatted?: string;
  advisorName: string;
  advisorRole: string;
  objective: string;
  status: 'EM_ANDAMENTO' | 'CONCLUIDA';
  findings: Finding[];
}

export interface AdvisorSettings {
  advisorName: string;
  advisorRole: string;
  advisorEmail: string;
  advisorPhone: string;
  defaultObjective: string;
}

export const OPERATIONAL_AREAS_LIST: {
  area: OperationalArea;
  label: string;
  description: string;
  iconName: string;
}[] = [
  {
    area: OperationalArea.PRODUCAO,
    label: 'PRODUÇÃO',
    description: 'Linhas, ritmo operacional, setup e posto de trabalho',
    iconName: 'Factory',
  },
  {
    area: OperationalArea.MANUTENCAO,
    label: 'MANUTENÇÃO',
    description: 'Confiabilidade, conservação de ativos e vazamentos',
    iconName: 'Wrench',
  },
  {
    area: OperationalArea.QUALIDADE,
    label: 'QUALIDADE',
    description: 'Padrões, inspeção, refugo, retrabalho e controle',
    iconName: 'CheckCircle2',
  },
  {
    area: OperationalArea.SEGURANCA,
    label: 'SEGURANÇA OCUPACIONAL',
    description: 'EPIs, proteções de máquinas, ergonomia e rotas',
    iconName: 'ShieldAlert',
  },
  {
    area: OperationalArea.ESTOQUES,
    label: 'ESTOQUES',
    description: 'Endereçamento, FIFO/FEFO, acuracidade e preservação',
    iconName: 'Boxes',
  },
  {
    area: OperationalArea.ALMOXARIFADO,
    label: 'ALMOXARIFADO',
    description: 'Insumos, peças de reposição, organização e controle',
    iconName: 'PackageSearch',
  },
  {
    area: OperationalArea.LOGISTICA,
    label: 'LOGÍSTICA',
    description: 'Movimentação interna, docas, empilhadeiras e fluxo',
    iconName: 'Truck',
  },
  {
    area: OperationalArea.PROCESSOS,
    label: 'PROCESSOS',
    description: 'Padronização, gargalos, tempos e desvios operacionais',
    iconName: 'GitBranch',
  },
  {
    area: OperationalArea.PESSOAS_GESTAO,
    label: 'PESSOAS / GESTÃO',
    description: 'Gestão à vista, disciplina operacional e liderança',
    iconName: 'Users',
  },
  {
    area: OperationalArea.MEIO_AMBIENTE,
    label: 'MEIO AMBIENTE',
    description: 'Descarte seletivo, efluentes, contenção e emissões',
    iconName: 'Leaf',
  },
  {
    area: OperationalArea.INFRAESTRUTURA,
    label: 'INFRAESTRUTURA',
    description: 'Iluminação, piso industrial, utilidades e telhado',
    iconName: 'Building2',
  },
  {
    area: OperationalArea.OUTROS,
    label: 'OUTROS',
    description: 'Observações gerais e áreas de apoio administrativo',
    iconName: 'MoreHorizontal',
  },
];

export const FINDING_TYPES_LIST: FindingType[] = [
  FindingType.NAO_CONFORMIDADE,
  FindingType.RISCO,
  FindingType.DESPERDICIO,
  FindingType.INEFICIENCIA,
  FindingType.OPORTUNIDADE_MELHORIA,
  FindingType.BOA_PRATICA,
  FindingType.SUGESTAO,
];

export const CRITICALITY_CONFIG: Record<
  CriticalityLevel,
  {
    label: string;
    shortLabel: string;
    dotColor: string;
    bgClass: string;
    borderClass: string;
    textClass: string;
    activeBgClass: string;
    hex: string;
    bgHex: string;
  }
> = {
  [CriticalityLevel.BAIXA]: {
    label: '🟢 BAIXA',
    shortLabel: 'Baixa',
    dotColor: 'bg-emerald-500',
    bgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-300',
    textClass: 'text-emerald-800',
    activeBgClass: 'bg-emerald-600 text-white border-emerald-700',
    hex: '#10B981',
    bgHex: '#ECFDF5',
  },
  [CriticalityLevel.MEDIA]: {
    label: '🟡 MÉDIA',
    shortLabel: 'Média',
    dotColor: 'bg-amber-400',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-300',
    textClass: 'text-amber-900',
    activeBgClass: 'bg-amber-500 text-slate-950 border-amber-600',
    hex: '#F59E0B',
    bgHex: '#FFFBEB',
  },
  [CriticalityLevel.ALTA]: {
    label: '🟠 ALTA',
    shortLabel: 'Alta',
    dotColor: 'bg-orange-500',
    bgClass: 'bg-orange-50',
    borderClass: 'border-orange-300',
    textClass: 'text-orange-900',
    activeBgClass: 'bg-orange-600 text-white border-orange-700',
    hex: '#F97316',
    bgHex: '#FFF7ED',
  },
  [CriticalityLevel.CRITICA]: {
    label: '🔴 CRÍTICA',
    shortLabel: 'Crítica',
    dotColor: 'bg-red-600',
    bgClass: 'bg-red-50',
    borderClass: 'border-red-300',
    textClass: 'text-red-900',
    activeBgClass: 'bg-red-600 text-white border-red-700',
    hex: '#DC2626',
    bgHex: '#FEF2F2',
  },
};

export const DEADLINES_LIST: SuggestedDeadline[] = [
  SuggestedDeadline.IMEDIATO,
  SuggestedDeadline.SETE_DIAS,
  SuggestedDeadline.QUINZE_DIAS,
  SuggestedDeadline.TRINTA_DIAS,
  SuggestedDeadline.SESSENTA_DIAS,
  SuggestedDeadline.A_DEFINIR,
];
