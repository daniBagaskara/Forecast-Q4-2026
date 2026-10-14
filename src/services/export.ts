import * as XLSX from 'xlsx';

export interface ExportColumn<T> {
  header: string;
  key: keyof T | string;
  format?: (row: T, index: number) => string | number;
}

export function exportToExcel<T>(
  data: T[],
  columns: ExportColumn<T>[],
  fileName: string,
  sheetName = 'Data'
) {
  // Map row objects according to column definitions
  const rows = data.map((item, index) => {
    const rowObj: Record<string, string | number> = {};
    columns.forEach((col) => {
      if (col.format) {
        rowObj[col.header] = col.format(item, index);
      } else {
        const val = (item as Record<string, unknown>)[col.key as string];
        rowObj[col.header] = val !== null && val !== undefined ? (val as string | number) : '';
      }
    });
    return rowObj;
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  const colWidths = columns.map((col) => {
    const maxValLen = rows.reduce((max, row) => {
      const valStr = String(row[col.header] || '');
      return Math.max(max, valStr.length);
    }, col.header.length);
    return { wch: Math.min(Math.max(maxValLen + 3, 12), 40) };
  });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate file download
  const dateStr = new Date().toISOString().slice(0, 10);
  const cleanFileName = `${fileName}_${dateStr}.xlsx`;
  XLSX.writeFile(workbook, cleanFileName);
}
