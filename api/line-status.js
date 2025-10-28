// /pages/api/line-status.js
export default async function handler(req, res) {
  try {
    const idsRaw = (req.query.ids || '').toString().trim();
    if (!idsRaw) return res.status(400).json({ error: 'missing ids' });

    const ids = idsRaw.split(',').map(s => s.trim()).filter(Boolean);
    const idPath = ids.map(encodeURIComponent).join(',');

    const appKey = process.env.TFL_APP_KEY || process.env.TFL_API_KEY || '';
    const appId  = process.env.TFL_APP_ID  || '';
    const auth   = appId && appKey ? `app_id=${appId}&app_key=${appKey}` :
                     appKey ? `app_key=${appKey}` : '';

    const url = `https://api.tfl.gov.uk/Line/${idPath}/Status?detail=true${auth ? `&${auth}` : ''}`;
    const r = await fetch(url, { next: { revalidate: 60 } });
    if (!r.ok) return res.status(r.status).json({ error: `tfl ${r.status}` });
    const arr = await r.json();

    // 统一结构： 保留 id/name/lineStatuses/statusSeverityDescription/reason
    const normalized = (Array.isArray(arr) ? arr : []).map(x => {
      const ls = Array.isArray(x.lineStatuses) ? x.lineStatuses[0] : null;
      return {
        id: x.id,
        name: x.name,
        statusSeverityDescription: ls?.statusSeverityDescription || x.statusSeverityDescription || '',
        reason: ls?.reason || x.reason || '',
        lineStatuses: x.lineStatuses || []
      };
    });

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    return res.status(200).json({ lines: normalized });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
