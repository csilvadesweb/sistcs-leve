import { forwardRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'md' | 'sm';
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'default', size = 'md', className = '', type = 'button', ...props },
  ref,
) {
  return <button ref={ref} type={type} className={`btn btn-${variant} btn-${size} ${className}`} {...props} />;
});

export function Field({
  id,
  label,
  optional,
  hint,
  error,
  className = '',
  children,
}: {
  id: string;
  label: ReactNode;
  optional?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`field ${className}`}>
      <label htmlFor={id}>
        {label}
        {optional && <span> (opcional)</span>}
      </label>
      {children}
      {hint && <p className="field-hint">{hint}</p>}
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/* ---------- formatação e validação de números no padrão brasileiro ---------- */

export function decimalIsValid(value: string, allowZero = true) {
  const normalized = value.trim().replace(',', '.');
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) return false;
  const number = Number(normalized);
  return Number.isFinite(number) && (allowZero ? number >= 0 : number > 0);
}

export function parseDecimal(value: string) {
  return Number(value.trim().replace(',', '.'));
}

export function decimalText(value: number) {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value);
}

export function decimalInputText(value: number) {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 4, useGrouping: false }).format(value);
}

export function todayInSaoPaulo() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Retorna uma data de calendário em São Paulo, sem converter datas locais por UTC. */
export function dateDaysAgoInSaoPaulo(days: number, now: Date = new Date()) {
  const safeDays = Number.isFinite(days) ? Math.max(0, Math.floor(days)) : 0;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const date = new Date(Date.UTC(get('year'), get('month') - 1, get('day') - safeDays));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

export function formatDate(date: string) {
  if (!date) return '';
  const [year, month, day] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(year, month - 1, day),
  );
}

export function readError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

/** Executa uma ação assíncrona, recarrega os dados e traduz falhas em mensagem. */
export function useRunner(reload: () => Promise<void>) {
  const [busy, setBusy] = useState(false);
  async function run(action: () => Promise<void>, onError: (message: string) => void, fallback: string) {
    setBusy(true);
    try {
      await action();
      await reload();
    } catch (e) {
      onError(readError(e, fallback));
    } finally {
      setBusy(false);
    }
  }
  return { busy, run };
}

export function shortDateBR(date: string) {
  if (!date) return '';
  const [year, month, day] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(year, month - 1, day));
}
