import * as XLSX from 'xlsx';
import { date } from 'quasar';

/**
 * Exporta datos a un archivo .xlsx real.
 *
 * @param {object} opts
 * @param {Array<object>}   opts.rows      - Datos a exportar
 * @param {Array<{label:string, field:string|Function, format?:Function}>} opts.columns
 * @param {string}          opts.filename  - Nombre sin extensión
 * @param {string}          [opts.sheetName='Datos']
 * @param {string[]}        [opts.meta=[]] - Líneas de encabezado (ej: período, filtros)
 */
export function useExcelExport() {

    function exportToExcel({ rows, columns, filename, sheetName = 'Datos', meta = [] }) {
        if (!rows || rows.length === 0) return;

        // ── 1. Filas de meta-información (título, período, etc.) ─────────────
        const metaRows = meta.map((line) => [line]);

        // ── 2. Fila de encabezados de columna ────────────────────────────────
        const headerRow = columns.map((c) => c.label);

        // ── 3. Filas de datos ─────────────────────────────────────────────────
        const dataRows = rows.map((row) =>
            columns.map((col) => {
                const raw = typeof col.field === 'function'
                    ? col.field(row)
                    : row[col.field];

                const formatted = col.format ? col.format(raw, row) : raw;
                // Preservar números como número para que Excel calcule totales
                if (formatted !== null && formatted !== undefined && !isNaN(Number(formatted)) && formatted !== '') {
                    return Number(formatted);
                }
                return formatted ?? '';
            })
        );

        // ── 4. Construcción de la hoja ────────────────────────────────────────
        const sheetData = [...metaRows, headerRow, ...dataRows];
        const ws = XLSX.utils.aoa_to_sheet(sheetData);

        // ── 5. Ancho de columna automático (máximo entre header y datos) ──────
        const colWidths = columns.map((col, idx) => {
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

        // ── 6. Generar workbook y descargar ───────────────────────────────────
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);

        const fechaHoy = date.formatDate(new Date(), 'YYYYMMDD');
        XLSX.writeFile(wb, `${filename}_${fechaHoy}.xlsx`);
    }

    return { exportToExcel };
}
