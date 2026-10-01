import {ExercisePreview} from './ExercisePreview';
import React,{useEffect,useState} from 'react';
import {api,useApp} from '../../context/AppContext';
import {ExerciseTemplate,TrainingSession} from '../../types';
type Draft={name:string;description:string;paper:number;hitsPerPaper:number;plates:number;poppers:number;noShoots:number;conditions:string;measurementType:'hit_factor'|'points';sourceUrl:string;diagramUrl:string;approvedForRange:boolean;saveToLibrary:boolean;sourceTemplateId?:string};
const blank=(i:number):Draft=>({name:`תרגיל ${i+1}`,description:'',paper:0,hitsPerPaper:2,plates:0,poppers:0,noShoots:0,conditions:'',measurementType:'hit_factor',sourceUrl:'',diagramUrl:'',approvedForRange:false,saveToLibrary:false});
const fromTemplate=(t:ExerciseTemplate,i:number):Draft=>({...blank(i),...t,paper:t.paper||0,hitsPerPaper:t.hitsPerPaper||2,plates:t.plates||0,poppers:t.poppers||0,noShoots:t.noShoots||0,conditions:t.conditions||'',measurementType:t.measurementType==='points'?'points':'hit_factor',sourceUrl:t.sourceUrl||'',diagramUrl:t.diagramUrl||'',approvedForRange:!!t.approvedForRange,sourceTemplateId:t.id});
export const ExercisePlanner:React.FC<{training:TrainingSession}>=({training})=>{
 const {exerciseTemplates,refresh,showToast}=useApp();const [draft,setDraft]=useState<Draft[]>([]),[busy,setBusy]=useState(false),[filter,setFilter]=useState('');
 useEffect(()=>{const existing=(training.exerciseIds||[]).map(id=>exerciseTemplates.find(t=>t.id===id)).filter(Boolean) as ExerciseTemplate[];setDraft(existing.length?existing.map(fromTemplate):[blank(0)]);},[training.id,training.exerciseIds?.join(',' )]);
 const library=exerciseTemplates.filter(t=>!t.trainingId&&t.paper!==undefined&&(filter==='all'||filter==='club'&&t.version||filter==='source'&&!t.version||filter===''));
 function update(i:number,next:Partial<Draft>){setDraft(v=>v.map((r,j)=>i===j?{...r,...next}:r));}
 return <section className="dashboard-card space-y-4"><h2>תרגילי האימון</h2><p>בחרו תבנית או הגדירו הרכב מטרות ותנאי מדידה. שמירה יוצרת גרסה ושומרת את התוצאות הקודמות.</p>
 <label className="block">מספר תרגילים<input type="number" min={1} max={30} value={draft.length} className="activation-input" onChange={e=>{const n=Number(e.target.value);if(n<1||n>30)return;if(n<draft.length&&!window.confirm('להסיר תרגילים מהתוכנית? תוצאות קודמות יישמרו.'))return;setDraft(v=>Array.from({length:n},(_,i)=>v[i]||blank(i)));}}/></label>
 <label>ספרייה <select className="activation-input" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">כל התבניות</option><option value="club">תבניות המועדון</option><option value="source">דוגמאות IPSC</option></select></label>
 <form className="space-y-4" onSubmit={async e=>{e.preventDefault();setBusy(true);try{await api('/trainings/'+training.id+'/exercises','POST',{exercises:draft});await refresh();showToast('תוכנית התרגילים נשמרה','success');}catch(e){showToast(e instanceof Error?e.message:'השמירה נכשלה','error');}finally{setBusy(false);}}}>
 {draft.map((row,i)=><fieldset key={i} className="exercise-draft space-y-3"><legend>תרגיל {i+1}</legend>
 <label>בחירה מהספרייה<select className="activation-input" value="" onChange={e=>{const t=library.find(t=>t.id===e.target.value);if(t)update(i,fromTemplate(t,i));}}><option value="">בחרו תבנית…</option>{library.map(t=><option key={t.id} value={t.id}>{t.name} · קרטון {t.paper} · פלייט {t.plates||0} · פופר {t.poppers||0}</option>)}</select></label>
 <ExercisePreview name={row.name} diagramUrl={row.diagramUrl} sourceUrl={row.sourceUrl} paper={row.paper} plates={row.plates} poppers={row.poppers} noShoots={row.noShoots}/>
 <label>שם<input required maxLength={150} className="activation-input" value={row.name} onChange={e=>update(i,{name:e.target.value})}/></label>
 <div className="exercise-counts">{([['paper','מטרות קרטון'],['hitsPerPaper','פגיעות לכל קרטון'],['plates','פלייטים'],['poppers','פופרים'],['noShoots','מטרות ענישה']] as const).map(([key,label])=><label key={key}>{label}<input required type="number" min={key==='hitsPerPaper'?1:0} max={key==='hitsPerPaper'?20:100} className="activation-input" value={row[key]} onChange={e=>update(i,{[key]:Number(e.target.value)})}/></label>)}</div>
 <p>קרטון: {row.paper*row.hitsPerPaper} פגיעות למדידה · מתכת: {row.plates+row.poppers} · נקודות מרביות: {(row.paper*row.hitsPerPaper+row.plates+row.poppers)*5}</p>
 <label>תנאים להשוואה<textarea required maxLength={2000} className="activation-input" placeholder="תיעוד התנאים שאושרו על ידי המדריך, כולל מרחקים והגבלות המטווח" value={row.conditions} onChange={e=>update(i,{conditions:e.target.value})}/></label>
 <label>שיטת מדידה<select className="activation-input" value={row.measurementType} onChange={e=>update(i,{measurementType:e.target.value as Draft['measurementType']})}><option value="hit_factor">Hit Factor</option><option value="points">נקודות</option></select></label>
 <label>קישור לתמונת התרגיל (אופציונלי)<input type="url" dir="ltr" placeholder="https://…/image.jpg" className="activation-input" value={row.diagramUrl} onChange={e=>update(i,{diagramUrl:e.target.value})}/></label>
 {row.sourceUrl&&<a href={row.sourceUrl} className="text-link" target="_blank" rel="noopener noreferrer">המקור והתרשימים באתר IPSC</a>}

 <label className="flex gap-2"><input type="checkbox" required checked={row.approvedForRange} onChange={e=>update(i,{approvedForRange:e.target.checked})}/>אישרתי התאמה לתנאי המטווח. דוגמה מהמקור נשמרת כגרסת מועדון.</label>
 <label className="flex gap-2"><input type="checkbox" checked={row.saveToLibrary} onChange={e=>update(i,{saveToLibrary:e.target.checked})}/>שמירה גם בספריית המועדון</label>
 <button type="button" className="button-outline" disabled={draft.length>=30} onClick={()=>setDraft(v=>[...v,{...row,name:row.name+' — עותק'}])}>העתקת התרגיל</button>
 </fieldset>)}<button className="button-primary" disabled={busy}>{busy?'שומר…':'שמירת תוכנית התרגילים'}</button></form></section>;
};
