import { FormEvent, useEffect, useRef, useState } from 'react';
import { Bot, Send, Sparkles, UserRound, RotateCcw, ShieldCheck } from 'lucide-react';
import { supabase } from '../supabase';
import { useAppData } from '../session';
import { calculateFoodNutrientTotals } from '../data';
import { Button, todayInSaoPaulo } from '../ui';
import './assistant.css';

type Message = { role: 'user' | 'model'; text: string };
const suggestions = [
  'Monte um almoço saudável com arroz e feijão.',
  'Sugira um lanche com bastante proteína.',
  'O que posso cozinhar com ovos e legumes?',
  'Como substituir refrigerante no dia a dia?',
];

export function Assistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  const [includeDiaryContext, setIncludeDiaryContext] = useState(false);
  const { data: appData } = useAppData();
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages, busy]);
  useEffect(() => {
    let active = true;
    fetch('/api/ai/status').then((response) => response.json()).then((status: { available?: boolean }) => {
      if (active) setAiAvailable(status.available === true);
    }).catch(() => { if (active) setAiAvailable(false); });
    return () => { active = false; };
  }, []);

  async function send(text = draft) {
    const message = text.trim();
    if (!message || busy) return;
    setDraft('');
    setNotice('');
    const next = [...messages, { role: 'user' as const, text: message }];
    setMessages(next);
    setBusy(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('Sua sessão expirou. Entre novamente para usar o assistente.');
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({
          message,
          history: messages.slice(-8),
          ...(includeDiaryContext ? {
            diaryContext: (() => {
              const today = todayInSaoPaulo();
              const entries = appData.foodEntries.filter((entry) => entry.date === today);
              const totals = calculateFoodNutrientTotals(entries);
              return {
                date: today,
                totals,
                goals: appData.profile?.goals ?? null,
                loggedMeals: entries.length,
              };
            })(),
          } : {}),
        }),
      });
      const result = await response.json() as { answer?: string; error?: string };
      if (!response.ok || !result.answer) throw new Error(result.error || 'Não foi possível obter uma resposta.');
      setMessages([...next, { role: 'model', text: result.answer }]);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Não foi possível conectar ao Coach de IA.');
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void send();
  }

  return (
    <section className="page page-enter ai-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">SEU APOIO DIÁRIO</p>
          <h1>Coach de IA</h1>
          <p className="page-description">Ideias práticas para sua alimentação, receitas e escolhas do dia a dia.</p>
        </div>
      </div>

      <section className="ai-hero" aria-label="Coach de IA do SISTCS Leve">
        <div className="ai-hero-icon"><Sparkles size={25} aria-hidden="true" /></div>
        <div className="ai-hero-copy">
          <span className="ai-kicker">SISTCS LEVE · IA</span>
          <h2>Vamos cuidar da sua rotina?</h2>
          <p>Converse sobre refeições, receitas e substituições de alimentos. As sugestões são educativas e podem precisar de confirmação nutricional.</p>
        </div>
        <span className={'ai-status ' + (aiAvailable === false ? 'ai-status-pending' : '')}><span /> {aiAvailable === false ? 'Configuração pendente' : aiAvailable === true ? 'Gemini disponível' : 'Verificando IA…'}</span>
      </section>

      {aiAvailable === false && <p className="ai-setup-note" role="status">A tela do assistente está pronta, mas a chave segura do Gemini ainda precisa ser configurada na Cloudflare. Nenhuma outra função do aplicativo depende dessa configuração.</p>}

      <section className="ai-chat-card" aria-label="Conversa com o Coach de IA">
        <div className="ai-chat-heading">
          <span className="ai-avatar"><Bot size={21} aria-hidden="true" /></span>
          <div><strong>Coach de IA</strong><p>Português brasileiro · respostas objetivas</p></div>
          <Button variant="outline" size="icon" onClick={() => { setMessages([]); setNotice(''); }} disabled={busy} aria-label="Limpar conversa" title="Limpar conversa"><RotateCcw size={17} /></Button>
        </div>
        <div className="ai-messages" aria-live="polite" aria-busy={busy}>
          {messages.length === 0 && (
            <div className="ai-welcome">
              <span className="ai-welcome-icon"><Sparkles size={22} aria-hidden="true" /></span>
              <h3>Como posso ajudar hoje?</h3>
              <p>Escolha uma ideia ou escreva sua própria pergunta.</p>
              <div className="ai-suggestions">
                {suggestions.map((item) => <Button key={item} variant="outline" size="sm" block onClick={() => void send(item)} disabled={busy}>{item}</Button>)}
              </div>
            </div>
          )}
          {messages.map((item, index) => (
            <article className={`ai-message ai-message-${item.role}`} key={`${index}-${item.role}`}>
              <span className="ai-message-avatar">{item.role === 'user' ? <UserRound size={16} /> : <Bot size={16} />}</span>
              <p>{item.text}</p>
            </article>
          ))}
          {busy && <div className="ai-thinking" role="status"><span /><span /><span /> Preparando uma resposta…</div>}
          <div ref={endRef} />
        </div>
        {notice && <p className="ai-error" role="alert">{notice}</p>}
        <form className="ai-compose" onSubmit={onSubmit}>
          <label className="sr-only" htmlFor="ai-message">Sua pergunta</label>
          <textarea id="ai-message" ref={inputRef} value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={4000} rows={2} placeholder="Ex.: me ajude a montar um jantar simples…" disabled={busy} />
          <Button type="submit" disabled={busy || !draft.trim()} aria-label="Enviar pergunta"><Send size={18} aria-hidden="true" /><span>Enviar</span></Button>
        </form>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '12px 14px', fontSize: 13, lineHeight: 1.45 }}>
          <input type="checkbox" checked={includeDiaryContext} onChange={(event) => setIncludeDiaryContext(event.target.checked)} />
          <span><strong>Usar meu resumo alimentar de hoje</strong><br />Se ativado, envia apenas totais agregados de calorias, nutrientes, metas e quantidade de lançamentos — não nomes de alimentos nem histórico completo. Desativado por padrão.</span>
        </label>
        <p className="ai-privacy"><ShieldCheck size={15} aria-hidden="true" /> Não envie dados pessoais. Evite compartilhar informações de saúde identificáveis.</p>
      </section>
      <p className="ai-disclaimer">Informação educativa, não é diagnóstico nem substitui orientação de nutricionista ou médico. Valores nutricionais devem ser confirmados na base do aplicativo.</p>
    </section>
  );
}
