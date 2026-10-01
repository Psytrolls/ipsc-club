import exerciseImages from './exercise-images.json' with {type:'json'};
import {z} from 'zod';
export const definitionSchema=z.object({name:z.string().min(1).max(150),description:z.string().max(2000).default(''),paper:z.number().int().min(0).max(100),hitsPerPaper:z.number().int().min(1).max(20),plates:z.number().int().min(0).max(100),poppers:z.number().int().min(0).max(100),noShoots:z.number().int().min(0).max(100),conditions:z.string().min(1).max(2000),measurementType:z.enum(['hit_factor','points']),sourceUrl:z.union([z.literal(''),z.url().startsWith('https://').max(2000)]).default(''),diagramUrl:z.union([z.literal(''),z.url().startsWith('https://').max(2000)]).default(''),approvedForRange:z.literal(true),saveToLibrary:z.boolean().default(false),sourceTemplateId:z.string().max(100).optional()}).refine(v=>v.paper+v.plates+v.poppers>0,'נדרשת לפחות מטרה אחת');
export function makeDefinition(b,id,trainingId){const {saveToLibrary,sourceTemplateId,...definition}=b;return {...definition,id,version:id,trainingId,targetCount:b.paper+b.plates+b.poppers,maxPoints:5*(b.paper*b.hitsPerPaper+b.plates+b.poppers),category:trainingId?'אימון':'מועדון',createdAt:new Date().toISOString()};}
export function scoreResult(b,tpl){
 const paperTotal=tpl.paper*tpl.hitsPerPaper,metalTotal=tpl.plates+tpl.poppers;
 if(b.hitsA+b.hitsC+b.hitsD+b.misses!==paperTotal)throw Error('מספר פגיעות הקרטון וההחטאות אינו מתאים לתרגיל');
 if(b.metalHits+b.metalMisses!==metalTotal)throw Error('מספר תוצאות המתכת אינו מתאים לתרגיל');
 if(tpl.noShoots===0&&b.noShootHits>0)throw Error('לא הוגדרו מטרות ענישה');
 const rawPoints=Math.max(0,b.hitsA*5+b.hitsC*(b.powerFactor==='major'?4:3)+b.hitsD*(b.powerFactor==='major'?2:1)+b.metalHits*5-10*(b.misses+b.metalMisses+b.procedurals+b.noShootHits));
 return {rawPoints,hitFactor:tpl.measurementType==='hit_factor'?Number((rawPoints/b.timeSeconds).toFixed(4)):0};
}
const referenceRows=[['CLC-01',2,3,7],['CLC-03',2,2,6],['CLC-05',3,2,8],['CLC-11',4,4,12],['CLC-15',4,1,9],['CLC-21',4,4,12],['CLC-31',2,2,6],['CLC-33',3,0,6],['CLC-35',2,2,6],['CLC-37',5,2,12]];
export const references=referenceRows.map(([code,paper,poppers,rounds])=>({id:'reference-'+code,name:code,description:'דוגמה מקטלוג IPSC. יש לעיין במסמך המקורי ולאשר התאמה למטווח; השימוש באתר נשמר כגרסת מועדון, ללא סיווג רשמי.',category:'IPSC — מקור',paper,hitsPerPaper:(rounds-poppers)/paper,plates:0,poppers,noShoots:0,conditions:'',measurementType:'hit_factor',sourceUrl:'https://www.ipsc.org/match-sanctioning/classifier-stages/',diagramUrl:exerciseImages.find(image=>image.code===code)?.source||'',approvedForRange:false,targetCount:paper+poppers,maxPoints:rounds*5,sourceReviewedAt:'2026-10-01'}));
