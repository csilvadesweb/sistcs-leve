import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import {
  BrainCircuit, ChartNoAxesCombined, ChefHat, ChevronRight, ClipboardList,
  Footprints, GlassWater, Scale, Timer, Utensils, Watch, Dumbbell, Play, Pause, RotateCcw, Save, Target,
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
  { name: 'Samsung Health', detail: 'Fonte de atividade para dispositivos Samsung, quando a sincronização com Health Connect estiver habilitada.', logo: 'https://cdn.simpleicons.org/samsunghealth/1428A0', alt: 'Logo oficial Samsung Health' },
  { name: 'Health Connect', detail: 'Camada de integração do Android. Autorize os dados de atividade nas configurações do aparelho.', logo: 'https://cdn.simpleicons.org/android/3DDC84', alt: 'Logo oficial Android — Health Connect' },
  { name: 'Google Fit', detail: 'Pode compartilhar dados compatíveis quando instalado e configurado no aparelho.', logo: 'https://cdn.simpleicons.org/googlefit/4285F4', alt: 'Logo oficial Google Fit' },
  { name: 'Fitbit', detail: 'A disponibilidade depende da configuração do aplicativo e do compartilhamento com Health Connect.', logo: 'https://cdn.simpleicons.org/fitbit/00B0B9', alt: 'Logo oficial Fitbit' },
  { name: 'Garmin Connect', detail: 'A sincronização depende da integração habilitada no ecossistema Garmin/Health Connect.', logo: 'https://cdn.simpleicons.org/garmin/007CC3', alt: 'Logo oficial Garmin Connect' },
];

export function ActivityDevicesPage() {
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
          <article className="hub-card" key={device.name} style={{cursor:'default'}}>
            <span className="hub-card-icon" style={{background:'#fff',border:'1px solid var(--border, #e4e9e4)',display:'grid',placeItems:'center',overflow:'hidden'}}>
              <img src={device.logo} alt={device.alt} width="42" height="42" loading="lazy" style={{objectFit:'contain'}} />
            </span>
            <span className="hub-card-copy"><strong>{device.name}</strong><small>{device.detail}</small></span>
          </article>
        ))}
      </section>
      <section className="initial-card" style={{marginTop:'1rem'}}>
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
      setSavedGoal(String(minutes));
      setMessage('Sua meta foi salva neste dispositivo.');
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
          <label className="exercise-field" style={{flex:'1 1 180px'}}>Minutos por semana
            <input type="number" min="1" max="10080" step="1" required value={goalInput} onChange={(event) => setGoalInput(event.target.value)} placeholder="Ex.: 150" />
          </label>
          <button className="btn" type="submit"><Save size={16} /> Salvar meta</button>
        </form>
        {savedGoal && <p role="status" style={{marginTop:'.75rem'}}><strong>Meta atual:</strong> {savedGoal} minutos por semana.</p>}
        {message && <p role="status" style={{marginTop:'.5rem'}}>{message}</p>}
      </section>
      <section className="initial-card">
        <p className="eyebrow">CRONÔMETRO</p>
        <h2>Tempo de exercício</h2>
        <p className="empty-description">Toque em iniciar quando começar e pause ao terminar. O tempo é contado mesmo se a tela ficar em segundo plano.</p>
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
