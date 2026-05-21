"use client";

import { useRef, useState } from "react";
import { X, Upload, Download, CheckCircle, AlertCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateStockFromCsv, type StockCsvRow, type StockCsvResult } from "./actions";
import { toast } from "sonner";

const EXAMPLE_CSV = `sku,stock
PROD-001,50
PROD-002,12
PROD-003,0
`;

function parseCSV(text: string): { rows: StockCsvRow[]; parseErrors: string[] } {
  const lines = text.trim().split(/\r?\n/);
  const parseErrors: string[] = [];
  const rows: StockCsvRow[] = [];

  if (lines.length === 0) return { rows, parseErrors: ["El archivo está vacío"] };

  // Detect header
  const firstLine = lines[0].toLowerCase().replace(/\s/g, "");
  const hasHeader = firstLine.includes("sku") || firstLine.includes("id") || firstLine.includes("stock");
  const dataLines = hasHeader ? lines.slice(1) : lines;

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i].trim();
    if (!line) continue;

    const parts = line.split(",").map((p) => p.trim().replace(/^["']|["']$/g, ""));
    if (parts.length < 2) {
      parseErrors.push(`Fila ${i + 2}: formato inválido (se esperan 2 columnas)`);
      continue;
    }

    const identifier = parts[0];
    const stock = parseInt(parts[1], 10);

    if (!identifier) {
      parseErrors.push(`Fila ${i + 2}: SKU/ID vacío`);
      continue;
    }
    if (isNaN(stock) || stock < 0) {
      parseErrors.push(`Fila ${i + 2}: stock inválido "${parts[1]}"`);
      continue;
    }

    rows.push({ identifier, stock });
  }

  return { rows, parseErrors };
}

export function StockCsvModal() {
  const [open, setOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [parsed, setParsed] = useState<StockCsvRow[] | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [result, setResult] = useState<StockCsvResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function reset() {
    setParsed(null);
    setParseErrors([]);
    setResult(null);
    setFileName(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleFile(file: File) {
    if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
      toast.error("Solo se aceptan archivos .csv");
      return;
    }
    setFileName(file.name);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { rows, parseErrors: errs } = parseCSV(text);
      setParsed(rows);
      setParseErrors(errs);
    };
    reader.readAsText(file, "UTF-8");
  }

  async function handleApply() {
    if (!parsed || parsed.length === 0) return;
    setLoading(true);
    try {
      const res = await updateStockFromCsv(parsed);
      setResult(res);
      if (res.updated > 0) {
        toast.success(`${res.updated} producto${res.updated !== 1 ? "s" : ""} actualizados`);
      }
    } catch {
      toast.error("Error al procesar el CSV");
    } finally {
      setLoading(false);
    }
  }

  function downloadExample() {
    const blob = new Blob([EXAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "stock-ejemplo.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" onClick={() => setOpen(true)} className="gap-2">
        <Upload className="w-4 h-4" />
        CSV Stock
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-arena-100">
          <div>
            <h2 className="font-display text-lg font-semibold text-warm-900">Actualizar stock por CSV</h2>
            <p className="text-xs text-warm-500 mt-0.5">Subí un CSV con columnas <code className="font-mono">sku</code> y <code className="font-mono">stock</code></p>
          </div>
          <button onClick={() => { reset(); setOpen(false); }} className="text-warm-400 hover:text-warm-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-4 flex-1">
          {/* Drop zone */}
          {!parsed && !result && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files[0];
                if (file) handleFile(file);
              }}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                dragOver ? "border-arena-400 bg-arena-50" : "border-arena-200 hover:border-arena-300 hover:bg-arena-50/50"
              }`}
            >
              <FileText className="w-10 h-10 text-arena-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-warm-700">Arrastrá tu CSV aquí o hacé clic para seleccionar</p>
              <p className="text-xs text-warm-400 mt-1">Formato: columna SKU/ID + columna stock</p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </div>
          )}

          {/* Parse errors */}
          {parseErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-1">
              <p className="text-sm font-medium text-red-700">Errores al leer el archivo:</p>
              {parseErrors.slice(0, 5).map((err, i) => (
                <p key={i} className="text-xs text-red-600">{err}</p>
              ))}
              {parseErrors.length > 5 && (
                <p className="text-xs text-red-400">…y {parseErrors.length - 5} errores más</p>
              )}
            </div>
          )}

          {/* Preview table */}
          {parsed && parsed.length > 0 && !result && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-warm-700">
                  {fileName && <span className="text-warm-500 mr-2">{fileName}</span>}
                  <span className="text-arena-600">{parsed.length} filas listas para actualizar</span>
                </p>
                <button onClick={reset} className="text-xs text-warm-400 hover:text-warm-700 underline">
                  Cambiar archivo
                </button>
              </div>
              <div className="border border-arena-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-arena-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-warm-600 font-medium">SKU / ID</th>
                      <th className="px-3 py-2 text-right text-warm-600 font-medium">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.slice(0, 8).map((row, i) => (
                      <tr key={i} className="border-t border-arena-100">
                        <td className="px-3 py-1.5 font-mono text-warm-700">{row.identifier}</td>
                        <td className="px-3 py-1.5 text-right text-warm-900 font-medium">{row.stock}</td>
                      </tr>
                    ))}
                    {parsed.length > 8 && (
                      <tr className="border-t border-arena-100">
                        <td colSpan={2} className="px-3 py-1.5 text-center text-warm-400 italic">
                          …y {parsed.length - 8} filas más
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    {result.updated} producto{result.updated !== 1 ? "s" : ""} actualizados correctamente
                  </p>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <p className="text-sm font-medium text-amber-800">{result.errors.length} fila{result.errors.length !== 1 ? "s" : ""} con errores:</p>
                  </div>
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-xs text-amber-700 pl-6">
                      Fila {e.row} · <code className="font-mono">{e.identifier}</code> — {e.reason}
                    </p>
                  ))}
                </div>
              )}
              <button onClick={reset} className="text-sm text-arena-600 hover:text-arena-800 underline">
                Subir otro archivo
              </button>
            </div>
          )}

          {/* Format tip */}
          {!result && (
            <div className="bg-arena-50 rounded-xl p-4 text-xs text-warm-600 space-y-1">
              <p className="font-medium text-warm-700">Formato del CSV:</p>
              <pre className="font-mono whitespace-pre-wrap">{`sku,stock\nPROD-001,50\nPROD-002,0`}</pre>
              <p>La primera columna puede ser el <strong>SKU</strong> o el <strong>ID</strong> del producto.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-arena-100 gap-3">
          <button
            type="button"
            onClick={downloadExample}
            className="flex items-center gap-1.5 text-xs text-warm-500 hover:text-warm-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Descargar ejemplo
          </button>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { reset(); setOpen(false); }}
            >
              Cerrar
            </Button>
            {parsed && parsed.length > 0 && !result && (
              <Button
                type="button"
                onClick={handleApply}
                disabled={loading}
              >
                {loading ? "Actualizando…" : `Actualizar ${parsed.length} productos`}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
