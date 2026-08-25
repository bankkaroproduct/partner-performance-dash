// Tiny Upstash/Vercel-KV Redis helper over the REST API.
// Env vars are auto-set by the Vercel KV / Upstash integration; we accept both names.
const URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOK = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY = 'gc:state';

function configured(){ return !!(URL && TOK); }

async function cmd(arr){
  const r = await fetch(URL, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOK, 'Content-Type': 'application/json' },
    body: JSON.stringify(arr),
  });
  const j = await r.json();
  if (j && j.error) throw new Error(j.error);
  return j ? j.result : null;
}

function emptyState(){ return { partners: {}, rows: {}, batches: [] }; }

async function getState(){
  if (!configured()) throw new Error('KV not configured');
  const s = await cmd(['GET', KEY]);
  if (!s) return emptyState();
  try { const p = JSON.parse(s); return { partners: p.partners||{}, rows: p.rows||{}, batches: p.batches||[] }; }
  catch(e){ return emptyState(); }
}

async function setState(state){
  if (!configured()) throw new Error('KV not configured');
  await cmd(['SET', KEY, JSON.stringify(state)]);
}

// Read a JSON body from a Vercel Node request (works whether or not it was pre-parsed).
async function readBody(req){
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body) { try { return JSON.parse(req.body); } catch(e){ return {}; } }
  return await new Promise((resolve)=>{
    let d=''; req.on('data',c=>d+=c); req.on('end',()=>{ try{ resolve(d?JSON.parse(d):{}); }catch(e){ resolve({}); } });
  });
}

module.exports = { configured, getState, setState, readBody, emptyState };
