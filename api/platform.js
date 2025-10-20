export const config = { runtime: 'nodejs' };
function minutesFromSeconds(sec){var s=Number(sec||0);var m=Math.floor(s/60);if(m<=0)return'Due';if(m===1)return'1 min';return m+' mins';}
function cleanDest(name){return String(name||'').replace(/\s*\(?Underground Station\)?/gi,'').trim();}
function isSupportedMode(m){m=String(m||'').toLowerCase();return m==='tube'||m==='elizabeth-line';}
export default async function handler(req,res){try{var id=String(req.query.id||'').trim();if(!id)return res.status(400).json({error:'missing id'});
var platformFilter=String(req.query.platform||'').trim().toLowerCase();var limit=Math.max(1,Math.min(50,parseInt(req.query.limit||'10',10)));
var params=new URLSearchParams();if(process.env.TFL_APP_ID)params.set('app_id',process.env.TFL_APP_ID);if(process.env.TFL_API_KEY)params.set('app_key',process.env.TFL_API_KEY);
var url='https://api.tfl.gov.uk/StopPoint/'+encodeURIComponent(id)+'/Arrivals'+(params.toString()?('?'+params.toString()):'');var r=await fetch(url,{cache:'no-store',headers:{'User-Agent':'tfl-platform-ios8/1.2'}});
if(!r.ok)throw new Error('TfL HTTP '+r.status);var arr=await r.json();var all=Array.isArray(arr)?arr:[];var filt=all.filter(function(x){return isSupportedMode(x.modeName);});
if(platformFilter){filt=filt.filter(function(t){return String(t.platformName||'').toLowerCase()===platformFilter;});}
var platMap=Object.create(null);for(var i=0;i<filt.length;i++){var pn=String(filt[i].platformName||'').trim();if(!pn)continue;platMap[pn]=(platMap[pn]||0)+1;}
var availablePlatforms=Object.keys(platMap).sort().map(function(name){return{name:name,count:platMap[name]};});
filt.sort(function(a,b){return(a.timeToStation||9e9)-(b.timeToStation||9e9);});
var stationName=(filt[0]&&filt[0].stationName)||(all[0]&&all[0].stationName)||id;var sliced=filt.slice(0,limit);
var entries=sliced.map(function(t,i){return{idx:i+1,platform:t.platformName||'',towards:cleanDest(t.towards||t.destinationName||''),eta:minutesFromSeconds(Number(t.timeToStation||0))};});
res.setHeader('Cache-Control','no-store');return res.status(200).json({stationName:stationName,generatedAt:new Date().toISOString(),entries:entries,availablePlatforms:availablePlatforms});}
catch(e){return res.status(200).json({stationName:'',generatedAt:null,entries:[],availablePlatforms:[]});}}