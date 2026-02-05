"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { IconFileExcel } from "@tabler/icons-react";

interface ExcelViewerProps {
  fileUrl: string; // Base64 data URL
  fileName: string;
}

export function ExcelViewer({ fileUrl, fileName }: ExcelViewerProps) {
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [activeSheet, setActiveSheet] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadExcel = async () => {
      try {
        setLoading(true);
        setError(null);

        // Parse base64 data URL
        const base64Data = fileUrl.split(",")[1];
        const binaryData = atob(base64Data);
        const bytes = new Uint8Array(binaryData.length);
        for (let i = 0; i < binaryData.length; i++) {
          bytes[i] = binaryData.charCodeAt(i);
        }

        // Read workbook
        const wb = XLSX.read(bytes, { type: "array" });
        setWorkbook(wb);
        setActiveSheet(wb.SheetNames[0]);
      } catch (err) {
        console.error("Error loading Excel file:", err);
        setError("Failed to load Excel file");
      } finally {
        setLoading(false);
      }
    };

    loadExcel();
  }, [fileUrl]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading Excel file...</p>
        </div>
      </div>
    );
  }

  if (error || !workbook) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-600">
          <IconFileExcel className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-semibold">Error loading Excel file</p>
          <p className="text-sm mt-2">{error || "Unknown error"}</p>
        </div>
      </div>
    );
  }

  const worksheet = workbook.Sheets[activeSheet];
  const html = XLSX.utils.sheet_to_html(worksheet, { editable: false });

  return (
    <div className="h-full flex flex-col">
      {/* Sheet Tabs */}
      <div className="flex items-center gap-2 p-2 bg-slate-100 border-b border-slate-300">
        {workbook.SheetNames.map((sheetName) => (
          <button
            key={sheetName}
            onClick={() => setActiveSheet(sheetName)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              activeSheet === sheetName
                ? "bg-green-600 text-white"
                : "bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {sheetName}
          </button>
        ))}
      </div>

      {/* Excel Content */}
      <div className="flex-1 overflow-auto">
        <div
          dangerouslySetInnerHTML={{
            __html: `
              <style>
                table { border-collapse: collapse; width: 100%; }
                td, th { border: 1px solid #d1d5db; padding: 8px 12px; text-align: left; min-width: 100px; }
                th { background-color: #f3f4f6; font-weight: 600; position: sticky; top: 0; z-index: 10; }
                tr:nth-child(even) { background-color: #f9fafb; }
                td:hover, th:hover { background-color: #e5e7eb; }
              </style>
              ${html}
            `,
          }}
        />
      </div>
    </div>
  );
}
