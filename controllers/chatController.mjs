import { validarPregunta, obtenerMensajeDeError } from '../utils/errorService.mjs';
import { askQuestionService } from '../services/chatService.mjs';

// API JSON
export async function askMitre(req, res) {
  try {
    const pregunta = validarPregunta(req.body?.question);
    const resultado = await askQuestionService(pregunta);
    return res.json(resultado);
  } catch (err) {
    console.error("❌ Error en askMitre:", err); // 👈 LOG NUEVO
    const errorMensaje = obtenerMensajeDeError(err);
    return res.status(400).json({ error: errorMensaje });
  }
}

// Vista HTML - formulario inicial
export async function renderChat(req, res) {
  res.render("chat", {
    respuesta: null,
    citas: [],
    pregunta: "",
    error: null
  });
}

// Vista HTML - manejo del formulario
export async function handleChat(req, res) {
  const pregunta = req.body?.pregunta?.trim();

  try {
    const preguntaValida = validarPregunta(pregunta);
    const { answer, citations } = await askQuestionService(preguntaValida);

    return res.render("chat", {
      respuesta: answer,
      citas: citations,
      pregunta: preguntaValida,
      error: null
    });
  } catch (err) {
    console.error("❌ Error en handleChat:", err); // 👈 LOG NUEVO

    return res.render("chat", {
      respuesta: null,
      citas: [],
      pregunta,
      error: obtenerMensajeDeError(err)
    });
  }
}
