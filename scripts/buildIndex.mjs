import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import * as lancedb from '@lancedb/lancedb';
import { getOpenAI, inicializarOpenAI } from '../config/openai.mjs';

const DATA_DIR = process.env.DATA_DIR || './data';
const RAW_JSONL_PATH = path.join(DATA_DIR, 'mitre_raw.jsonl');
const LANCEDB_DIR = process.env.LANCEDB_DIR || './data/lancedb';
const COLLECTION_NAME = process.env.COLLECTION_NAME || 'mitre_attck';
const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';

async function embed(text) {
  const openai = getOpenAI();
  const res = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text
  });
  return res.data[0].embedding;
}

async function main() {
  await inicializarOpenAI(); // ✅ <- ¡esto es lo que te faltaba!
  const db = await lancedb.connect(LANCEDB_DIR);

  try {
    await db.dropTable(COLLECTION_NAME);
  } catch (_) {}

  const rows = [];
  let count = 0;

  for await (const d of readJsonl(RAW_JSONL_PATH)) {
    const text = buildText(d);
    const vector = await embed(text);
    rows.push({
      id: d.mitre_id || d.id,
      text,
      vector,
      mitre_id: d.mitre_id || null,
      name: d.name || null,
      url: d.url || null,
      stix_id: d.id || null,
      type: d.type || null
    });

    count++;
    if (count % 50 === 0) console.log(`[*] Embeddings generados: ${count}`);
  }

  console.log(`[*] Insertando ${rows.length} técnicas en LanceDB…`);
  const table = await db.createTable(COLLECTION_NAME, rows, { mode: 'overwrite' });

  await table.createIndex('vector');
  console.log(`[*] Índice creado en '${LANCEDB_DIR}' como '${COLLECTION_NAME}'`);
}
