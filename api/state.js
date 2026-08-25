// GET /api/state  -> { ok, configured, partners, rows:[...], batches:[...] }
const { configured, getState } = require('../_lib/store');

// Diagnostic: which DB-ish env var NAMES exist (names only, never values).
function envSeen(){
  return Object.keys(process.env).filter(k => /(DATABASE|POSTGRES|NEON|PG|KV_|UPSTASH|REDIS)/i.test(k)).sort();
}

module.exports = async (req, res) => {
  try {
    if (!configured()) { res.status(200).json({ ok:true, configured:false, envSeen: envSeen(), partners:{}, rows:[], batches:[] }); return; }
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
