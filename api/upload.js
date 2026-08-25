// POST /api/upload  { batchId, files:[names], rows:[{date,pid,clicks,exits,cardouts,topcard}] }
// Upserts daily rows (dedupe key = date|pid, last wins), records the upload as a batch.
const { configured, getState, setState, readBody } = require('../_lib/store');

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') { res.status(405).json({ ok:false, error:'POST only' }); return; }
    if (!configured()) { res.status(200).json({ ok:false, configured:false, error:'KV not configured' }); return; }
    const body = await readBody(req);
    const batchId = String(body.batchId || ('b'+Date.now()));
    const files = Array.isArray(body.files) ? body.files.map(String) : [];
    const rows = Array.isArray(body.rows) ? body.rows : [];

    const st = await getState();
    let n = 0;
    rows.forEach(r => {
      const date = String(r.date||'').slice(0,10); const pid = String(r.pid||'');
      if (!date || !pid) return;
      st.rows[date+'|'+pid] = {
        date, pid,
        clicks: +r.clicks||0, exits: +r.exits||0, cardouts: +r.cardouts||0,
        topcard: r.topcard||'-', batchId,
      };
      n++;
    });
    st.batches = st.batches.filter(b => b.id !== batchId);
    st.batches.push({ id: batchId, at: Date.now(), files, count: n });
    await setState(st);

    res.status(200).json({ ok:true, stored:n, partners:st.partners, rows:Object.values(st.rows), batches:st.batches.slice().sort((a,b)=>(b.at||0)-(a.at||0)) });
  } catch (e) {
    res.status(500).json({ ok:false, error:String(e.message||e) });
  }
};
