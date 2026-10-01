export function normalizePhone(value){
 if(typeof value!=='string'||!/^[+\d\s().-]+$/.test(value.trim()))return null;
 let digits=value.replace(/\D/g,'');if(digits.startsWith('00'))digits=digits.slice(2);
 if(/^0\d{8,9}$/.test(digits))digits='972'+digits.slice(1);
 if(!/^[1-9]\d{7,14}$/.test(digits))return null;
 return '+'+digits;
}
