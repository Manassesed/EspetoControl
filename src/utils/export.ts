import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import * as XLSX from "xlsx";

export type ExportSheet = {
  name: string;
  rows: (string | number)[][];
};

/** Monta um arquivo .xlsx (uma aba por item de `sheets`) e retorna os bytes. */
function buildXlsx(sheets: ExportSheet[]): Uint8Array {
  const workbook = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const worksheet = XLSX.utils.aoa_to_sheet(sheet.rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name.slice(0, 31));
  }
  return XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as Uint8Array;
}

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/**
 * Exporta uma ou mais planilhas como .xlsx: no web faz download do arquivo,
 * no app salva em arquivo temporário e abre o compartilhamento nativo.
 */
export async function exportXlsx(filename: string, sheets: ExportSheet[]) {
  const bytes = buildXlsx(sheets);

  if (Platform.OS === "web") {
    const g = globalThis as unknown as {
      Blob?: typeof Blob;
      URL?: typeof URL;
      document?: Document;
    };
    if (g.Blob && g.URL && g.document) {
      const blob = new g.Blob([bytes], { type: XLSX_MIME });
      const url = g.URL.createObjectURL(blob);
      const link = g.document.createElement("a");
      link.href = url;
      link.download = filename;
      g.document.body.appendChild(link);
      link.click();
      g.document.body.removeChild(link);
      g.URL.revokeObjectURL(url);
      return;
    }
  }

  const path = `${FileSystem.cacheDirectory}${filename}`;
  const binaryBase64 = arrayToBase64(bytes);
  await FileSystem.writeAsStringAsync(path, binaryBase64, { encoding: FileSystem.EncodingType.Base64 });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(path, { mimeType: XLSX_MIME, dialogTitle: filename });
  }
}

const BASE64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/** Codifica bytes em base64 sem depender de `btoa` (ausente no runtime Hermes). */
function arrayToBase64(bytes: Uint8Array): string {
  let result = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = bytes[i + 1];
    const b2 = bytes[i + 2];
    result += BASE64_CHARS[b0 >> 2];
    result += BASE64_CHARS[((b0 & 3) << 4) | (b1 === undefined ? 0 : b1 >> 4)];
    result += b1 === undefined ? "=" : BASE64_CHARS[((b1 & 15) << 2) | (b2 === undefined ? 0 : b2 >> 6)];
    result += b2 === undefined ? "=" : BASE64_CHARS[b2 & 63];
  }
  return result;
}
