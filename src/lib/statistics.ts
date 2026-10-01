import {ExerciseResult} from '../types';
export const TREND_THRESHOLDS={timePercent:3,accuracyPoints:2};
export const median=(values:number[])=>{if(!values.length)return null;const sorted=[...values].sort((a,b)=>a-b),middle=Math.floor(sorted.length/2);return sorted.length%2?sorted[middle]:(sorted[middle-1]+sorted[middle])/2;};
export const accuracy=(r:ExerciseResult)=>{const total=r.hitsA+r.hitsC+r.hitsD+r.misses;return total?r.hitsA/total*100:null;};
export const comparisonKey=(r:ExerciseResult)=>r.exerciseVersion&&r.powerFactor&&r.division&&r.measurementType?JSON.stringify([r.exerciseVersion,r.division,r.powerFactor,r.measurementType]):null;
export function summarize(rows:ExerciseResult[]){
 const data=[...rows].sort((a,b)=>(a.recordedAt||a.trainingDate).localeCompare(b.recordedAt||b.trainingDate)||a.id.localeCompare(b.id));
 const base=data.slice(0,3),recent=data.slice(-5),enough=data.length>=8;
 const values=(subset:ExerciseResult[],metric:'hf'|'time'|'accuracy')=>subset.map(r=>metric==='hf'?r.hitFactor:metric==='time'?r.timeSeconds:accuracy(r)).filter((v):v is number=>v!==null);
 const metric=(kind:'hf'|'time'|'accuracy')=>{const before=median(values(base,kind)),current=median(values(recent,kind));const complete=kind!=='accuracy'||values(base,kind).length===3&&values(recent,kind).length===5;const change=enough&&complete&&before!==null&&current!==null?(kind==='accuracy'?current-before:before>0?(kind==='time'?before-current:current-before)/before*100:null):null;return {base:base.length===3?before:null,current,change};};
 const hf=metric('hf'),time=metric('time'),a=metric('accuracy');
 let observation='אין מספיק נתונים להשוואה';
 if(enough&&time.change!==null&&a.change!==null){const previousMiss=median(base.map(r=>r.misses))||0,currentMiss=median(recent.map(r=>r.misses))||0;observation=time.change>=TREND_THRESHOLDS.timePercent&&(a.change<=-TREND_THRESHOLDS.accuracyPoints||currentMiss>previousMiss)?'הזמן השתפר, אך הדיוק ירד או נוספו החטאות':time.change>=TREND_THRESHOLDS.timePercent&&a.change>=TREND_THRESHOLDS.accuracyPoints?'שיפור בזמן ובדיוק':'אין שינוי בולט במדידות האחרונות';}
 return {data,enough,hf,time,accuracy:a,observation};
}
