import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import {
  BrainCircuit, ChartNoAxesCombined, ChefHat, ChevronRight, ClipboardList,
  Footprints, GlassWater, Scale, Timer, Utensils, Watch, Play, Pause, RotateCcw, Save, Target,
  type LucideIcon,
} from 'lucide-react';
import { WaterReminders } from '../WaterReminders';

type HubItem = { title: string; description: string; href: string; icon: LucideIcon };

const groups: Record<string, { eyebrow: string; title: string; intro: string; items: HubItem[] }> = {
  food: {
    eyebrow: 'SUA ROTINA ALIMENTAR',
    title: 'Alimentação',
    intro: 'Tudo para registrar, planejar e acompanhar sua rotina alimentar, na ordem definida para o SISTCS Leve.',
    items: [
      { title: 'Diário alimentar', description: 'Registre refeições, alimentos, porções, calorias e nutrientes.', href: '/diario', icon: Utensils },
      { title: 'Coach de IA', description: 'Converse sobre sua rotina e receba sugestões contextualizadas pelos dados disponíveis.', href: '/assistente', icon: BrainCircuit },
      { title: 'Hidratação', description: 'Acompanhe a água e configure seus lembretes.', href: '/hidratacao', icon: GlassWater },
      { title: 'Jejum intermitente', description: 'Consulte protocolos, temporizador e histórico de jejum.', href: '/jejum', icon: Timer },
      { title: 'Receitas', description: 'Explore receitas, planeje refeições e organize a lista de compras.', href: '/receitas', icon: ChefHat },
    ],
  },
  activity: {
    eyebrow: 'MOVIMENTO E BEM-ESTAR',
    title: 'Atividade',
    intro: 'Acesse exercícios e os recursos disponíveis para acompanhar seu movimento.',
    items: [
      { title: 'Exercícios e passos', description: 'Registre atividades e consulte os dados de movimento disponíveis.', href: '/exercicios', icon: Footprints },
      { title: 'Conectar dispositivos', description: 'Veja os aplicativos compatíveis com logos oficiais e a integração via Health Connect.', href: '/dispositivos', icon: Watch },
      { title: 'Metas de atividade', description: 'Crie sua própria meta e use o cronômetro para marcar o tempo do exercício.', href: '/metas-atividade', icon: Target },
    ],
  },
  evolution: {
    eyebrow: 'SEU PROGRESSO',
    title: 'Evolução',
    intro: 'Veja seus registros ao longo do tempo e acompanhe tendências para suas metas.',
    items: [
      { title: 'Peso e medidas', description: 'Registre peso e consulte seu histórico corporal.', href: '/registros', icon: Scale },
      { title: 'Gráficos e relatórios', description: 'Consulte resumos e indicadores do seu progresso.', href: '/relatorios', icon: ChartNoAxesCombined },
      { title: 'Histórico e registros', description: 'Revise os dados registrados na sua conta.', href: '/registros', icon: ClipboardList },
    ],
  },
};

function Hub({ group }: { group: keyof typeof groups }) {
  const config = groups[group];
  return (
    <div className="page page-enter">
      <section className="page-heading">
        <div className="heading-copy">
          <p className="eyebrow"><span className="eyebrow-dot" />{config.eyebrow}</p>
          <h1 className="serif-display">{config.title}</h1>
          <p className="page-intro">{config.intro}</p>
        </div>
      </section>
      <section className="hub-grid" aria-label={`Opções de ${config.title}`}>
        {config.items.map(({ title, description, href, icon: Icon }) => (
          <Link key={title} href={href} className="hub-card">
            <span className="hub-card-icon"><Icon size={22} aria-hidden="true" /></span>
            <span className="hub-card-copy"><strong>{title}</strong><small>{description}</small></span>
            <ChevronRight size={19} aria-hidden="true" className="hub-card-chevron" />
          </Link>
        ))}
      </section>
      <p className="hub-footnote">As opções internas não ocupam espaço no menu inferior. Use os cinco destinos fixos para navegar entre as áreas principais.</p>
    </div>
  );
}

export function FoodHub() { return <Hub group="food" />; }
export function ActivityHub() { return <Hub group="activity" />; }
export function EvolutionHub() { return <Hub group="evolution" />; }

export function HydrationPage() {
  return (
    <div className="page page-enter">
      <section className="page-heading">
        <div className="heading-copy">
          <p className="eyebrow"><span className="eyebrow-dot" />ROTINA E CUIDADO</p>
          <h1 className="serif-display">Hidratação</h1>
          <p className="page-intro">Configure os lembretes de água. O registro diário continua disponível nos recursos de alimentação já existentes.</p>
        </div>
      </section>
      <WaterReminders />
      <p className="hub-footnote"><Link href="/alimentacao">Voltar para Alimentação</Link></p>
    </div>
  );
}


const deviceApps = [
  { name: 'Samsung Health', detail: 'Fonte de atividade para dispositivos Samsung, quando a sincronização com Health Connect estiver habilitada.', logoUrl: 'https://d3unf4s5rp9dfh.cloudfront.net/SHealth_doc/samsung-health_72x72.png', alt: 'Ícone oficial Samsung Health' },
  { name: 'Google Fit', detail: 'Pode compartilhar dados compatíveis quando instalado e configurado no aparelho.', logoUrl: 'https://developers.google.com/fit/images/fit_icon_512x512.png', alt: 'Ícone oficial Google Fit' },
  { name: 'Fitbit', detail: 'A disponibilidade depende da configuração do aplicativo e do compartilhamento com Health Connect.', logo: 'fitbit.svg', alt: 'Ícone Fitbit' },
  { name: 'Garmin Connect', detail: 'A sincronização depende da integração habilitada no ecossistema Garmin/Health Connect.', logoUrl: 'https://static.garmincdn.com/com.garmin.connect/content/images/developer/gc-app-tile/xhdpi/gc-app-tile_@240.png', alt: 'Ícone oficial Garmin Connect' },
];

export function ActivityDevicesPage() {
  const [selectedDevice, setSelectedDevice] = useState<(typeof deviceApps)[number] | null>(null);
  const connectionIntent = 'intent://connect/#Intent;scheme=sistcs;package=com.sistcs.leve.activitysync;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end';

  return (
    <div className="page page-enter">
      <section className="page-heading">
        <div className="heading-copy">
          <p className="eyebrow"><span className="eyebrow-dot" />INTEGRAÇÕES OFICIAIS</p>
          <h1 className="serif-display">Conectar dispositivos</h1>
          <p className="page-intro">Integrações exibidas por aplicativo oficial. A conexão real acontece no Android e depende das permissões e da compatibilidade de cada app.</p>
        </div>
      </section>
      <section className="hub-grid" aria-label="Aplicativos e integrações compatíveis">
        {deviceApps.map((device) => (
          <button className="hub-card" type="button" key={device.name} onClick={() => setSelectedDevice(device)} aria-label={`Opções de conexão: ${device.name}`} style={{textAlign:'left',width:'100%',font:'inherit',color:'inherit',cursor:'pointer'}}>
            <span className="hub-card-icon" style={{background:'#fff',border:'1px solid var(--border, #e4e9e4)',display:'grid',placeItems:'center',overflow:'hidden',width:'64px',height:'64px',minWidth:'64px',flex:'0 0 64px',padding:'4px',boxSizing:'border-box'}}>
              <img src={device.logoUrl ?? `${import.meta.env.BASE_URL}device-logos/${device.logo}`} alt={device.alt} width="56" height="56" loading="eager" decoding="async" style={{width:'56px',height:'56px',objectFit:'contain',display:'block'}} onError={(event) => { event.currentTarget.style.display = 'none'; }} />
            </span>
            <span className="hub-card-copy"><strong>{device.name}</strong><small>{device.detail}</small><small style={{display:'block',marginTop:'.35rem',fontWeight:600}}>Toque para conectar <span aria-hidden="true">→</span></small></span>
          </button>
        ))}
      </section>
      {selectedDevice && (
        <div role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setSelectedDevice(null); }} style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(12,20,16,.58)',display:'grid',placeItems:'center',padding:'1rem'}}>
          <section role="dialog" aria-modal="true" aria-labelledby="device-connect-title" className="initial-card" style={{width:'100%',maxWidth:'440px',boxSizing:'border-box'}}>
            <p className="eyebrow">CONECTIVIDADE</p>
            <h2 id="device-connect-title">Conectar {selectedDevice.name}</h2>
            <p>O SISTCS Leve recebe passos e exercícios pelo Health Connect usando o aplicativo Android complementar. O toque aqui abre o fluxo real de autorização e sincronização; não simula uma conexão.</p>
            <ol>
              <li>Confirme que {selectedDevice.name} está instalado e compartilhando dados com o Health Connect, quando compatível.</li>
              <li>No app complementar do SISTCS Leve, entre na mesma conta e toque em <strong>Conectar e sincronizar</strong> (ou <strong>Sincronizar agora</strong>).</li>
              <li>Autorize a leitura de passos e exercícios no Android, se solicitado.</li>
            </ol>
            <div style={{display:'flex',gap:'.75rem',flexWrap:'wrap',marginTop:'1rem'}}>
              <a className="btn btn-primary" href={connectionIntent} style={{textDecoration:'none'}}>Abrir conexão no Android</a>
              <button className="btn btn-outline" type="button" onClick={() => setSelectedDevice(null)}>Fechar</button>
            </div>
            <p className="empty-description" style={{marginTop:'.75rem'}}>Se o app complementar não estiver instalado, instale-o primeiro no aparelho. No computador, a conexão por Health Connect não está disponível.</p>
          </section>
        </div>
      )}
      <section className="initial-card" style={{marginTop:'1rem'}}>
        <h2>Health Connect é a ponte de sincronização</h2>
        <p>Ele não é um dispositivo. É o recurso do Android que permite compartilhar dados entre aplicativos compatíveis, depois que você concede as permissões.</p>
        <h2>Como conectar no Android</h2>
        <ol>
          <li>Instale e abra o aplicativo oficial do dispositivo ou relógio.</li>
          <li>Ative nele o compartilhamento de atividade com o Health Connect, quando disponível.</li>
          <li>Nas configurações do Android, abra Health Connect e autorize a leitura de passos e exercícios.</li>
          <li>Volte ao SISTCS Leve e abra Exercícios para atualizar os dados sincronizados.</li>
        </ol>
        <p className="empty-description">Esta tela não simula uma conexão: os dados só aparecem depois que o aplicativo de origem e as permissões do Android estiverem configurados.</p>
      </section>
      <p className="hub-footnote"><Link href="/atividade">Voltar para Atividade</Link></p>
    </div>
  );
}

const GOAL_STORAGE_KEY = 'sistcs-leve-activity-goal-minutes';
const GOAL_EXERCISE_STORAGE_KEY = 'sistcs-leve-activity-goal-exercise';
const ACTIVITY_EXERCISES = ['Caminhada', 'Corrida', 'Bicicleta', 'Musculação', 'Natação', 'Dança', 'Yoga / Pilates', 'Alongamento', 'Outro'];
const formatClock = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((part) => String(part).padStart(2, '0')).join(':');
};

export function ActivityGoalsPage() {
  const [goalInput, setGoalInput] = useState(() => {
    try { return window.localStorage.getItem(GOAL_STORAGE_KEY) ?? ''; } catch { return ''; }
  });
  const [savedGoal, setSavedGoal] = useState(() => {
    try { return window.localStorage.getItem(GOAL_STORAGE_KEY) ?? ''; } catch { return ''; }
  });
  const [selectedExercise, setSelectedExercise] = useState(() => {
    try { return window.localStorage.getItem(GOAL_EXERCISE_STORAGE_KEY) ?? 'Caminhada'; } catch { return 'Caminhada'; }
  });
  const [savedExercise, setSavedExercise] = useState(() => {
    try { return window.localStorage.getItem(GOAL_EXERCISE_STORAGE_KEY) ?? ''; } catch { return ''; }
  });
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!running || startedAt === null) return;
    const tick = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [running, startedAt]);

  function saveGoal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const minutes = Number(goalInput);
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 10080) {
      setMessage('Informe uma meta semanal entre 1 e 10.080 minutos.');
      return;
    }
    try {
      window.localStorage.setItem(GOAL_STORAGE_KEY, String(minutes));
      window.localStorage.setItem(GOAL_EXERCISE_STORAGE_KEY, selectedExercise);
      setSavedGoal(String(minutes));
      setSavedExercise(selectedExercise);
      setMessage('Sua meta e o exercício escolhido foram salvos neste dispositivo.');
    } catch {
      setMessage('Não foi possível guardar a meta neste dispositivo. Verifique as permissões do navegador.');
    }
  }

  function toggleTimer() {
    if (running) {
      setRunning(false);
      setStartedAt(null);
      setMessage('Cronômetro pausado. O tempo continua exibido até você zerá-lo.');
    } else {
      setStartedAt(Date.now() - elapsed * 1000);
      setRunning(true);
      setMessage('Cronômetro em andamento.');
    }
  }

  function resetTimer() {
    setRunning(false);
    setStartedAt(null);
    setElapsed(0);
    setMessage('Cronômetro zerado.');
  }

  return (
    <div className="page page-enter">
      <section className="page-heading">
        <div className="heading-copy">
          <p className="eyebrow"><span className="eyebrow-dot" />SEU OBJETIVO, SEU RITMO</p>
          <h1 className="serif-display">Metas de atividade</h1>
          <p className="page-intro">Crie uma meta pessoal e marque a duração do exercício com o cronômetro.</p>
        </div>
      </section>
      <section className="initial-card" style={{marginBottom:'1rem'}}>
        <div className="hub-card-copy"><p className="eyebrow">MINHA META</p><h2>Defina sua meta semanal</h2><p className="empty-description">Escolha quantos minutos de atividade você quer praticar por semana.</p></div>
        <form onSubmit={saveGoal} style={{display:'flex',alignItems:'end',gap:'.75rem',flexWrap:'wrap',marginTop:'1rem'}}>
          <label className="exercise-field" style={{flex:'1 1 220px'}}>Exercício que vou fazer
            <select required value={selectedExercise} onChange={(event) => setSelectedExercise(event.target.value)}>
              {ACTIVITY_EXERCISES.map((exercise) => <option key={exercise} value={exercise}>{exercise}</option>)}
            </select>
          </label>
          <label className="exercise-field" style={{flex:'1 1 180px'}}>Minutos por semana
            <input type="number" min="1" max="10080" step="1" required value={goalInput} onChange={(event) => setGoalInput(event.target.value)} placeholder="Ex.: 150" />
          </label>
          <button className="btn" type="submit"><Save size={16} /> Salvar meta</button>
        </form>
        {savedGoal && <p role="status" style={{marginTop:'.75rem'}}><strong>Meta atual:</strong> {savedExercise || selectedExercise} · {savedGoal} minutos por semana.</p>}
        {message && <p role="status" style={{marginTop:'.5rem'}}>{message}</p>}
      </section>
      <section className="initial-card">
        <p className="eyebrow">CRONÔMETRO</p>
        <h2>Tempo de {selectedExercise.toLocaleLowerCase('pt-BR')}</h2>
        <p className="empty-description">Exercício selecionado: {selectedExercise}. Toque em iniciar quando começar e pause ao terminar. O cronômetro mede a duração desta sessão; registre a atividade ao concluir para incluí-la no histórico.</p>
        <p aria-live="off" style={{fontVariantNumeric:'tabular-nums',fontSize:'clamp(2.5rem,12vw,4rem)',fontWeight:750,letterSpacing:'.04em',textAlign:'center',margin:'1.5rem 0'}}>{formatClock(elapsed)}</p>
        <div style={{display:'flex',justifyContent:'center',gap:'.75rem',flexWrap:'wrap'}}>
          <button className="btn" type="button" onClick={toggleTimer}>{running ? <><Pause size={17}/> Pausar</> : <><Play size={17}/> {elapsed ? 'Continuar' : 'Iniciar cronômetro'}</>}</button>
          <button className="btn btn-outline" type="button" onClick={resetTimer} disabled={elapsed===0&&!running}><RotateCcw size={16}/> Zerar</button>
        </div>
      </section>
      <p className="hub-footnote"><Link href="/exercicios">Registrar exercício</Link> · <Link href="/atividade">Voltar para Atividade</Link></p>
    </div>
  );
}
