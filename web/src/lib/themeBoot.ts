/**
 * Script eseguito prima del rendering (in <head>) per applicare subito il tema ed evitare lampeggi.
 * Tema predefinito "dinamico": chiaro tra un'ora dopo l'alba e un'ora prima del tramonto a Venezia,
 * scuro nel resto del giorno, con la stessa formula NOAA di solar.ts (sunHoursFor). Una scelta salvata
 * dall'utente ('carta' o 'notte') ha la precedenza. Un test verifica la coerenza con getDynamicPalette.
 */
export const THEME_BOOT_SCRIPT = `(function(){try{
var d=document.documentElement,t=null;
try{t=localStorage.getItem('vod_theme_preference');}catch(e){}
function daylight(now){
var start=Date.UTC(now.getUTCFullYear(),0,0),doy=Math.floor((now.getTime()-start)/86400000),g=2*Math.PI/365*(doy-1),R=Math.PI/180;
var eq=229.18*(0.000075+0.001868*Math.cos(g)-0.032077*Math.sin(g)-0.014615*Math.cos(2*g)-0.040849*Math.sin(2*g));
var dec=0.006918-0.399912*Math.cos(g)+0.070257*Math.sin(g)-0.006758*Math.cos(2*g)+0.000907*Math.sin(2*g)-0.002697*Math.cos(3*g)+0.00148*Math.sin(3*g);
var f=new Intl.DateTimeFormat('en-US',{timeZone:'Europe/Rome',hourCycle:'h23',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'});
function parts(x){var o={},a=f.formatToParts(x);for(var i=0;i<a.length;i++)o[a[i].type]=Number(a[i].value);return o;}
var noon=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate(),12)),q=parts(noon);
var off=Math.round((Date.UTC(q.year,q.month-1,q.day,q.hour,q.minute)-noon.getTime())/60000),c=parts(now);
var lat=45.437*R,ha=Math.acos(Math.min(1,Math.max(-1,Math.cos(90.833*R)/(Math.cos(lat)*Math.cos(dec))-Math.tan(lat)*Math.tan(dec))))/R;
var rise=Math.round((720-4*(12.335+ha)-eq+off)*60),set=Math.round((720-4*(12.335-ha)-eq+off)*60);
var s=c.hour*3600+c.minute*60+c.second;
return s>=rise+3600&&s<=set-3600;}
var light=t==='carta'||(t!=='notte'&&daylight(new Date()));
d.dataset.theme=light?'carta':'notte';d.style.colorScheme=light?'light':'dark';
}catch(e){}})();`;
