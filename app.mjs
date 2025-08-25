import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import expressLayouts from 'express-ejs-layouts';
import chatRoutes from './routes/chatRoutes.mjs';
import { inicializarOpenAI } from './config/openai.mjs';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { spawn } from 'child_process';

const app = express();
const PORT = process.env.PORT || 8000;

// 🧭 Rutas absolutas
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX_PATH = path.join(__dirname, 'data', 'lancedb'); // <-- CORREGIDO
const INGEST_PATH = path.join(__dirname, 'scripts', 'ingest.mjs');
const INDEX_SCRIPT_PATH = path.join(__dirname, 'scripts', 'buildIndex.mjs');

// 🧠 Ejecutar scripts externos con logs
async function ejecutarScript(nombre, rutaAbsoluta) {
  return new Promise((resolve, reject) => {
    console.log(`⏳ Ejecutando ${nombre}...`);
    const proceso = spawn('node', [rutaAbsoluta], { stdio: 'inherit' });

    proceso.on('exit', (code) => {
      if (code === 0) {
        console.log(`✅ ${nombre} ejecutado correctamente`);
        resolve();
      } else {
        reject(new Error(`❌ Error en ${nombre}, código: ${code}`));
      }
    });
  });
}

// 🛠️ Automatiza la preparación de la BD
async function prepararBaseDeDatos() {
  if (existsSync(INDEX_PATH)) {
    console.log('🗃️ Base de datos ya existente. Se salta la generación.');
    return;
  }

  try {
    await ejecutarScript('📥 ingest.js', INGEST_PATH);
    await ejecutarScript('🧠 buildIndex.js', INDEX_SCRIPT_PATH);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

// 🏁 Inicialización completa
await prepararBaseDeDatos();
await inicializarOpenAI();

app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static("public"));

app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));
app.use(expressLayouts);
app.set("layout", "layout");

app.use('/', chatRoutes);

// Página raíz
app.get('/', (_req, res) => res.send('Asistente MITRE RAG funcionando'));

// Ruta 404
app.use((req, res) => {
  console.warn("⚠️  [404] Ruta no encontrada:", req.originalUrl);
  res.status(404).send({ mensaje: "404 Not Found - Ruta no encontrada" });
});

app.listen(PORT, () => {
  console.log(`[ 🟢 ] Servidor corriendo en http://localhost:${PORT}`);
});