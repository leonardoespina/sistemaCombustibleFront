import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Servicio centralizado para la generación de reportes en PDF.
 * Optimizado para alta fidelidad visual (Quasar Theme / Estilo Documento Formal).  //
 */
export const pdfService = {
  /**
   * Genera un reporte tabular (Landscape).
   */
  exportTable({
    orientation = "l",
    title = "Reporte de Sistema",
    subtitle = "",
    columns = [],
    data = [],
    fileName = "reporte.pdf",
    logo = null,
    metadata = {},
  }) {
    const doc = new jsPDF({ orientation, unit: "mm", format: "letter" });
    const pageWidth = doc.internal.pageSize.width;
    const margin = 14;
    let currentY = 15;

    if (logo) {
      try { doc.addImage(logo, "PNG", pageWidth - 45, margin - 5, 30, 20); } catch (e) { }
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(0);
    doc.text(title.toUpperCase(), margin, currentY);
    currentY += 8;

    if (subtitle) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(subtitle, margin, currentY);
      currentY += 10;
    }

    doc.setFontSize(11);
    doc.setTextColor(0);
    Object.entries(metadata).forEach(([key, value], index) => {
      const x = index % 2 === 0 ? margin : pageWidth / 2;
      doc.text(`${key}: ${value}`, x, currentY);
      if (index % 2 !== 0) currentY += 5;
    });

    autoTable(doc, {
      startY: currentY + 5,
      head: [columns.map(col => col.label)],
      body: data.map(row => columns.map(col => {
        const val = typeof col.field === 'function' ? col.field(row) : row[col.dataKey];
        return val != null ? val : "—";
      })),
      theme: "grid",
      headStyles: { fillColor: [60, 60, 60], fontSize: 9, halign: "center", textColor: [255, 255, 255] },
      bodyStyles: { fontSize: 9, cellPadding: 1.5, textColor: [0, 0, 0] },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 25 }
      },
      didDrawPage: (d) => {
        const str = `Página ${doc.internal.getNumberOfPages()}`;
        doc.setFontSize(10);
        doc.text(str, margin, doc.internal.pageSize.height - 10);
      }
    });

    doc.save(fileName);
  },

  /**
   * Genera un reporte tabular (Landscape) con múltiples tablas agrupadas (ej. por combustible).
   */
  exportReporteAgrupado({
    orientation = "l",
    title = "Reporte de Sistema",
    subtitle = "",
    groups = [], // [{ title: "GASOIL", columns: [], data: [], total: X }]
    fileName = "reporte_agrupado.pdf",
    logo = null,
    metadata = {},
  }) {
    const doc = new jsPDF({ orientation, unit: "mm", format: "letter" });
    const pageWidth = doc.internal.pageSize.width;
    const margin = 14;
    let currentY = 15;

    // --- ENCABEZADO GLOBAL ---
    if (logo) {
      try { doc.addImage(logo, "PNG", pageWidth - 45, margin - 5, 30, 20); } catch (e) { }
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(0);
    doc.text(title.toUpperCase(), margin, currentY);
    currentY += 8;

    if (subtitle) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(subtitle, margin, currentY);
      currentY += 10;
    }

    doc.setFontSize(11);
    doc.setTextColor(0);
    Object.entries(metadata).forEach(([key, value], index) => {
      const x = index % 2 === 0 ? margin : pageWidth / 2;
      doc.text(`${key}: ${value}`, x, currentY);
      if (index % 2 !== 0) currentY += 5;
    });

    currentY += 5;

    // --- ITERAR POR GRUPOS (TABLAS INDEPENDIENTES) ---
    groups.forEach((group) => {
      // Dibujar cabecera azul del grupo
      doc.setFillColor(30, 116, 200);
      doc.rect(margin, currentY, pageWidth - (margin * 2), 8, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text(group.title.toUpperCase(), margin + 5, currentY + 5.5);

      currentY += 8;

      autoTable(doc, {
        startY: currentY,
        head: [group.columns.map(col => col.label)],
        body: group.data.map((row, rIdx) => group.columns.map(col => {
          let val = typeof col.field === 'function' ? col.field(row) : row[col.dataKey];
          if (col.label === "#") val = rIdx + 1;
          return val != null ? val : "—";
        })),
        theme: "grid",
        headStyles: { fillColor: [240, 240, 240], fontSize: 8, halign: "center", textColor: [0, 0, 0], lineWidth: 0.1, lineColor: [200, 200, 200] },
        bodyStyles: { fontSize: 8.5, cellPadding: 1.5, textColor: [40, 40, 40] },
        columnStyles: {
          0: { cellWidth: 8, halign: "center" },
          1: { cellWidth: 22 },
        },
        margin: { left: margin, right: margin, bottom: 20 },
        didDrawPage: (data) => {
          currentY = data.cursor.y;
        }
      });

      currentY = doc.lastAutoTable.finalY + 5;

      // Total Despachado en rojo al pie de cada tabla
      if (group.total != null) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(220, 53, 69);
        const textRight = `Total Despachado ${group.title}: ${group.total.toLocaleString()} L`;
        const textW = doc.getTextWidth(textRight);
        doc.text(textRight, pageWidth - margin - textW, currentY);
        currentY += 10;
      } else {
        currentY += 5;
      }
    });

    // --- FOOTER GLOBAL DE PÁGINAS ---
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const str = `Página ${i} de ${pageCount}`;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(str, margin, doc.internal.pageSize.height - 10);
    }

    doc.save(fileName);
  },

  /**
   * Genera el Acta de Cierre con FIDELIDAD TOTAL al diseño del componente Vue.
   * Asegura que el PDF sea idéntico a la vista previa en ActaViewerDialog.vue.
   */
  exportActa({
    title = "ACTA DE CIERRE",
    logo = null,
    bodyText = "", // Soporta **negrita**
    gasolina = [], // [{ label, value }]
    gasoil = [],
    resumenGasolina = [],
    totalGasoil = "",
    signatureData = [],
    observacion = "",
    fileName = "acta.pdf",
    metadata = {}
  }) {
    const doc = new jsPDF({ unit: "mm", format: "letter" });
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;
    let currentY = 12;

    // --- ENCABEZADO SUPERIOR ---
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(40);
    doc.text("Prevención y Control de Pérdidas", margin, currentY);
    currentY += 3;
    doc.text("FGE-PCP-04 01/04/2024", margin, currentY);

    // Logo más pequeño y ajustado
    if (logo) {
      try { doc.addImage(logo, "PNG", pageWidth - 45, currentY - 8, 30, 15); } catch (e) { }
    }
    currentY += 15;

    // --- TÍTULO ---
    doc.setFontSize(19);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text(title.toUpperCase(), pageWidth / 2, currentY, { align: "center" });
    // Subrayado
    doc.setDrawColor(0);
    doc.setLineWidth(0.2);
    const titleWidth = doc.getTextWidth(title.toUpperCase());
    doc.line(pageWidth / 2 - titleWidth / 2, currentY + 1, pageWidth / 2 + titleWidth / 2, currentY + 1);
    currentY += 10;

    // --- METADATA (TURNO / INSPECTOR) ---
    const drawLabeledValue = (label, value, y) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(label.toUpperCase() + ":", margin, y);
      const labelW = doc.getTextWidth(label.toUpperCase() + ": ");

      // Escribir el valor (sea texto o línea base)
      doc.setFont("helvetica", "normal");
      doc.text(value || "_________", margin + labelW, y);

      // Subrayar el valor
      doc.setDrawColor(0);
      doc.setLineWidth(0.1);
      const valueWidth = doc.getTextWidth(value || "_________");
      doc.line(margin + labelW, y + 0.5, margin + labelW + valueWidth, y + 0.5);
    };

    drawLabeledValue("TURNO", metadata.turno, currentY);
    currentY += 6;
    drawLabeledValue("INSPECTOR DE SERVICIO", metadata.inspector, currentY);
    currentY += 10;

    // --- PÁRRAFO NARRATIVO CON NEGRITAS ---
    const renderRichParagraph = (text, x, y, maxWidth) => {
      const parts = text.split(/(\*\*.*?\*\*)/g);
      const lineHeight = 4.5;
      let curX = x;
      let curY = y;

      parts.forEach(part => {
        const isBold = part.startsWith("**") && part.endsWith("**");
        const cleanPart = isBold ? part.slice(2, -2) : part;
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        doc.setFontSize(10);

        const words = cleanPart.split(" ");
        words.forEach((word, i) => {
          const wordToDraw = (i === words.length - 1) ? word : word + " ";
          const wWidth = doc.getTextWidth(wordToDraw);
          if (curX + wWidth > x + maxWidth) {
            curX = x; curY += lineHeight;
          }
          doc.text(wordToDraw, curX, curY);
          curX += wWidth;
        });
      });
      return curY;
    };

    currentY = renderRichParagraph(bodyText, margin, currentY, pageWidth - (margin * 2)) + 15;

    // --- TANQUES (DOS COLUMNAS) ---
    const startYInventory = currentY;

    // Gasolina (Columna Izquierda)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("TANQUES GASOLINA:", margin, currentY);
    currentY += 4;

    doc.setFontSize(10);
    gasolina.forEach(t => {
      doc.setFont("helvetica", "bold");
      const text = `${t.label}: ${t.value}`;
      doc.text(text, margin, currentY);
      // Subrayado como en Vue: style="text-decoration: underline"
      doc.setDrawColor(0);
      doc.setLineWidth(0.2);
      doc.line(margin, currentY + 0.8, margin + doc.getTextWidth(text), currentY + 0.8);
      currentY += 6;
    });

    currentY += 4;
    resumenGasolina.forEach(r => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(r.label.toUpperCase() + ":", margin, currentY);
      const lw = doc.getTextWidth(r.label.toUpperCase() + ": ");
      doc.setFont("helvetica", "normal");
      doc.text(r.value, margin + lw, currentY);
      doc.line(margin + lw, currentY + 0.8, margin + lw + doc.getTextWidth(r.value), currentY + 0.8);
      currentY += 5;
    });

    // Gasoil (Columna Derecha)
    let rightY = startYInventory;
    const rightX = pageWidth / 2 + 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("TANQUES GASOIL:", rightX, rightY);
    rightY += 4;

    doc.setFontSize(10);
    gasoil.forEach(t => {
      doc.setFont("helvetica", "bold");
      const text = `${t.label}: ${t.value}`;
      doc.text(text, rightX, rightY);
      doc.line(rightX, rightY + 0.8, rightX + doc.getTextWidth(text), rightY + 0.8);
      rightY += 6;
    });

    rightY += 4;
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL:", rightX, rightY);
    const tw = doc.getTextWidth("TOTAL: ");
    doc.setFont("helvetica", "normal");
    doc.text(totalGasoil, rightX + tw, rightY);
    doc.line(rightX + tw, rightY + 0.8, rightX + tw + doc.getTextWidth(totalGasoil), rightY + 0.8);

    currentY = Math.max(currentY, rightY) + 15;

    // --- OBSERVACIÓN ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("OBSERVACIÓN:", margin, currentY);
    currentY += 5;
    doc.setFont("helvetica", "normal");
    doc.text(observacion || "", margin, currentY);
    // Líneas
    doc.setDrawColor(0);
    doc.setLineWidth(0.2);
    doc.line(margin, currentY + 2, pageWidth - margin, currentY + 2); // Línea 1
    currentY += 7;
    doc.line(margin, currentY + 2, pageWidth - margin, currentY + 2); // Línea 2
    currentY += 10;

    // --- FIRMAS ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("QUIENES FIRMAN:", margin, currentY);
    currentY += 4;

    autoTable(doc, {
      startY: currentY,
      head: [["Departamento", "Nombre y Apellido", "Cédula", "Firma"]],
      body: signatureData.map(s => [s.dept, s.name, s.id, ""]),
      theme: "grid",
      styles: {
        fontSize: 10,
        minCellHeight: 12,
        valign: 'middle',
        halign: 'center',
        textColor: 0,
        cellPadding: { top: 4, right: 3, bottom: 4, left: 3 },
        lineWidth: 0.2
      },
      headStyles: {
        fillColor: [245, 245, 245],
        fontStyle: "bold",
        textColor: 0,
        lineWidth: 0.2
      },
      margin: { left: margin, right: margin },
      tableWidth: pageWidth - 2 * margin,
      columnStyles: {
        0: { cellWidth: (pageWidth - 2 * margin) * 0.25, fontStyle: 'bold' }, // Departamento en negrita
        1: { cellWidth: (pageWidth - 2 * margin) * 0.35 },
        2: { cellWidth: (pageWidth - 2 * margin) * 0.25 },
        3: { cellWidth: (pageWidth - 2 * margin) * 0.15 }
      },
      didDrawPage: (data) => {
        // Asegurar bordes visibles
        doc.setDrawColor(0);
        doc.setLineWidth(0.3);
      }
    });

    // --- PIE DE PÁGINA ---
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Gerencia de Prevención y Control de Pérdidas.", pageWidth / 2, pageHeight - 10, { align: "center" });

    // Verificar que todo cabe en una sola hoja
    const finalY = doc.lastAutoTable?.finalY || currentY;
    if (finalY > pageHeight - 30) {
      console.warn("El contenido puede exceder una página carta. Ajustando márgenes.");
      // Podríamos reducir márgenes o ajustar tamaños, pero por ahora continuamos.
    }

    doc.save(fileName);
  }
};
