import { validarPregunta, obtenerMensajeDeError } from '../utils/errorService.mjs';
import { askQuestionService } from '../services/chatService.mjs';

// API JSON para frontend dinámico
export async function askMitre(req, res) {
  try {
    const pregunta = validarPregunta(req.body?.question);
    const modeloIA = req.body?.modeloIA?.trim() || 'gpt-4o-mini';

    const resultado = await askQuestionService(pregunta, modeloIA);

    console.log(`[💬] Consulta procesada con modelo: ${modeloIA}`);

    return res.json({
      ...resultado,
      modeloIA // se incluye el modelo en la respuesta
    });
  } catch (err) {
    console.error("❌ Error en askMitre:", err);
    const errorMensaje = obtenerMensajeDeError(err);
    return res.status(400).json({ error: errorMensaje });
  }
}

// Vista inicial del chat
export async function renderChat(req, res) {
  res.render("chat", {
    respuesta: null,
    citas: [],
    pregunta: "",
    modeloIA: '',
    error: null
  });
}

// Vista HTML al enviar formulario desde /chat (NO API)
export async function handleChat(req, res) {
  const pregunta = req.body?.pregunta?.trim();
  const modeloIA = req.body?.modeloIA?.trim() || 'gpt-4o-mini';

  try {
    const preguntaValida = validarPregunta(pregunta);
    const { answer, citations } = await askQuestionService(preguntaValida, modeloIA);

    return res.render("chat", {
      respuesta: answer,
      citas: citations,
      pregunta: preguntaValida,
      modeloIA,
      error: null
    });
  } catch (err) {
    console.error("❌ Error en handleChat:", err);

    return res.render("chat", {
      respuesta: null,
      citas: [],
      pregunta,
      modeloIA,
      error: obtenerMensajeDeError(err)
    });
  }
}
