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

  // ✅ Restaurar modelo desde localStorage si existe
  const modeloGuardado = localStorage.getItem("modeloIA");
  if (modeloSelect && modeloGuardado) {
    modeloSelect.value = modeloGuardado;
    const modeloActivoDiv = document.getElementById("modelo-activo");
    if (modeloActivoDiv) {
      modeloActivoDiv.innerHTML = `Modelo utilizado: <span class="font-semibold">${modeloGuardado}</span>`;
    }
  }

  // ✅ Actualiza el texto del modelo activo al cambiar el selector
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

  // ✅ Enviar pregunta con modeloIA incluido
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const pregunta = textarea.value.trim();
    const modeloIA = modeloSelect?.value || "gpt-4o-mini";

    if (pregunta.length < 3) {
      renderMensaje("error", "⚠️ La pregunta debe tener al menos 3 caracteres.");
      return;
    }

    if (pregunta.length > 2000) {
      renderMensaje("error", "⚠️ La pregunta es demasiado extensa. Por favor resumila o divídila.");
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

      renderMensaje("assistant", data.answer, data.citations || []);
      guardarMensaje("assistant", data.answer, data.citations || []);
      textarea.value = "";
      autoResizeTextarea();

      // ✅ ACTUALIZA SELECTOR, TEXTO Y PERSISTE MODELO
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

  function renderMensaje(role, text, citations = []) {
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
    } border p-4 rounded-lg w-full max-w-[90%] md:max-w-2xl lg:max-w-3xl xl:max-w-4xl`;

    const label = isUser ? "Tú" : isAssistant ? "Asistente" : "Sistema";

    bubble.innerHTML = `<p class="font-semibold ${isError ? "text-red-600" : ""}">${label}:</p>
                        <p class="whitespace-pre-line">${text}</p>`;

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

    wrapper.appendChild(bubble);
    chatBox.appendChild(wrapper);
    scrollAlFinal();
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
