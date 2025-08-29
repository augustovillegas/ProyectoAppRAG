export function generarPDFdeChat() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const PAGE = {
    width: doc.internal.pageSize.getWidth(),
    height: doc.internal.pageSize.getHeight(),
    marginX: 15,
    marginY: 15,
  };
  const CONTENT = {
    x: PAGE.marginX,
    y: PAGE.marginY + 22,
    maxWidth: () => PAGE.width - PAGE.marginX * 2,
    pad: 5,
  };

  const COLORS = {
    headerBg: [245, 245, 245],
    headerText: [20, 20, 20],
    divider: [210, 210, 210],
    userBg: [255, 249, 196],
    userBorder: [245, 158, 11],
    assistantBg: [243, 244, 246],
    assistantBorder: [156, 163, 175],
    errorBg: [254, 226, 226],
    errorBorder: [248, 113, 113],
    labelUser: [214, 40, 40],
    labelAssistant: [0, 48, 73],
    text: [33, 33, 33],
    meta: [120, 120, 120],
    footer: [120, 120, 120],
    bullet: [55, 65, 81],
  };

  function setFont({ family = "helvetica", style = "normal", size = 11, color = COLORS.text } = {}) {
    doc.setFont(family, style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
  }

  function addPageIfNeeded(blockHeight) {
    if (CONTENT.y + blockHeight > PAGE.height - PAGE.marginY) {
      doc.addPage();
      drawHeader();
      CONTENT.y = PAGE.marginY + 22;
    }
  }

  function roundedRect(x, y, w, h, r, borderColor, fillColor) {
    doc.setDrawColor(...borderColor);
    doc.setFillColor(...fillColor);
    doc.roundedRect(x, y, w, h, r, r, "FD");
  }

  function split(text, width) {
    return doc.splitTextToSize(text, width);
  }

  function cleanText(text) {
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[“”«»]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/—/g, "-")
      .replace(/•/g, "*")
      .replace(/[\u{1F300}-\u{1F6FF}]/gu, "")
      .replace(/\*\*/g, "")
      .replace(/__/g, "")
      .replace(/[^\x20-\x7E]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function parseBubble(wrapper) {
    const bubble = wrapper.querySelector("div");
    if (!bubble) return null;

    const pList = bubble.querySelectorAll("p");
    let label = (pList[0]?.textContent || "").trim().toLowerCase();
    let role = "system";
    if (label.startsWith("tú")) role = "user";
    else if (label.startsWith("asistente")) role = "assistant";
    else if (label.startsWith("sistema")) role = "error";

    let contentText = "";
    if (pList[1]) {
      contentText = pList[1].innerText.trim();
    } else {
      const full = bubble.innerText.trim().split("\n");
      contentText = full.slice(1).join("\n").trim();
    }

    contentText = cleanText(contentText);

    let citLinks = Array.from(bubble.querySelectorAll("ul li a")).map(a => ({
      text: cleanText(a.textContent?.trim() || ""),
      href: a.getAttribute("href") || "",
    }));

    let modeloTexto = "";
    try {
      const modeloDiv = Array.from(bubble.querySelectorAll("div")).find(d =>
        d.innerText?.includes("Respuesta generada por")
      );
      if (modeloDiv) {
        modeloTexto = cleanText(modeloDiv.innerText.trim());
      }
    } catch {}

    return { role, contentText, citLinks, modeloTexto };
  }

  function drawMessageCard({ role, contentText, citLinks, modeloTexto }) {
    const isUser = role === "user";
    const isAssistant = role === "assistant";
    const isError = role === "error";

    const cardBg = isUser ? COLORS.userBg : isAssistant ? COLORS.assistantBg : COLORS.errorBg;
    const cardBorder = isUser ? COLORS.userBorder : isAssistant ? COLORS.assistantBorder : COLORS.errorBorder;
    const label = isUser ? "Usuario" : isAssistant ? "Asistente" : "Sistema";

    const innerWidth = CONTENT.maxWidth() - CONTENT.pad * 2;

    setFont({ style: "normal", size: 11 });
    const textLines = split(contentText || " ", innerWidth);
    const lineHeight = doc.getLineHeight() / doc.internal.scaleFactor;
    const textHeight = lineHeight * textLines.length;

    const labelHeight = lineHeight + 1;

    let citationsHeight = 0;
    let citationLines = [];
    if (citLinks?.length) {
      const each = citLinks.map(c => split(`* ${c.text}${c.href ? ` — ${c.href}` : ""}`, innerWidth));
      citationLines = each;
      const linesCount = each.reduce((acc, arr) => acc + arr.length, 0);
      citationsHeight = lineHeight + (linesCount * lineHeight) + 1;
    }

    const modeloIAHeight = (isAssistant && modeloTexto) ? lineHeight + 2 : 0;

    const cardHeight = CONTENT.pad * 2 + labelHeight + textHeight + citationsHeight + modeloIAHeight + 2;

    addPageIfNeeded(cardHeight);

    roundedRect(CONTENT.x, CONTENT.y, CONTENT.maxWidth(), cardHeight, 3, cardBorder, cardBg);

    setFont({ style: "bold", size: 12, color: isUser ? COLORS.labelUser : COLORS.labelAssistant });
    doc.text(label, CONTENT.x + CONTENT.pad, CONTENT.y + CONTENT.pad + 4.5);

    setFont({ style: "normal", size: 11, color: COLORS.text });
    const textY = CONTENT.y + CONTENT.pad + labelHeight + 4;
    doc.text(textLines, CONTENT.x + CONTENT.pad, textY);

    let currentY = textY + textHeight + 1;

    if (citLinks?.length) {
      setFont({ style: "bold", size: 10.5, color: COLORS.meta });
      doc.text("Citas:", CONTENT.x + CONTENT.pad, currentY);
      currentY += lineHeight;

      setFont({ style: "normal", size: 10.5, color: COLORS.bullet });
      for (const lines of citationLines) {
        doc.text(lines, CONTENT.x + CONTENT.pad, currentY);
        currentY += lines.length * lineHeight;
      }
    }

    if (isAssistant && modeloTexto) {
      setFont({ style: "italic", size: 10, color: COLORS.meta });
      doc.text(modeloTexto, CONTENT.x + CONTENT.pad, currentY + 4);
    }

    CONTENT.y += cardHeight + 6;
  }

  function drawHeader() {
    doc.setFillColor(...COLORS.headerBg);
    doc.rect(0, 0, PAGE.width, PAGE.marginY + 10, "F");

    setFont({ style: "bold", size: 14, color: COLORS.headerText });
    doc.text("Asistente en Ciberseguridad — Historial del Chat", PAGE.marginX, PAGE.marginY);

    setFont({ style: "normal", size: 10.5, color: COLORS.meta });
    doc.text(`Generado: ${new Date().toLocaleString("es-AR")}`, PAGE.marginX, PAGE.marginY + 6);

    doc.setDrawColor(...COLORS.divider);
    doc.line(PAGE.marginX, PAGE.marginY + 12, PAGE.width - PAGE.marginX, PAGE.marginY + 12);
  }

  function addFooters() {
    const total = doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      setFont({ style: "italic", size: 9, color: COLORS.footer });
      const text = `Página ${i} de ${total}  ·  MITRE RAG — Dev. Augusto Villegas`;
      const textWidth = doc.getTextWidth(text);
      doc.text(text, (PAGE.width - textWidth) / 2, PAGE.height - 8);
    }
  }

  drawHeader();

  const chatBox = document.getElementById("chat-box");
  if (!chatBox) {
    setFont({ style: "bold", size: 12 });
    doc.text("No hay contenido de chat para exportar.", PAGE.marginX, CONTENT.y);
    doc.save("chat-ciberseguridad.pdf");
    return;
  }

  const wrappers = Array.from(chatBox.children).filter(el => el.tagName === "DIV");
  wrappers.forEach(wrapper => {
    try {
      const parsed = parseBubble(wrapper);
      if (!parsed) return;
      drawMessageCard(parsed);
    } catch (e) {
      console.error("❌ Error al procesar un bloque del chat:", e);
    }
  });

  addFooters();
  doc.save("chat-ciberseguridad.pdf");
}
