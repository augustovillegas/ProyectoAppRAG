document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#form-chat");
  const textarea = document.querySelector("#pregunta");
  const modeloSelect = document.querySelector("#modeloIA");
  const writingIndicator = document.getElementById("asistente-escribiendo");
  const chatBox = document.getElementById("chat-box");
  const btnReset = document.getElementById("btn-reset");
  const modal = document.getElementById("modal-confirmar-reset");
  const confirmarReset = document.getElementById("confirmar-reset");
  const cancelarReset = document.getElementById("cancelar-reset");

  const STORAGE_KEY = "chatHistorialMITRE";

  const modeloGuardado = localStorage.getItem("modeloIA");
  if (modeloSelect && modeloGuardado) {
    modeloSelect.value = modeloGuardado;
    const modeloActivoDiv = document.getElementById("modelo-activo");
    if (modeloActivoDiv) {
      modeloActivoDiv.innerHTML = `Modelo utilizado: <span class="font-semibold">${modeloGuardado}</span>`;
    }
  }

  modeloSelect?.addEventListener("change", () => {
    const modeloElegido = modeloSelect.value;
    localStorage.setItem("modeloIA", modeloElegido);
    const modeloActivoDiv = document.getElementById("modelo-activo");
    if (modeloActivoDiv) {
      modeloActivoDiv.innerHTML = `Modelo utilizado: <span class="font-semibold">${modeloElegido}</span>`;
    }
  });

  const historial = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  historial.forEach(msg => renderMensaje(msg.role, msg.content, msg.citations));
  scrollAlFinal();

  function autoResizeTextarea() {
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
  }

  textarea.addEventListener("input", autoResizeTextarea);
  autoResizeTextarea();

  if (btnReset) {
    btnReset.addEventListener("click", () => {
      modal.classList.remove("hidden");
    });
  }

  if (cancelarReset) {
    cancelarReset.addEventListener("click", () => {
      modal.classList.add("hidden");
    });
  }

  if (confirmarReset) {
    confirmarReset.addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEY);
      chatBox.innerHTML = "";
      modal.classList.add("hidden");
      scrollAlFinal();
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const pregunta = textarea.value.trim();
    const modeloIA = modeloSelect?.value || "gpt-4o-mini";

    if (pregunta.length < 3) {
      renderMensaje("error", "⚠️ La pregunta debe tener al menos 3 caracteres.");
      guardarMensaje("error", "⚠️ La pregunta debe tener al menos 3 caracteres.");
      return;
    }

    if (pregunta.length > 2000) {
      renderMensaje("error", "⚠️ La pregunta es demasiado extensa. Por favor resumila o divídila.");
      guardarMensaje("error", "⚠️ La pregunta es demasiado extensa.");
      return;
    }

    mostrarEscribiendo(true);
    renderMensaje("user", pregunta);
    guardarMensaje("user", pregunta);

    try {
      const res = await fetch("/api/chat/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: pregunta,
          modeloIA
        }),
      });

      const data = await res.json();
      mostrarEscribiendo(false);

      if (!res.ok) {
        renderMensaje("error", data.error || "❌ Error desconocido.");
        guardarMensaje("error", data.error || "❌ Error desconocido.");
        return;
      }

      const modeloNombre = modeloIAtoNombre(data.modeloIA || modeloIA);
      renderMensaje("assistant", data.answer, data.citations || [], modeloNombre);
      guardarMensaje("assistant", data.answer, data.citations || []);

      textarea.value = "";
      autoResizeTextarea();

      if (data.modeloIA && modeloSelect) {
        modeloSelect.value = data.modeloIA;
        localStorage.setItem("modeloIA", data.modeloIA);
      }

      const modeloActivoDiv = document.getElementById("modelo-activo");
      if (modeloActivoDiv) {
        modeloActivoDiv.innerHTML = `Modelo utilizado: <span class="font-semibold">${data.modeloIA || modeloIA}</span>`;
      }
    } catch (err) {
      mostrarEscribiendo(false);
      const msg = "❌ Error de red o del servidor.";
      renderMensaje("error", msg);
      guardarMensaje("error", msg);
    }
  });

  function renderMensaje(role, text, citations = [], modeloNombre = null) {
    const wrapper = document.createElement("div");
    const isUser = role === "user";
    const isAssistant = role === "assistant";
    const isError = role === "error";

    wrapper.className = `flex ${isUser ? "justify-end" : "justify-start"} animate-fade-in`;

    const bubble = document.createElement("div");
    bubble.className = `${
      isUser
        ? "bg-yellow-100 border-yellow-300 text-yellow-900"
        : isAssistant
        ? "bg-gray-100 border-gray-300 text-gray-800"
        : "bg-red-100 border-red-400 text-red-700"
    } border p-4 rounded-2xl w-full max-w-[90%] md:max-w-2xl lg:max-w-3xl xl:max-w-4xl shadow-sm`;

    const label = isUser ? "Tú" : isAssistant ? "Asistente" : "Sistema";

    bubble.innerHTML = `
      <p class="text-xs font-semibold uppercase tracking-wide ${
        isUser ? "text-yellow-700" : isAssistant ? "text-gray-500" : "text-red-600"
      }">${label}</p>
      <p class="whitespace-pre-line">${text}</p>
    `;

    if (isAssistant && citations.length) {
      bubble.innerHTML += `
        <div class="mt-3">
          <p class="text-sm font-semibold text-gray-500 mb-1">Citas:</p>
          <ul class="list-disc list-inside text-blue-600 text-sm">
            ${citations
              .map(cita => `<li><a href="${cita.url}" target="_blank" class="hover:underline">${cita.mitre_id || cita.name}</a></li>`)
              .join("")}
          </ul>
        </div>`;
    }

    if (isAssistant && modeloNombre) {
      bubble.innerHTML += `
        <div class="mt-4 text-[11px] text-gray-400 italic text-right">
          💡 Respuesta generada por: <span class="font-medium">${modeloNombre}</span>
        </div>`;
    }

    wrapper.appendChild(bubble);
    chatBox.appendChild(wrapper);
    scrollAlFinal();
  }

  function modeloIAtoNombre(id) {
    switch (id) {
      case "gpt-4o-mini":
        return "ChatGPT (GPT-4o)";
      case "deepseek-chat":
        return "DeepSeek";
      default:
        return id;
    }
  }

  function guardarMensaje(role, content, citations = []) {
    const actual = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    actual.push({ role, content, citations });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(actual));
  }

  function scrollAlFinal() {
    setTimeout(() => {
      chatBox.scrollTop = chatBox.scrollHeight;
    }, 100);
  }

  function mostrarEscribiendo(visible) {
    if (writingIndicator) {
      writingIndicator.classList.toggle("hidden", !visible);
      scrollAlFinal();
    }
  }
});
