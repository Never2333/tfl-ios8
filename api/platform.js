export const config = { runtime: 'nodejs' };

const LINE_NAME = {
  'bakerloo':'Bakerloo','central':'Central','circle':'Circle','district':'District',
  'elizabeth':'Elizabeth','hammersmith-city':'Hammersmith & City','jubilee':'Jubilee',
  'metropolitan':'Metropolitan','northern':'Northern','piccadilly':'Piccadilly',
  'victoria':'Victoria','waterloo-city':'Waterloo & City'
};
const titleCaseLine = (id) =>
  LINE_NAME[id] || (id || '').replace(/-/g,' ').replace(/\b\w/g, m=>m.toUpperCase());

function minutesFromSeconds(sec){
  var s = Number(sec||0);
  var m = Math.floor(s/60);
  if (m <= 0) return 'Due';
  if (m === 1) return '1 min';
  return m + ' mins';
}
function cleanDest(name){
  return String(name||'').replace(/\s*\(?Underground Station\)?/gi,'').trim();
}

export default async function handler(req, res){
  try{
    const id = String(req.query.id||'').trim();
    if (!id) return res.status(400).json({ error:'missing id' });

    const params = new URLSearchParams();
    if (process.env.TFL_APP_ID) params.set('app_id', process.env.TFL_APP_ID);
    if (process.env.TFL_API_KEY) params.set('app_key', process.env.TFL_API_KEY);

    const url = `https://api.tfl.gov.uk/StopPoint/${encodeURIComponent(id)}/Arrivals${params.toString()?`?${params.toString()}`:''}`;
    const r = await fetch(url, { cache:'no-store', headers:{'User-Agent':'tfl-platform-ios8-lite/1.1'} });
    if (!r.ok) throw new Error('TfL HTTP '+r.status);
    const arr = await r.json();
    const tube = (Array.isArray(arr)?arr:[]).filter(x => String(x.modeName||'').toLowerCase()==='tube');

    tube.sort((a,b)=> (a.timeToStation||9e9) - (b.timeToStation||9e9));

    const stationName = (tube[0]?.stationName) || id;
    const limit = Math.max(1, Math.min(20, parseInt(req.query.limit||'10',10)));

    const list = tube.slice(0, limit).map((t, i) => ({
      idx: i+1,
      lineId: t.lineId,
      lineName: titleCaseLine(t.lineId),
      platform: t.platformName || '',
      towards: cleanDest(t.towards || t.destinationName || ''),
      eta: minutesFromSeconds(Number(t.timeToStation||0))
    }));

    res.setHeader('Cache-Control','no-store');
    return res.status(200).json({ stationName, generatedAt: new Date().toISOString(), entries: list });
  }catch(e){
    return res.status(200).json({ stationName:'', generatedAt:null, entries:[] });
  }
}
