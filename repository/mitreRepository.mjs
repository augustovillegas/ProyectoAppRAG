import * as lancedb from '@lancedb/lancedb';

const DB_PATH = process.env.LANCEDB_DIR || './data/lancedb';
const COLLECTION_NAME = process.env.COLLECTION_NAME || 'mitre_attck';
const TOP_K = parseInt(process.env.TOP_K || '8', 10);

let table = null;

// Inicializar la tabla si no existe aún
async function getTable() {
  if (!table) {
    const db = await lancedb.connect(DB_PATH);
    table = await db.openTable(COLLECTION_NAME);
  }
  return table;
}

export async function getRelevantDocs(vector) {
  const tbl = await getTable();
  const results = await (await tbl.search(vector).limit(TOP_K)).toArray();
  return results;
}
