// POST   /api/partner  { pid, name, status }  -> upsert into registry
// DELETE /api/partner?pid=123               -> remove from registry
const { configured, getState, setState, readBody } = require('../_lib/redis');

module.exports = async (req, res) => {
  try {
    if (!configured()) { res.status(200).json({ ok:false, configured:false, error:'KV not configured' }); return; }
    const st = await getState();

    if (req.method === 'POST') {
      const b = await readBody(req);
      const pid = String(b.pid||'').trim();
      if (!pid) { res.status(400).json({ ok:false, error:'pid required' }); return; }
      st.partners[pid] = { name: String(b.name||pid).trim(), status: String(b.status||'Live').trim() };
      await setState(st);
      res.status(200).json({ ok:true, partners:st.partners });
      return;
    }
    if (req.method === 'DELETE') {
      const pid = String((req.query && req.query.pid) || '').trim();
      if (pid && st.partners[pid]) { delete st.partners[pid]; await setState(st); }
      res.status(200).json({ ok:true, partners:st.partners });
      return;
    }
    res.status(405).json({ ok:false, error:'POST or DELETE' });
  } catch (e) {
    res.status(500).json({ ok:false, error:String(e.message||e) });
  }
};
