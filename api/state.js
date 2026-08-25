// GET /api/state  -> { ok, configured, partners, rows:[...], batches:[...] }
const { configured, getState } = require('../_lib/store');

module.exports = async (req, res) => {
  try {
    if (!configured()) { res.status(200).json({ ok:true, configured:false, partners:{}, rows:[], batches:[] }); return; }
    const st = await getState();
    res.status(200).json({
      ok: true,
      configured: true,
      partners: st.partners,
      rows: Object.values(st.rows),
      batches: st.batches.slice().sort((a,b)=> (b.at||0)-(a.at||0)),
    });
  } catch (e) {
    res.status(500).json({ ok:false, error: String(e.message||e) });
  }
};
