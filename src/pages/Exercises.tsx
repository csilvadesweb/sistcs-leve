import {useEffect,useMemo,useRef,useState,type FormEvent} from 'react';
import {Activity,Bike,Dumbbell,Footprints,Music,Plus,Save,Trash2,Trophy,Waves} from 'lucide-react';
import {useAppData} from '../session';
import {deleteExerciseEntry,type ExerciseEntry} from '../data';
import {getSavedExerciseMetrics,saveExerciseWithMetrics} from '../exercise-persistence';
import {EXERCISE_ACTIVITIES,estimateExerciseCalories,validateExerciseInput} from '../exercise';
import {decimalText,todayInSaoPaulo} from '../ui';
import {HealthActivityCard} from '../components/HealthActivityCard';

type FormState={date:string;activityId:string;duration:string;weight:string;note:string};
const blank=(date:string,weight:number|null):FormState=>({date,activityId:'walking_moderate',duration:'30',weight:weight?String(weight):'',note:''});
const activityMenu=[
  {title:'Caminhada',description:'Leve, moderada, rápida ou trilha',activityId:'walking_moderate',icon:Footprints},
  {title:'Corrida e trote',description:'Trote ou corrida contínua',activityId:'running',icon:Activity},
  {title:'Musculação',description:'Treino leve, moderado ou intenso',activityId:'strength',icon:Dumbbell},
  {title:'Ciclismo',description:'Bicicleta ao ar livre ou ergométrica',activityId:'cycling_moderate',icon:Bike},
  {title:'Natação',description:'Registre o tempo praticado',activityId:'swimming',icon:Waves},
  {title:'Dança e aeróbicos',description:'Dança, elíptico e outras aulas',activityId:'dance',icon:Music},
  {title:'Esportes',description:'Futebol, basquete, vôlei e tênis',activityId:'football',icon:Trophy},
  {title:'Outras atividades',description:'Yoga, pilates, corda, escadas e mais',activityId:'other',icon:Activity},
] as const;

export function Exercises(){
  const{data,error:loadError,loading,reload}=useAppData();
  const[date,setDate]=useState(todayInSaoPaulo());
  const latestWeight=useMemo(()=>[...data.weightEntries].sort((a,b)=>b.date.localeCompare(a.date))[0]?.weightKg??null,[data.weightEntries]);
  const[form,setForm]=useState<FormState>(()=>blank(todayInSaoPaulo(),null));
  const[editing,setEditing]=useState<ExerciseEntry|null>(null);
  const[open,setOpen]=useState(false),[busy,setBusy]=useState(false);
  const[feedback,setFeedback]=useState<{kind:'success'|'error';message:string}|null>(null);
  const durationInputRef=useRef<HTMLInputElement>(null);
  useEffect(()=>{if(!open)return;durationInputRef.current?.focus();function onKeyDown(event:KeyboardEvent){if(event.key==='Escape')setOpen(false)}window.addEventListener('keydown',onKeyDown);return()=>window.removeEventListener('keydown',onKeyDown)},[open]);
  const entries=useMemo(()=>data.exerciseEntries.filter(e=>e.date===date),[data.exerciseEntries,date]);
  const minutes=entries.reduce((s,e)=>s+e.durationMinutes,0),calories=entries.reduce((s,e)=>s+e.caloriesBurned,0);
  const activity=EXERCISE_ACTIVITIES.find(a=>a.id===form.activityId)??EXERCISE_ACTIVITIES[0]!;

  function newEntry(activityId='walking_moderate'){
    setEditing(null);setForm({...blank(date,latestWeight),activityId});setFeedback(null);setOpen(true);
  }
  async function editEntry(e:ExerciseEntry){
    setBusy(true);setFeedback(null);
    try{
      const metrics=await getSavedExerciseMetrics(e.id);
      const savedActivityId=metrics.activityId&&EXERCISE_ACTIVITIES.some(a=>a.id===metrics.activityId)?metrics.activityId:EXERCISE_ACTIVITIES.find(a=>a.label===e.activity)?.id??'other';
      setEditing(e);setForm({date:e.date,activityId:savedActivityId,duration:String(e.durationMinutes),weight:String(metrics.bodyWeightKg??latestWeight??''),note:e.note});setOpen(true);
    }catch(err){setFeedback({kind:'error',message:err instanceof Error?err.message:'Não foi possível carregar os detalhes do exercício.'})}
    finally{setBusy(false)}
  }
  async function submit(event:FormEvent){
    event.preventDefault();
    const a=EXERCISE_ACTIVITIES.find(x=>x.id===form.activityId)??EXERCISE_ACTIVITIES[EXERCISE_ACTIVITIES.length-1]!;
    const durationMinutes=Number(form.duration),bodyWeightKg=Number(form.weight);
    const invalid=validateExerciseInput({date:form.date,activity:a.label,durationMinutes,weightKg:bodyWeightKg,note:form.note});
    if(invalid){setFeedback({kind:'error',message:invalid});return}
    const caloriesBurned=estimateExerciseCalories(a.met,bodyWeightKg,durationMinutes);setBusy(true);
    try{
      await saveExerciseWithMetrics({id:editing?.id,date:form.date,activity:a.label,activityId:a.id,metValue:a.met,bodyWeightKg,durationMinutes,caloriesBurned,note:form.note});
      await reload();setDate(form.date);setOpen(false);setEditing(null);setFeedback({kind:'success',message:'Exercício salvo.'});
    }catch(e){setFeedback({kind:'error',message:e instanceof Error?e.message:'Não foi possível salvar.'})}
    finally{setBusy(false)}
  }
  async function remove(e:ExerciseEntry){
    if(!window.confirm('Excluir o registro de '+e.activity+'?'))return;setBusy(true);
    try{await deleteExerciseEntry(e.id);await reload();setFeedback({kind:'success',message:'Registro excluído.'})}
    catch(err){setFeedback({kind:'error',message:err instanceof Error?err.message:'Não foi possível excluir.'})}
    finally{setBusy(false)}
  }

  return <div className="ft-page page-enter">
    <header className="ft-heading"><div><p className="eyebrow"><span className="eyebrow-dot"/>MOVIMENTO E ENERGIA</p><h1 className="serif-display">Exercícios</h1><p>Escolha uma atividade, informe o tempo praticado e acompanhe a estimativa de calorias queimadas.</p></div><div className="ft-heading-icon" aria-hidden="true"><Dumbbell size={29}/></div></header>
    <section aria-label="Resumo de atividade do dia" style={{marginBlock:'1rem 1.5rem',padding:'1rem',borderRadius:'1.1rem',background:'linear-gradient(135deg, var(--primary, #315b43), #244634)',color:'#fff',boxShadow:'0 8px 24px rgba(25,55,35,.14)'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'.75rem',flexWrap:'wrap',marginBottom:'.9rem'}}>
        <div><p style={{margin:0,fontSize:'.72rem',fontWeight:700,letterSpacing:'.12em',opacity:.82}}>SEU PROGRESSO</p><h2 style={{margin:'.2rem 0 0',fontSize:'1.1rem',fontWeight:700}}>Resumo dos exercícios</h2></div>
        <span style={{fontSize:'.82rem',padding:'.35rem .65rem',borderRadius:'999px',background:'rgba(255,255,255,.14)'}}>{date===todayInSaoPaulo()?'Hoje':'Dia selecionado'}</span>
      </div>
      <div className="exercise-summary" style={{margin:0,display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:'.65rem'}}>
        <div style={{padding:'.8rem .65rem',borderRadius:'.8rem',background:'rgba(255,255,255,.12)',minWidth:0}}><span style={{display:'block',fontSize:'.76rem',lineHeight:1.3,opacity:.86}}>Calorias queimadas</span><strong style={{display:'block',fontSize:'clamp(1.05rem,4vw,1.55rem)',lineHeight:1.25,marginTop:'.35rem',overflowWrap:'anywhere'}}>{decimalText(calories)} kcal</strong></div>
        <div style={{padding:'.8rem .65rem',borderRadius:'.8rem',background:'rgba(255,255,255,.12)',minWidth:0}}><span style={{display:'block',fontSize:'.76rem',lineHeight:1.3,opacity:.86}}>Tempo ativo</span><strong style={{display:'block',fontSize:'clamp(1.05rem,4vw,1.55rem)',lineHeight:1.25,marginTop:'.35rem'}}>{minutes} min</strong></div>
        <div style={{padding:'.8rem .65rem',borderRadius:'.8rem',background:'rgba(255,255,255,.12)',minWidth:0}}><span style={{display:'block',fontSize:'.76rem',lineHeight:1.3,opacity:.86}}>Atividades</span><strong style={{display:'block',fontSize:'clamp(1.05rem,4vw,1.55rem)',lineHeight:1.25,marginTop:'.35rem'}}>{entries.length}</strong></div>
      </div>
      <p style={{fontSize:'.76rem',lineHeight:1.4,margin:'.75rem 0 0',opacity:.78}}>Estimativas calculadas a partir dos exercícios registrados na data selecionada.</p>
    </section>
    {loadError&&<p className="ft-feedback ft-feedback-error" role="alert">{loadError}</p>}
    {loading&&<p role="status">Carregando registros…</p>}
    <HealthActivityCard />
    {!data.exerciseTrackingAvailable&&<div className="exercise-notice" role="status"><strong>Ativação pendente.</strong> A tabela ainda não existe no banco conectado. Aplique <code>supabase/migrations/20261012_exercise_entries.sql</code> no projeto correto para habilitar gravação. Dados existentes não são removidos.</div>}

    <section aria-labelledby="exercise-menu-title" style={{marginBlock:'1.25rem'}}>
      <div className="ft-card-heading" style={{marginBottom:'.85rem'}}><div><p className="ft-kicker">ESCOLHA SUA ATIVIDADE</p><h2 className="rep-title" id="exercise-menu-title">O que você praticou?</h2></div></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,260px),1fr))',gap:'.8rem'}}>
        {activityMenu.map(item=>{const Icon=item.icon;return <button key={item.title} type="button" className="ft-card exercise-menu-card" onClick={()=>newEntry(item.activityId)} disabled={busy} style={{display:'flex',alignItems:'center',gap:'.85rem',padding:'1rem',textAlign:'left',width:'100%',cursor:!busy?'pointer':'not-allowed',border:'1px solid var(--border, rgba(90,110,90,.16))',borderRadius:'1rem',background:'var(--card, #fff)',color:'inherit',minHeight:'92px',boxShadow:'0 3px 12px rgba(25,45,30,.045)',transition:'transform .16s ease, box-shadow .16s ease'}}>
          <span aria-hidden="true" style={{display:'grid',placeItems:'center',width:'44px',height:'44px',flexShrink:0,borderRadius:'.8rem',background:'var(--surface-muted, #edf3ed)',color:'var(--primary, #315b43)'}}><Icon size={22}/></span>
          <span style={{display:'flex',flexDirection:'column',gap:'.25rem',flex:1,minWidth:0}}><strong>{item.title}</strong><span style={{fontSize:'.84rem',lineHeight:1.35,opacity:.75}}>{item.description}</span></span><Plus size={18} aria-hidden="true"/>
        </button>})}
      </div>
      {!data.exerciseTrackingAvailable&&<p className="ft-feedback ft-feedback-error" role="status">Você pode informar a duração e visualizar a estimativa agora. Para salvar o registro, é necessário ativar a tabela de exercícios no banco conectado.</p>}
    </section>

    {open&&<div role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)setOpen(false)}} style={{position:'fixed',inset:0,zIndex:1000,display:'flex',alignItems:'flex-start',justifyContent:'center',overflowY:'auto',WebkitOverflowScrolling:'touch',padding:'max(1rem, env(safe-area-inset-top)) 1rem max(1rem, env(safe-area-inset-bottom))',boxSizing:'border-box',background:'rgba(15,25,18,.58)',backdropFilter:'blur(3px)'}}>
      <section className="ft-card" role="dialog" aria-modal="true" aria-labelledby="exercise-form-title" style={{width:'min(100%,680px)',maxHeight:'calc(100dvh - 2rem)',overflowY:'auto',overscrollBehavior:'contain',WebkitOverflowScrolling:'touch',boxSizing:'border-box',flexShrink:0,marginBlock:'auto',boxShadow:'0 24px 80px rgba(0,0,0,.28)',border:'1px solid var(--border, rgba(90,110,90,.2))'}}>
        <div className="ft-card-heading"><div><p className="ft-kicker">REGISTRO DE ATIVIDADE</p><h2 className="rep-title" id="exercise-form-title">{editing?'Editar atividade':'Registrar '+(EXERCISE_ACTIVITIES.find(a=>a.id===form.activityId)?.label??'atividade')}</h2></div><button type="button" onClick={()=>setOpen(false)} aria-label="Fechar formulário">Fechar</button></div>
        <form onSubmit={submit}><div className="exercise-form-grid">
          <label className="exercise-field">Data<input type="date" required value={form.date} onChange={e=>setForm(v=>({...v,date:e.target.value}))}/></label>
          <label className="exercise-field">Atividade<select value={form.activityId} onChange={e=>setForm(v=>({...v,activityId:e.target.value}))}>{EXERCISE_ACTIVITIES.map(a=><option value={a.id} key={a.id}>{a.label}</option>)}</select></label>
          <label className="exercise-field">Duração (minutos)<input ref={durationInputRef} type="number" min="1" max="1440" required value={form.duration} onChange={e=>setForm(v=>({...v,duration:e.target.value}))}/></label>
          <label className="exercise-field">Peso usado (kg)<input type="number" min="20" max="400" step=".1" required value={form.weight} onChange={e=>setForm(v=>({...v,weight:e.target.value}))} placeholder={latestWeight?String(latestWeight):'Ex.: 70'}/></label>
        </div><label className="exercise-field">Observações<textarea maxLength={300} rows={2} value={form.note} onChange={e=>setForm(v=>({...v,note:e.target.value}))}/></label>
        <p className="ft-preview"><strong>{decimalText(estimateExerciseCalories(activity.met,Number(form.weight),Number(form.duration)))} kcal estimadas</strong><span>Estimativa aproximada por MET; o gasto real varia.</span></p>
        {!data.exerciseTrackingAvailable&&<p className="ft-feedback ft-feedback-error" role="status">A estimativa aparece aqui, mas o banco ainda não permite salvar este registro.</p>}
        <div className="exercise-actions"><button className="btn" type="submit" disabled={busy||!data.exerciseTrackingAvailable}><Save size={16}/>{busy?' Salvando…':' Salvar exercício'}</button><button type="button" onClick={()=>setOpen(false)}>Cancelar</button></div></form>
      </section>
    </div>}

    
    <section className="ft-card">
      <div className="ft-card-heading"><div><p className="ft-kicker">HISTÓRICO DIÁRIO</p><h2 className="rep-title">Seus exercícios</h2></div><button className="btn" type="button" onClick={()=>newEntry()} disabled={!data.exerciseTrackingAvailable||busy}><Plus size={17}/> Adicionar</button></div>
      <label className="exercise-field">Data<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
      {entries.length?entries.map(e=><article className="exercise-entry" key={e.id}><div><strong>{e.activity}</strong><p>{e.durationMinutes} min · {decimalText(e.caloriesBurned)} kcal estimadas</p>{e.note&&<small>{e.note}</small>}</div><div className="exercise-actions"><button type="button" onClick={()=>void editEntry(e)} disabled={busy}>Editar</button><button type="button" onClick={()=>void remove(e)} disabled={busy} aria-label={'Excluir '+e.activity}><Trash2 size={16}/></button></div></article>):<p className="ft-favorites-empty">Nenhuma atividade registrada nesta data.</p>}
    </section>

    {feedback&&<p className={'ft-feedback '+(feedback.kind==='error'?'ft-feedback-error':'')} role={feedback.kind==='error'?'alert':'status'}>{feedback.message}</p>}
  </div>;
}
