import * as XLSX from 'xlsx';
import { date } from 'quasar';

/**
 * Exporta datos a un archivo .xlsx real (soporta hoja única o multi-hoja).
 *
 * @param {object} opts
 * @param {Array<object>}   [opts.rows]      - Datos a exportar (modo hoja única)
 * @param {Array<object>}   [opts.columns]   - Columnas a exportar (modo hoja única)
 * @param {string}          opts.filename    - Nombre del archivo sin extensión
 * @param {string}          [opts.sheetName] - Nombre de la hoja (modo hoja única)
 * @param {string[]}        [opts.meta]      - Encabezados descriptivos (modo hoja única)
 * @param {Array<{sheetName: string, rows: Array, columns: Array, meta?: Array}>} [opts.sheets] - Modo multi-hoja
 */
export function useExcelExport() {

    function createWorksheet({ rows, columns, meta = [] }) {
        if (!rows || rows.length === 0) return null;

        // 1. Filas de meta-información (título, período, etc.)
        const metaRows = meta.map((line) => [line]);

        // 2. Fila de encabezados de columna
        const headerRow = columns.map((c) => c.label);

        // 3. Filas de datos
        const dataRows = rows.map((row) =>
            columns.map((col) => {
                const raw = typeof col.field === 'function'
                    ? col.field(row)
                    : row[col.field];

                // Si raw es un número válido de por sí, enviamos el número crudo para evitar corromper los decimales en Excel.
                if (raw !== null && raw !== undefined && !isNaN(Number(raw)) && raw !== '') {
                    return Number(raw);
                }

                const formatted = col.format ? col.format(raw, row) : raw;
                return formatted ?? '';
            })
        );

        // 4. Construcción de la hoja
        const sheetData = [...metaRows, headerRow, ...dataRows];
        const ws = XLSX.utils.aoa_to_sheet(sheetData);

        // 5. Ancho de columna automático (máximo entre header y datos)
        const colWidths = columns.map((col) => {
            const maxLen = Math.max(
                col.label.length,
                ...rows.map((row) => {
                    const raw = typeof col.field === 'function' ? col.field(row) : row[col.field];
                    return String(col.format ? col.format(raw, row) : raw ?? '').length;
                })
            );
            return { wch: Math.min(maxLen + 4, 50) };
        });
        ws['!cols'] = colWidths;

        return ws;
    }

    function exportToExcel(opts) {
        if (!opts) return;
        const wb = XLSX.utils.book_new();
        const filename = opts.filename || 'Reporte';

        if (Array.isArray(opts.sheets) && opts.sheets.length > 0) {
            let appendedCount = 0;
            opts.sheets.forEach((s) => {
                const ws = createWorksheet({
                    rows: s.rows,
                    columns: s.columns,
                    meta: s.meta || [],
                });
                if (ws) {
                    XLSX.utils.book_append_sheet(wb, ws, s.sheetName || `Hoja${appendedCount + 1}`);
                    appendedCount++;
                }
            });
            if (appendedCount === 0) return;
        } else {
            const { rows, columns, sheetName = 'Datos', meta = [] } = opts;
            const ws = createWorksheet({ rows, columns, meta });
            if (!ws) return;
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
        }

        const fechaHoy = date.formatDate(new Date(), 'YYYYMMDD');
        XLSX.writeFile(wb, `${filename}_${fechaHoy}.xlsx`);
    }

    return { exportToExcel };
}
