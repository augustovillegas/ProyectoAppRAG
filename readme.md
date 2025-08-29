# 🧠 MITRE ATT&CK RAG Assistant

Asistente inteligente para analistas de ciberseguridad basado en la arquitectura **RAG (Retrieval-Augmented Generation)**. Optimiza el análisis forense digital utilizando datos del marco **MITRE ATT&CK** y modelos de lenguaje avanzados como **ChatGPT** y **DeepSeek**.

---

## 📌 Objetivo del proyecto

Desarrollar una herramienta interactiva que asista a analistas forenses en la identificación de TTPs (Tácticas, Técnicas y Procedimientos) de actores maliciosos, generando respuestas explicativas basadas únicamente en información validada por el framework MITRE ATT&CK.

---

## 🧱 Arquitectura de la solución

### 🔍 Recuperación + Generación (RAG)

El sistema se estructura en dos grandes módulos:

- **Módulo de Recuperación (Retriever)**  
  Indexa y busca fragmentos relevantes desde la base de datos LanceDB utilizando embeddings semánticos del framework MITRE ATT&CK.

- **Módulo Generativo (Generator)**  
  Procesa los fragmentos relevantes y genera respuestas explicativas utilizando modelos como `gpt-4o-mini` (OpenAI) y `deepseek-chat`.

---

## 🧩 Componentes del sistema

### 📚 Base de Conocimiento: MITRE ATT&CK
- Descargada desde el repositorio oficial (STIX).
- Convertida a JSONL normalizado.
- Embeddings generados con OpenAI (`text-embedding-3-small`).
- Indexada con LanceDB para búsqueda semántica.

### 🧠 Modelos de Lenguaje
- [x] ChatGPT (gpt-4o-mini)
- [x] DeepSeek Chat
- Modular y extensible a futuros modelos.

### 💬 Prompts y Respuestas
- Prompt `system` fuerza el uso exclusivo de datos MITRE.
- Prompt `user` contextualiza con fragmentos recuperados.
- Respuestas incluyen: técnica ID, nombre, descripción, comandos asociados y fuente oficial.

### 💻 Frontend
- Interfaz estilo ChatGPT.
- Selector de modelo IA.
- Exportación a PDF del historial de chat.
- Modal de confirmación de reinicio.
- Almacenamiento local del historial.

---

## 🚦 Flujo de funcionamiento

1. Usuario ingresa una consulta sobre ciberataques.
2. Se calcula el embedding de la consulta.
3. Se realiza búsqueda semántica sobre la base MITRE.
4. Se genera un prompt con fragmentos + pregunta.
5. El modelo IA responde de forma explicativa y contextualizada.
6. Se muestran citas (ID y URL de MITRE).
7. El usuario puede exportar el historial como PDF.

---

## 🔧 Instalación

```bash
git clone https://github.com/tuusuario/rag-mitre
cd rag-mitre
cp .env.example .env
npm install
