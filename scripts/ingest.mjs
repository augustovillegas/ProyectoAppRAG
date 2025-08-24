import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';

const DATA_DIR = process.env.DATA_DIR || './data';
const RAW_STIX_PATH = path.join(DATA_DIR, 'enterprise-attack.json');
const RAW_JSONL_PATH = path.join(DATA_DIR, 'mitre_raw.jsonl');
const ATTACK_JSON_URL = process.env.ATTACK_JSON_URL;

// Asegura que el directorio de salida exista
async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

// Convierte cada técnica STIX en un objeto plano
function normalizeAttackPattern(obj) {
  const ext = Array.isArray(obj.external_references) ? obj.external_references : [];
  let mitre_id = null, url = null;

  for (const ref of ext) {
    if (ref.source_name === 'mitre-attack') {
      mitre_id = ref.external_id;
      url = ref.url;
    }
  }

  return {
    type: obj.type,
    id: obj.id,
    name: obj.name,
    description: obj.description,
    mitre_id,
    url,
    platforms: obj.x_mitre_platforms || [],
    is_subtechnique: obj.x_mitre_is_subtechnique || false,
    tactic_refs: obj.kill_chain_phases || []
  };
}

async function main() {
  await ensureDir(DATA_DIR);

  console.log('[*] Descargando MITRE ATT&CK (Enterprise) desde GitHub…');
  const res = await fetch(ATTACK_JSON_URL);
  if (!res.ok) throw new Error(`Error HTTP ${res.status}`);

  const stixBundle = await res.json();
  await fs.writeFile(RAW_STIX_PATH, JSON.stringify(stixBundle, null, 2), 'utf-8');
  console.log(`[*] Guardado como STIX: ${RAW_STIX_PATH}`);

  const techniques = stixBundle.objects.filter(obj => obj.type === 'attack-pattern');
  console.log(`[*] Normalizando ${techniques.length} técnicas…`);

  const fh = await fs.open(RAW_JSONL_PATH, 'w');
  for (const obj of techniques) {
    const norm = normalizeAttackPattern(obj);
    await fh.write(`${JSON.stringify(norm)}\n`, 'utf-8');
  }
  await fh.close();

  console.log(`[*] Guardado como JSONL: ${RAW_JSONL_PATH}`);
}

main().catch(err => {
  console.error('❌ Error en ingest.js:', err);
  process.exit(1);
});
