import { createContext, useCallback, useContext, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { EMPTY_DATA, loadAll, type AppData } from './data';
import { Button, Field } from './ui';

interface DataContextValue {
  user: User;
  data: AppData;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function useAppData() {
  const value = useContext(DataContext);
  if (!value) throw new Error('useAppData precisa estar dentro de AuthGate.');
  return value;
}

function DataProvider({ user, children }: { user: User; children: ReactNode }) {
  const [data, setData] = useState<AppData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setData(await loadAll(user.id));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível carregar seus dados.');
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    setLoading(true);
    void reload();
  }, [reload]);

  return <DataContext.Provider value={{ user, data, loading, error, reload }}>{children}</DataContext.Provider>;
}

export function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) {
    return (
      <div className="auth-screen">
        <p className="auth-loading" role="status">Carregando…</p>
      </div>
    );
  }
  if (!session) return <AuthScreen />;
  return <DataProvider user={session.user}>{children}</DataProvider>;
}

function translateAuthError(message: string) {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (m.includes('email not confirmed')) return 'Confirme seu e-mail pelo link que enviamos antes de entrar.';
  if (m.includes('already registered')) return 'Este e-mail já tem cadastro. Use a opção Entrar.';
  if (m.includes('password should be at least')) return 'Use uma senha com pelo menos 6 caracteres.';
  if (m.includes('rate limit')) return 'Muitas tentativas em pouco tempo. Aguarde um instante e tente de novo.';
  return `Não foi possível concluir. (${message})`;
}

function AuthScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFeedback(null);
    if (!email.trim() || !password) {
      setFeedback({ kind: 'error', message: 'Informe e-mail e senha.' });
      return;
    }
    setBusy(true);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        if (!data.session) {
          setFeedback({
            kind: 'success',
            message: 'Cadastro criado. Enviamos um link de confirmação para o seu e-mail. Depois de confirmar, volte e entre.',
          });
          setMode('signin');
        }
      }
    } catch (e) {
      setFeedback({ kind: 'error', message: translateAuthError(e instanceof Error ? e.message : String(e)) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">
          <img src={`${import.meta.env.BASE_URL}logo.webp`} alt="SISTCS Leve: saúde, foco e resultados" width={220} height={220} />
        </div>
        <h1 className="auth-title">{mode === 'signin' ? 'Entrar' : 'Criar conta'}</h1>
        <p className="auth-intro">
          Seus registros ficam salvos na sua conta e acompanham você em qualquer dispositivo.
        </p>
        <form onSubmit={onSubmit} noValidate className="auth-form">
          <Field id="auth-email" label="E-mail" className="profile-field">
            <input
              id="auth-email"
              className="input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field
            id="auth-password"
            label="Senha"
            className="profile-field"
            hint={mode === 'signup' ? 'Use pelo menos 6 caracteres.' : undefined}
          >
            <input
              id="auth-password"
              className="input"
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Button type="submit" disabled={busy}>
            {busy ? 'Aguarde…' : mode === 'signin' ? 'Entrar' : 'Criar conta'}
          </Button>
        </form>
        {feedback && (
          <p
            className={`profile-feedback profile-feedback-${feedback.kind}`}
            role={feedback.kind === 'error' ? 'alert' : 'status'}
          >
            {feedback.message}
          </p>
        )}
        <p className="auth-switch">
          {mode === 'signin' ? 'Ainda não tem conta?' : 'Já tem conta?'}{' '}
          <button
            type="button"
            className="link-button"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setFeedback(null);
            }}
          >
            {mode === 'signin' ? 'Criar conta' : 'Entrar'}
          </button>
        </p>
        {mode === 'signup' && (
          <p className="auth-note">Pode ser necessário confirmar o e-mail antes do primeiro acesso.</p>
        )}
      </div>
    </div>
  );
}
