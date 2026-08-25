// DELETE /api/batch?id=b123  -> remove an upload batch and all rows it contributed
const { configured, getState, setState } = require('../_lib/redis');

module.exports = async (req, res) => {
  try {
    if (req.method !== 'DELETE') { res.status(405).json({ ok:false, error:'DELETE only' }); return; }
    if (!configured()) { res.status(200).json({ ok:false, configured:false, error:'KV not configured' }); return; }
    const id = String((req.query && req.query.id) || '').trim();
    const st = await getState();
    if (id) {
      Object.keys(st.rows).forEach(k => { if (st.rows[k].batchId === id) delete st.rows[k]; });
      st.batches = st.batches.filter(b => b.id !== id);
      await setState(st);
    }
    res.status(200).json({ ok:true, partners:st.partners, rows:Object.values(st.rows), batches:st.batches.slice().sort((a,b)=>(b.at||0)-(a.at||0)) });
  } catch (e) {
    res.status(500).json({ ok:false, error:String(e.message||e) });
  }
};
