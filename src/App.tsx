import { Suspense, lazy, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import {
  Apple,
  CalendarDays,
  ChartNoAxesCombined,
  CircleUserRound,
  ClipboardList,
  Heart,
  House,
  Dumbbell,
  Pill,
  Timer,
  CookingPot,
  Sparkles,
} from 'lucide-react';
import { Link, Route, Router as WouterRouter, Switch, useLocation } from 'wouter';
import { useHashLocation } from 'wouter/use-hash-location';
import { AuthGate, useAppData } from './session';
import { Avatar } from './photos';
import { PwaBanners } from './pwa';
import { saveNavigationPreferences } from './data';

const Home = lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })));
const FoodTracking = lazy(() => import('./pages/Food').then((m) => ({ default: m.FoodTracking })));
const Records = lazy(() => import('./pages/Records').then((m) => ({ default: m.Records })));
const Medications = lazy(() => import('./pages/Medications').then((m) => ({ default: m.Medications })));
const Fasting = lazy(() => import('./pages/Fasting').then((m) => ({ default: m.Fasting })));
const Reports = lazy(() => import('./pages/Reports').then((m) => ({ default: m.Reports })));
const Exercises = lazy(() => import('./pages/Exercises').then((m) => ({ default: m.Exercises })));
const ProfileSettings = lazy(() => import('./pages/Profile').then((m) => ({ default: m.ProfileSettings })));
const Recipes = lazy(() => import('./pages/Recipes').then((m) => ({ default: m.Recipes })));
const Assistant = lazy(() => import('./pages/Assistant').then((m) => ({ default: m.Assistant })));

const destinations = [
  { href: '/', label: 'Início', short: 'Início', icon: House },
  { href: '/alimentacao', label: 'Alimentação', short: 'Comida', icon: Apple },
  { href: '/receitas', label: 'Receitas', short: 'Receitas', icon: CookingPot },
  { href: '/assistente', label: 'Assistente IA', short: 'IA', icon: Sparkles },
  { href: '/exercicios', label: 'Exercícios', short: 'Exercícios', icon: Dumbbell },
  { href: '/registros', label: 'Registros', short: 'Evolução', icon: ClipboardList },
  { href: '/jejum', label: 'Jejum', short: 'Jejum', icon: Timer },
  { href: '/medicamentos', label: 'Medicamentos', short: 'Remédio', icon: Pill },
  { href: '/relatorios', label: 'Relatórios', short: 'Gráficos', icon: ChartNoAxesCombined },
  { href: '/perfil', label: 'Perfil', short: 'Perfil', icon: CircleUserRound },
];

const dateParts = (opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', ...opts }).format(new Date());
const upperFirst = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const dateLong = upperFirst(dateParts({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
const dateShort = upperFirst(dateParts({ weekday: 'short', day: 'numeric', month: 'short' }).replace('.', ''));

function NavLink({ href, label, text, icon: Icon, active, mobile = false }: {
  href: string;
  label: string;
  text?: string;
  icon: typeof House;
  active: boolean;
  mobile?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={`nav-link ${active ? 'nav-link-active' : ''} ${mobile ? 'nav-link-mobile' : ''}`}
    >
      <Icon aria-hidden="true" strokeWidth={active ? 2.1 : 1.7} />
      <span>{text ?? label}</span>
    </Link>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { data, user } = useAppData();
  const navigationPreferences = data.profile?.navigationPreferences;
  const defaultOrder = destinations.map((item) => item.href);
  const savedOrderKey = navigationPreferences?.order.join('|') ?? '';
  const [mobileOrder, setMobileOrder] = useState<string[]>(() => navigationPreferences?.order ?? defaultOrder);
  const [draggingHref, setDraggingHref] = useState<string | null>(null);
  const [navSaveStatus, setNavSaveStatus] = useState('');
  const navRef = useRef<HTMLElement | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    href: string;
    startX: number;
    startY: number;
    active: boolean;
    originalOrder: string[];
    latestOrder: string[];
    suppressClick: boolean;
  } | null>(null);

  useEffect(() => {
    if (navigationPreferences?.order) setMobileOrder([...navigationPreferences.order]);
  }, [savedOrderKey]);

  const orderedDestinations = [...destinations]
    .sort((a, b) => {
      const ai = mobileOrder.indexOf(a.href);
      const bi = mobileOrder.indexOf(b.href);
      return (ai < 0 ? defaultOrder.indexOf(a.href) : ai) - (bi < 0 ? defaultOrder.indexOf(b.href) : bi);
    })
    .map((item) => ({ ...item, label: navigationPreferences?.labels?.[item.href]?.trim() || item.label }));

  function startNavPointer(event: ReactPointerEvent<HTMLAnchorElement>, href: string) {
    if (event.button !== 0 || dragRef.current?.active) return;
    dragRef.current = {
      pointerId: event.pointerId,
      href,
      startX: event.clientX,
      startY: event.clientY,
      active: false,
      originalOrder: [...mobileOrder],
      latestOrder: [...mobileOrder],
      suppressClick: false,
    };
    setNavSaveStatus('');
  }

  function moveNavPointer(event: ReactPointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (!drag.active) {
      if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 8) return;
      drag.active = true;
      setDraggingHref(drag.href);
      navRef.current?.setPointerCapture?.(event.pointerId);
    }
    event.preventDefault();
    const over = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-nav-href]');
    const targetHref = over?.dataset.navHref;
    if (targetHref && targetHref !== drag.href) {
      const from = drag.latestOrder.indexOf(drag.href);
      const to = drag.latestOrder.indexOf(targetHref);
      if (from >= 0 && to >= 0) {
        const next = [...drag.latestOrder];
        next.splice(from, 1);
        next.splice(to, 0, drag.href);
        drag.latestOrder = next;
        setMobileOrder(next);
      }
    }
    const nav = navRef.current;
    if (nav) {
      const bounds = nav.getBoundingClientRect();
      if (event.clientX < bounds.left + 26) nav.scrollLeft -= 12;
      else if (event.clientX > bounds.right - 26) nav.scrollLeft += 12;
    }
  }

  async function finishNavPointer(event: ReactPointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (!drag.active) {
      dragRef.current = null;
      return;
    }
    event.preventDefault();
    drag.suppressClick = true;
    dragRef.current = drag;
    setDraggingHref(null);
    try {
      const labels = navigationPreferences?.labels ?? {};
      await saveNavigationPreferences(user.id, { order: drag.latestOrder, labels });
      setNavSaveStatus('Ordem do menu salva na sua conta.');
    } catch {
      setMobileOrder(drag.originalOrder);
      setNavSaveStatus('Não foi possível salvar a ordem do menu. A ordem anterior foi restaurada.');
    } finally {
      dragRef.current = { ...drag, active: false, suppressClick: true };
    }
  }

  function cancelNavPointer(event: ReactPointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.active) setMobileOrder(drag.originalOrder);
    setDraggingHref(null);
    dragRef.current = null;
  }

  function handleNavClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (dragRef.current?.suppressClick) {
      event.preventDefault();
      dragRef.current = null;
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Navegação principal">
        <Link href="/" className="brand-mark" aria-label="SISTCS Leve — Início">
          <img className="brand-emblem" src={`${import.meta.env.BASE_URL}emblem.webp`} alt="" width={42} height={42} />
          <span className="brand-name">SISTCS<span>leve</span></span>
        </Link>
        <p className="sidebar-caption">SEU ESPAÇO DE CUIDADO</p>
        <nav className="desktop-nav" aria-label="Áreas do aplicativo">
          {orderedDestinations.map(({ href, label, icon }) => (
            <NavLink key={href} href={href} label={label} icon={icon} active={location === href} />
          ))}
        </nav>
        <div className="sidebar-foot">
          <span className="foot-mark"><Heart size={14} aria-hidden="true" /></span>
          <p>Um passo de cada vez.<br /><strong>Você está no seu tempo.</strong></p>
        </div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <div className="mobile-brand">
            <img className="brand-emblem" src={`${import.meta.env.BASE_URL}emblem.webp`} alt="" width={34} height={34} />
            <span className="brand-name">SISTCS<span>leve</span></span>
          </div>
          <div className="topbar-date">
            <CalendarDays size={16} aria-hidden="true" />
            <time dateTime={new Date().toISOString().slice(0, 10)}><span className="date-long">{dateLong}</span><span className="date-short">{dateShort}</span></time>
          </div>
          <Link href="/relatorios" className="stage-tag">VER RELATÓRIOS</Link>
          <Link href="/perfil" className="topbar-avatar" aria-label="Abrir o perfil">
            <Avatar path={data.profile?.avatarPath} name={data.profile?.displayName} size={36} />
          </Link>
        </header>
        <PwaBanners />
        <main className="main-content" id="conteudo-principal">{children}</main>
        <nav
          ref={navRef}
          className={`mobile-nav ${draggingHref ? 'is-reordering' : ''}`}
          aria-label="Navegação principal"
          onPointerMove={moveNavPointer}
          onPointerUp={(event) => { void finishNavPointer(event); }}
          onPointerCancel={cancelNavPointer}
        >
          {orderedDestinations.map(({ href, label, short, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              data-nav-href={href}
              draggable={false}
              aria-label={`${label}. Pressione e arraste para reorganizar.`}
              aria-current={location === href ? 'page' : undefined}
              className={`nav-link nav-link-mobile ${location === href ? 'nav-link-active' : ''} ${draggingHref === href ? 'nav-link-dragging' : ''}`}
              onPointerDown={(event) => startNavPointer(event, href)}
              onClick={handleNavClick}
            >
              <Icon aria-hidden="true" strokeWidth={location === href ? 2.1 : 1.7} />
              <span>{navigationPreferences?.labels?.[href]?.trim() || short}</span>
            </Link>
          ))}
          <span className="sr-only" role="status" aria-live="polite">{navSaveStatus}</span>
        </nav>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="page page-enter">
      <section className="initial-card">
        <h2>Página não encontrada</h2>
        <p className="empty-description">O endereço que você abriu não existe neste aplicativo.</p>
        <p className="empty-description"><Link href="/">Voltar ao início</Link></p>
      </section>
    </div>
  );
}

export default function App() {
  return (
    <AuthGate>
      <WouterRouter hook={useHashLocation}>
        <Shell>
          <Suspense fallback={<p className="auth-loading" role="status">Carregando…</p>}>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/alimentacao" component={FoodTracking} />
            <Route path="/receitas" component={Recipes} />
            <Route path="/assistente" component={Assistant} />
            <Route path="/exercicios" component={Exercises} />
            <Route path="/registros" component={Records} />
            <Route path="/jejum" component={Fasting} />
            <Route path="/medicamentos" component={Medications} />
            <Route path="/relatorios" component={Reports} />
            <Route path="/perfil" component={ProfileSettings} />
            <Route component={NotFound} />
          </Switch>
          </Suspense>
        </Shell>
      </WouterRouter>
    </AuthGate>
  );
}
