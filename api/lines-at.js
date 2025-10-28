// /pages/api/lines-at.js
export default async function handler(req, res) {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'missing id' });

    const appKey = process.env.TFL_APP_KEY || process.env.TFL_API_KEY || '';
    const appId  = process.env.TFL_APP_ID  || '';
    const auth   = appId && appKey ? `app_id=${appId}&app_key=${appKey}` :
                     appKey ? `app_key=${appKey}` : '';

    const url = `https://api.tfl.gov.uk/StopPoint/${encodeURIComponent(id)}?modes=tube${auth ? `&${auth}` : ''}`;
    const r = await fetch(url, { next: { revalidate: 300 } });
    if (!r.ok) return res.status(r.status).json({ error: `tfl ${r.status}` });
    const data = await r.json();

    // data.lines 里是该站涉及的线路；只取 mode=tube
    const lines = (Array.isArray(data.lines) ? data.lines : [])
      .filter(x => {
        const modes = (x.modes || []).map(m => String(m).toLowerCase());
        return modes.length === 0 || modes.indexOf('tube') >= 0;
      })
      .map(x => ({ id: x.id, name: x.name || x.commonName || x.id }))
      // 去重
      .filter((x, i, a) => x.id && a.findIndex(y => y.id === x.id) === i);

    // CDN 缓存提示（Vercel）
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    return res.status(200).json({ lines });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
