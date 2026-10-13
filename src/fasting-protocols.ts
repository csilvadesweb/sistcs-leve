export interface FastingProtocol {
  hours: number;
  label: string;
  hint: string;
}

export interface FastingMethod {
  id: string;
  name: string;
  schedule: string;
  level: 'Gentil' | 'Intermediário' | 'Avançado' | 'Exige orientação';
  description: string;
  timerHours?: number;
}

/** Protocolos por duração diária. Horas = período sem calorias; restante = janela alimentar. */
export const FASTING_PROTOCOLS: FastingProtocol[] = [
  { hours: 12, label: '12:12', hint: 'Mais gentil' },
  { hours: 13, label: '13:11', hint: 'Transição' },
  { hours: 14, label: '14:10', hint: 'Intermediário' },
  { hours: 15, label: '15:9', hint: 'Intermediário' },
  { hours: 16, label: '16:8', hint: 'Popular' },
  { hours: 17, label: '17:7', hint: 'Avançado' },
  { hours: 18, label: '18:6', hint: 'Avançado' },
  { hours: 20, label: '20:4', hint: 'Exige orientação' },
  { hours: 23, label: '23:1 · OMAD', hint: 'Exige orientação' },
  { hours: 24, label: '24 h', hint: 'Exige orientação' },
];

/** Métodos não diários são informativos: não devem ser falsamente representados por um único cronômetro. */
export const FASTING_METHODS: FastingMethod[] = [
  { id: '12-12', name: '12:12', schedule: '12 h de jejum · 12 h de janela alimentar', level: 'Gentil', description: 'Uma pausa noturna mais longa, frequentemente usada como introdução à organização dos horários.', timerHours: 12 },
  { id: '14-10', name: '14:10', schedule: '14 h de jejum · 10 h de janela alimentar', level: 'Intermediário', description: 'Janela diária moderada; a adequação depende da rotina, alimentação e saúde de cada pessoa.', timerHours: 14 },
  { id: '16-8', name: '16:8', schedule: '16 h de jejum · 8 h de janela alimentar', level: 'Intermediário', description: 'Um dos formatos mais conhecidos de alimentação com horário restrito.', timerHours: 16 },
  { id: '18-6', name: '18:6', schedule: '18 h de jejum · 6 h de janela alimentar', level: 'Avançado', description: 'Janela alimentar mais curta; pode dificultar atingir as necessidades nutricionais.', timerHours: 18 },
  { id: '20-4', name: '20:4 · Warrior', schedule: '20 h de jejum · cerca de 4 h de janela alimentar', level: 'Exige orientação', description: 'Formato restritivo, não indicado para começar sem avaliação individual.', timerHours: 20 },
  { id: 'omad', name: 'OMAD · uma refeição ao dia', schedule: 'Aproximadamente 23:1', level: 'Exige orientação', description: 'Concentra quase toda a alimentação em uma refeição e pode dificultar a ingestão adequada de nutrientes.', timerHours: 23 },
  { id: 'eat-stop-eat', name: 'Jejum de 24 horas', schedule: 'Um intervalo de 24 h, não diário', level: 'Exige orientação', description: 'Jejum prolongado; não deve ser tratado como uma meta de desempenho nem iniciado sem orientação profissional.', timerHours: 24 },
  { id: 'five-two', name: 'Método 5:2', schedule: '5 dias habituais · 2 dias com restrição planejada', level: 'Exige orientação', description: 'É um padrão semanal, não um cronômetro de jejum contínuo. Dias de restrição precisam de planejamento seguro com profissional.' },
  { id: 'alternate-day', name: 'Dias alternados', schedule: 'Alterna dias habituais e dias de restrição', level: 'Exige orientação', description: 'Pode ser muito restritivo e não é adequado para todas as pessoas; requer acompanhamento individual.' },
  { id: 'early-time', name: 'Janela alimentar antecipada', schedule: 'Concentrar refeições mais cedo no dia', level: 'Intermediário', description: 'Prioriza comer mais cedo e evitar refeições muito tardias; a janela deve caber na rotina e nas necessidades pessoais.' },
];

export function isValidFastingTarget(hours: number): boolean {
  return Number.isFinite(hours) && hours >= 12 && hours <= 24;
}
