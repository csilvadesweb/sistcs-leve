import { useCallback, useEffect, useState } from 'react';
import { Activity, RefreshCw, Smartphone } from 'lucide-react';
import { supabase } from '../supabase';

type HealthRecord = {
  id: string;
  record_type: 'daily_steps' | 'exercise_session';
  record_date: string;
  start_time: string | null;
  end_time: string | null;
  value: number | string;
  unit: 'count' | 'minutes';
  activity_name: string | null;
  synced_at: string;
};

function todayInBrazil() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

function isMissingTable(error: { code?: string; message?: string }) {
  const message = (error.message ?? '').toLowerCase();
  return error.code === '42P01' || (error.code === 'PGRST205' && message.includes('health_activity_records'));
}

export function HealthActivityCard() {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [missingTable, setMissingTable] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      setError('Entre na sua conta para consultar a atividade sincronizada.');
      setLoading(false);
      return;
    }
    const { data, error: queryError } = await supabase
      .from('health_activity_records')
      .select('id,record_type,record_date,start_time,end_time,value,unit,activity_name,synced_at')
      .gte('record_date', new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10))
      .order('record_date', { ascending: false })
      .order('start_time', { ascending: false })
      .limit(100);
    if (queryError) {
      if (isMissingTable(queryError)) setMissingTable(true);
      else setError('Não foi possível consultar a atividade sincronizada. Tente novamente.');
      setRecords([]);
    } else {
      setMissingTable(false);
      setRecords((data ?? []) as HealthRecord[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const today = todayInBrazil();
  const todaySteps = records.find((record) => record.record_type === 'daily_steps' && record.record_date === today);
  const sessions = records.filter((record) => record.record_type === 'exercise_session');

  return (
    <section className="profile-privacy-card" aria-labelledby="health-activity-title">
      <div className="profile-privacy-heading">
        <span className="profile-card-icon"><Activity size={20} aria-hidden="true" /></span>
        <div>
          <h2 id="health-activity-title">Dispositivo e atividade física</h2>
          <p>Consulte os passos e as sessões de exercício importados do Health Connect para sua conta.</p>
        </div>
      </div>
      {missingTable ? (
        <p role="status">A sincronização está preparada no app, mas o banco ainda precisa receber a migration aditiva <code>20261012195500_health_activity_records.sql</code>. Nenhum dado será apagado ao ativá-la.</p>
      ) : (
        <>
          <div className="profile-data-actions">
            <div>
              <strong>{todaySteps ? Number(todaySteps.value).toLocaleString('pt-BR') : '—'} passos</strong>
              <p>{todaySteps ? 'Último valor de passos de hoje sincronizado.' : 'Ainda não há passos de hoje sincronizados.'}</p>
            </div>
            <button className="btn btn-outline btn-sm" type="button" onClick={() => void load()} disabled={loading} aria-label="Atualizar atividade sincronizada">
              <RefreshCw size={16} aria-hidden="true" /> {loading ? 'Atualizando…' : 'Atualizar'}
            </button>
          </div>
          {loading && <p role="status">Carregando atividade…</p>}
          {error && <p className="profile-state-error" role="alert">{error}</p>}
          {!loading && !error && sessions.length === 0 && <p>Não há sessões de exercício sincronizadas nos últimos 7 dias.</p>}
          {sessions.length > 0 && (
            <div className="profile-data-actions">
              {sessions.slice(0, 8).map((record) => (
                <div key={record.id}>
                  <strong>{record.activity_name || 'Sessão de exercício'}</strong>
                  <p>{new Date(record.record_date + 'T12:00:00').toLocaleDateString('pt-BR')} · {Number(record.value)} min</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      <p className="profile-data-scope"><Smartphone size={14} aria-hidden="true" /> A leitura acontece no app Android complementar. O Health Connect pede permissão no aparelho; esta tela mostra somente dados vinculados à sua sessão.</p>
    </section>
  );
}
