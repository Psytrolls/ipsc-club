import React,{useState} from 'react';
import {useApp} from '../../context/AppContext';
import {PublicPages} from '../../types';
const socialFields=[
 {key:'whatsappUrl',label:'WhatsApp',placeholder:'https://wa.me/972501234567',hosts:['wa.me','api.whatsapp.com','chat.whatsapp.com']},
 {key:'instagramUrl',label:'Instagram',placeholder:'https://www.instagram.com/your_club/',hosts:['instagram.com','www.instagram.com']},
 {key:'facebookUrl',label:'Facebook',placeholder:'https://www.facebook.com/your_club/',hosts:['facebook.com','www.facebook.com','m.facebook.com','fb.com','www.fb.com']},
] as const;
export const PagesEditor:React.FC=()=>{
 const {pages,savePages}=useApp();const [draft,setDraft]=useState(pages);const [busy,setBusy]=useState(false);const [linkError,setLinkError]=useState('');
 const fields:[keyof PublicPages,string][]=[['heroTitle','כותרת ראשית'],['heroAccent','שורה מודגשת'],['heroBody','טקסט ראשי'],['aboutTitle','כותרת על המועדון'],['aboutBody','על המועדון'],['sportTitle','כותרת על הספורט'],['sportBody','על הספורט']];
 return <form className="dashboard-card space-y-5" onSubmit={async e=>{
  e.preventDefault();setLinkError('');const normalized={...draft};
  for(const field of socialFields){
   const value=(draft[field.key]||'').trim();normalized[field.key]=value;if(!value)continue;
   try{const url=new URL(value);if(url.protocol!=='https:'||url.username||url.password||url.port||!(field.hosts as readonly string[]).includes(url.hostname))throw Error();}
   catch{setLinkError(`יש להזין קישור HTTPS תקין ל-${field.label}.`);return;}
  }
  setBusy(true);try{await savePages(normalized);}finally{setBusy(false);}
 }}>
  <h2>עריכת עמודי האתר</h2><p className="section-copy">הטקסט מתעדכן באתר לאחר שמירה.</p>
  {fields.map(([key,label])=><label className="block" key={key}>{label}<textarea className="w-full p-3 border rounded mt-2" rows={key.endsWith('Body')?4:2} value={draft[key]||''} onChange={e=>setDraft({...draft,[key]:e.target.value})}/></label>)}
  <fieldset className="space-y-4 border-t pt-5">
   <legend className="font-semibold">רשתות חברתיות ויצירת קשר</legend>
   <p className="section-copy" id="social-help">הוסיפו את קישורי המועדון. רק קישורים שמולאו יופיעו בתחתית האתר. להסרת כפתור, רוקנו את השדה ושמרו. ב-WhatsApp אפשר להוסיף קישור למספר בינלאומי או לקבוצה.</p>
   {socialFields.map(field=><label className="block" key={field.key}><span dir="ltr">{field.label}</span><input className="w-full p-3 border rounded mt-2" type="url" dir="ltr" inputMode="url" autoCapitalize="none" autoCorrect="off" maxLength={2000} aria-describedby="social-help" placeholder={field.placeholder} value={draft[field.key]||''} onChange={e=>setDraft({...draft,[field.key]:e.target.value})}/></label>)}
   {linkError&&<p role="alert" className="text-red-700">{linkError}</p>}
  </fieldset>
  <button className="button-primary" disabled={busy}>{busy?'שומר…':'שמירת עמודים'}</button>
 </form>;
};
