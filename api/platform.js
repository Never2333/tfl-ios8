// api/platform.js
export const config = { runtime: 'nodejs' };

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
    var id = String(req.query.id||'').trim();
    if (!id) return res.status(400).json({ error:'missing id' });

    var platformFilter = String(req.query.platform||'').trim().toLowerCase(); // 可选：按站台过滤
    var limit = Math.max(1, Math.min(50, parseInt(req.query.limit||'10',10)));

    var params = new URLSearchParams();
    if (process.env.TFL_APP_ID) params.set('app_id', process.env.TFL_APP_ID);
    if (process.env.TFL_API_KEY) params.set('app_key', process.env.TFL_API_KEY);

    var url = 'https://api.tfl.gov.uk/StopPoint/'+encodeURIComponent(id)+'/Arrivals'+(params.toString()?('?'+params.toString()):'');
    var r = await fetch(url, { cache:'no-store', headers:{'User-Agent':'tfl-platform-ios8/1.2'} });
    if (!r.ok) throw new Error('TfL HTTP '+r.status);
    var arr = await r.json();
    var tube = (Array.isArray(arr)?arr:[]).filter(function(x){
      return String(x.modeName||'').toLowerCase()==='tube';
    });

    // 可选：按站台过滤
    if (platformFilter){
      tube = tube.filter(function(t){
        return String(t.platformName||'').toLowerCase() === platformFilter;
      });
    }

    // 统计站台列表
    var platMap = Object.create(null);
    for (var i=0;i<tube.length;i++){
      var pn = String(tube[i].platformName||'').trim();
      if (!pn) continue;
      platMap[pn] = (platMap[pn]||0)+1;
    }
    var availablePlatforms = Object.keys(platMap).sort().map(function(name){
      return { name:name, count: platMap[name] };
    });

    // 到站时间排序
    tube.sort(function(a,b){ return (a.timeToStation||9e9) - (b.timeToStation||9e9); });

    var stationName = (tube[0]&&tube[0].stationName) || (arr[0]&&arr[0].stationName) || id;

    // 若按站台过滤：截断 limit；若不过滤：把前 limit*若干 整体返回，交给前端分组
    var sliced = tube.slice(0, limit);

    var entries = sliced.map(function(t, i){
      return {
        idx: i+1,
        platform: t.platformName || '',
        towards: cleanDest(t.towards || t.destinationName || ''),
        eta: minutesFromSeconds(Number(t.timeToStation||0))
      };
    });

    res.setHeader('Cache-Control','no-store');
    return res.status(200).json({
      stationName: stationName,
      generatedAt: new Date().toISOString(),
      entries: entries,
      availablePlatforms: availablePlatforms
    });
  }catch(e){
    return res.status(200).json({
      stationName:'', generatedAt:null, entries:[], availablePlatforms:[]
    });
  }
}
