import { Suspense, lazy, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { Apple, CalendarDays, ChartNoAxesCombined, CircleUserRound, Heart, House, Dumbbell } from 'lucide-react';
import { Link, Route, Router as WouterRouter, Switch, useLocation } from 'wouter';
import { useHashLocation } from 'wouter/use-hash-location';
import { AuthGate, useAppData } from './session';
import { Avatar } from './photos';
import { PwaBanners } from './pwa';
import { reorderNavigationItem, saveNavigationPreferences } from './data';

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
const NavigationHub = lazy(() => import('./pages/NavigationHub'));

const destinations = [
  { href: '/', label: 'Início', short: 'Início', icon: House },
  { href: '/alimentacao', label: 'Alimentação', short: 'Alimentação', icon: Apple },
  { href: '/atividade', label: 'Atividade', short: 'Atividade', icon: Dumbbell },
  { href: '/evolucao', label: 'Evolução', short: 'Evolução', icon: ChartNoAxesCombined },
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
  const [pressingHref, setPressingHref] = useState<string | null>(null);
  const [navSaveStatus, setNavSaveStatus] = useState('');
  const navRef = useRef<HTMLElement | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    href: string;
    startX: number;
    startY: number;
    lastX: number;
    scrolling: boolean;
    active: boolean;
    originalOrder: string[];
    latestOrder: string[];
    suppressClick: boolean;
    holdTimer: number | null;
  } | null>(null);

  useEffect(() => {
    if (navigationPreferences?.order) setMobileOrder([...navigationPreferences.order]);
  }, [savedOrderKey]);

  const isDestinationActive = (href: string) => {
    if (href === '/') return location === '/';
    if (href === '/alimentacao') return ['/alimentacao', '/diario', '/assistente', '/hidratacao', '/jejum', '/receitas'].includes(location);
    if (href === '/atividade') return ['/atividade', '/exercicios'].includes(location);
    if (href === '/evolucao') return ['/evolucao', '/registros', '/relatorios'].includes(location);
    if (href === '/perfil') return ['/perfil', '/medicamentos'].includes(location);
    return location === href;
  };

  const orderedDestinations = [...destinations]
    .sort((a, b) => {
      const ai = mobileOrder.indexOf(a.href);
      const bi = mobileOrder.indexOf(b.href);
      return (ai < 0 ? defaultOrder.indexOf(a.href) : ai) - (bi < 0 ? defaultOrder.indexOf(b.href) : bi);
    })
    .map((item) => ({ ...item, label: navigationPreferences?.labels?.[item.href]?.trim() || item.label }));

  function startNavPointer(event: ReactPointerEvent<HTMLAnchorElement>, href: string) {
    if (event.button !== 0 || dragRef.current?.active) return;
    const drag = {
      pointerId: event.pointerId,
      href,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      scrolling: false,
      active: false,
      originalOrder: [...mobileOrder],
      latestOrder: [...mobileOrder],
      suppressClick: false,
      holdTimer: null as number | null,
    };
    dragRef.current = drag;
    setPressingHref(href);
    drag.holdTimer = window.setTimeout(() => {
      if (dragRef.current !== drag) return;
      drag.active = true;
      setPressingHref(null);
      setDraggingHref(href);
      navRef.current?.setPointerCapture?.(event.pointerId);
    }, 450);
    setNavSaveStatus('');
  }

  function moveNavPointer(event: ReactPointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (!drag.active) {
      if (drag.scrolling) {
        event.preventDefault();
        const nav = navRef.current;
        if (nav) nav.scrollLeft -= event.clientX - drag.lastX;
        drag.lastX = event.clientX;
        return;
      }
      const deltaX = event.clientX - drag.startX;
      const deltaY = event.clientY - drag.startY;
      if (Math.hypot(deltaX, deltaY) > 10) {
        if (drag.holdTimer !== null) window.clearTimeout(drag.holdTimer);
        setPressingHref(null);
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // A horizontal swipe scrolls the strip; it never starts a reorder.
          drag.scrolling = true;
          drag.lastX = event.clientX;
          navRef.current?.setPointerCapture?.(event.pointerId);
        } else {
          // Vertical movement belongs to the page, not to menu reordering.
          dragRef.current = null;
        }
      }
      return;
    }
    event.preventDefault();
    const over = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-nav-href]');
    const targetHref = over?.dataset.navHref;
    if (targetHref && targetHref !== drag.href) {
      const next = reorderNavigationItem(drag.latestOrder, drag.href, targetHref);
      if (next.some((href, index) => href !== drag.latestOrder[index])) {
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
      if (drag.holdTimer !== null) window.clearTimeout(drag.holdTimer);
      setPressingHref(null);
      dragRef.current = null;
      return;
    }
    event.preventDefault();
    drag.suppressClick = true;
    if (drag.holdTimer !== null) window.clearTimeout(drag.holdTimer);
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
      window.setTimeout(() => {
        if (dragRef.current?.suppressClick) dragRef.current = null;
      }, 0);
    }
  }

  function cancelNavPointer(event: ReactPointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.holdTimer !== null) window.clearTimeout(drag.holdTimer);
    if (drag.active) setMobileOrder(drag.originalOrder);
    setPressingHref(null);
    setDraggingHref(null);
    dragRef.current = null;
  }

  function handleNavClick(event: ReactMouseEvent<HTMLAnchorElement>) {
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
            <NavLink key={href} href={href} label={label} icon={icon} active={isDestinationActive(href)} />
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
              aria-label={`${label}. Mantenha pressionado por um instante e, quando o ícone destacar, arraste para reorganizar.`}
              aria-current={isDestinationActive(href) ? 'page' : undefined}
              className={`nav-link nav-link-mobile ${isDestinationActive(href) ? 'nav-link-active' : ''} ${pressingHref === href ? 'nav-link-pressing' : ''} ${draggingHref === href ? 'nav-link-dragging' : ''}`}
              onPointerDown={(event) => startNavPointer(event, href)}
              onClick={handleNavClick}
              onContextMenu={(event) => event.preventDefault()}
              onDragStart={(event) => event.preventDefault()}
            >
              <Icon aria-hidden="true" strokeWidth={isDestinationActive(href) ? 2.1 : 1.7} />
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
            <Route path="/alimentacao" component={NavigationHub.FoodHub} />
            <Route path="/diario" component={FoodTracking} />
            <Route path="/atividade" component={NavigationHub.ActivityHub} />
            <Route path="/evolucao" component={NavigationHub.EvolutionHub} />
            <Route path="/hidratacao" component={NavigationHub.HydrationPage} />
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
