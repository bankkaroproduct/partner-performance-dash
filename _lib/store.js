// Storage layer — Neon serverless Postgres (free tier, no credit card).
// Stores the whole app state as one JSON row. Accepts any of the common connection-string
// env var names (Vercel Postgres/Neon integration sets these automatically).
const { neon } = require('@neondatabase/serverless');

const URL =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.NEON_DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING;

const sql = URL ? neon(URL) : null;

function configured(){ return !!sql; }
function emptyState(){ return { partners: {}, rows: {}, batches: [] }; }

let ready = false;
async function ensure(){
  if (ready) return;
  await sql`CREATE TABLE IF NOT EXISTS gc_state (id int PRIMARY KEY, data jsonb NOT NULL)`;
  ready = true;
}

async function getState(){
  if (!configured()) throw new Error('DB not configured');
  await ensure();
  const rows = await sql`SELECT data FROM gc_state WHERE id = 1`;
  if (!rows.length || !rows[0].data) return emptyState();
  const p = rows[0].data;
  return { partners: p.partners || {}, rows: p.rows || {}, batches: p.batches || [] };
}

async function setState(state){
  if (!configured()) throw new Error('DB not configured');
  await ensure();
  const json = JSON.stringify(state);
  await sql`INSERT INTO gc_state (id, data) VALUES (1, ${json}::jsonb)
            ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`;
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
