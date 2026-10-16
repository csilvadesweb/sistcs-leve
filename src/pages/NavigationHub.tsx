import { Link } from 'wouter';
import {
  Apple, BrainCircuit, CalendarDays, ChartNoAxesCombined, ChefHat, ChevronRight,
  ClipboardList, Droplets, Footprints, GlassWater, Pill, Scale, ShoppingBasket,
  Sparkles, Timer, Utensils, Watch, Dumbbell, BellRing, Target, FileChartColumn,
} from 'lucide-react';
import { WaterReminders } from '../WaterReminders';

type HubItem = { title: string; description: string; href: string; icon: typeof Apple };

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
      { title: 'Conectar dispositivos', description: 'Acesse a área de atividade e a integração com Health Connect.', href: '/exercicios', icon: Watch },
      { title: 'Metas de atividade', description: 'Consulte e acompanhe sua rotina de exercícios.', href: '/exercicios', icon: Dumbbell },
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
