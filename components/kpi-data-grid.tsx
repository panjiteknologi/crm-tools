"use client";

import { useRef, useState } from "react";
import { HotTable } from "@handsontable/react-wrapper";
import { registerAllModules } from "handsontable/registry";
import "handsontable/dist/handsontable.full.min.css";

// Register all Handsontable modules
registerAllModules();

interface KPIDataGridProps {
  data: any[][];
  onSave: (data: any[][]) => void;
}

export function KPIDataGrid({ data, onSave }: KPIDataGridProps) {
  const hotRef = useRef<HotTable>(null);
  const [isDirty, setIsDirty] = useState(false);

  const handleSave = () => {
    const hot = hotRef.current?.hotInstance;
    if (!hot) return;

    const gridData = hot.getData();
    onSave(gridData);
    setIsDirty(false);
  };

  const handleMergeSelection = () => {
    const hot = hotRef.current?.hotInstance;
    if (!hot) return;

    const selected = hot.getSelected();
    if (!selected || selected.length === 0) return;

    const [row1, col1, row2, col2] = selected[0];
    const plugin = hot.getPlugin("mergeCells");

    plugin.merge(row1, col1, row2, col2);
    setIsDirty(true);
  };

  const handleUnmergeSelection = () => {
    const hot = hotRef.current?.hotInstance;
    if (!hot) return;

    const selected = hot.getSelected();
    if (!selected || selected.length === 0) return;

    const [row1, col1] = selected[0];
    const plugin = hot.getPlugin("mergeCells");

    const merges = plugin.getSettings()?.value || [];
    merges.forEach((merge: any) => {
      if (merge.row >= row1 && merge.col >= col1) {
        plugin.unmerge(merge.row, merge.col);
      }
    });
    setIsDirty(true);
  };

  const handleApplyColor = (color: string) => {
    const hot = hotRef.current?.hotInstance;
    if (!hot) return;

    const selected = hot.getSelected();
    if (!selected || selected.length === 0) return;

    selected.forEach(([row1, col1, row2, col2]: number[]) => {
      for (let row = row1; row <= row2; row++) {
        for (let col = col1; col <= col2; col++) {
          const cellMeta = hot.getCellMeta(row, col);
          const currentStyle = cellMeta.style || {};

          if (color === 'clear') {
            delete currentStyle.backgroundColor;
            delete currentStyle.color;
          } else {
            currentStyle.backgroundColor = color;
            currentStyle.color = 'white';
          }

          hot.setCellMeta(row, col, 'style', currentStyle);
        }
      }
    });

    hot.render();
    setIsDirty(true);
  };

  const handleAddRow = () => {
    const hot = hotRef.current?.hotInstance;
    if (!hot) return;

    const colCount = hot.countCols();
    const newRow = new Array(colCount).fill("");
    hot.alter("insert_row", hot.countRows(), 1, newRow);
    setIsDirty(true);
  };

  const handleDeleteRow = () => {
    const hot = hotRef.current?.hotInstance;
    if (!hot) return;

    const selected = hot.getSelected();
    if (!selected || selected.length === 0) return;

    const [row1] = selected[0];
    if (row1 === 0) return; // Don't delete header

    hot.alter("remove_row", row1);
    setIsDirty(true);
  };

  const hotSettings = {
    data: data,
    rowHeaders: true,
    colHeaders: true,
    height: 600,
    width: "100%",
    licenseKey: "non-commercial-and-evaluation",
    contextMenu: true,
    manualColumnResize: true,
    manualRowResize: true,
    mergeCells: true,
    autoColumnSize: {
      samplingRatio: 100,
    },
    autoRowSize: {
      samplingRatio: 100,
    },
    cells: function(row: number, col: number) {
      const cellProperties: any = {};

      // Header row styling
      if (row === 0) {
        cellProperties.renderer = headerRenderer;
      }

      return cellProperties;
    },
    afterChange: (changes: any[] | null) => {
      if (changes) {
        setIsDirty(true);
      }
    },
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 rounded-t-lg">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleMergeSelection}
            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Merge Cells
          </button>

          <button
            onClick={handleUnmergeSelection}
            className="px-3 py-2 bg-slate-600 text-white rounded hover:bg-slate-700 transition-colors text-sm font-medium"
          >
            Unmerge Cells
          </button>

          <div className="h-6 w-px bg-slate-300 dark:bg-slate-600 mx-2" />

          <button
            onClick={() => handleApplyColor("#22c55e")}
            className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm font-medium"
            title="Completed"
          >
            ✓ Completed
          </button>

          <button
            onClick={() => handleApplyColor("#3b82f6")}
            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
            title="In Progress"
          >
            ⟳ In Progress
          </button>

          <button
            onClick={() => handleApplyColor("#f59e0b")}
            className="px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors text-sm font-medium"
            title="Planning"
          >
            ○ Planning
          </button>

          <button
            onClick={() => handleApplyColor("#ef4444")}
            className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm font-medium"
            title="Delayed"
          >
            ✗ Delayed
          </button>

          <button
            onClick={() => handleApplyColor("#8b5cf6")}
            className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-sm font-medium"
            title="On Hold"
          >
            ⏸ On Hold
          </button>

          <button
            onClick={() => handleApplyColor("clear")}
            className="px-3 py-2 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 transition-colors text-sm font-medium"
            title="Clear Color"
          >
            ✕ Clear
          </button>

          <div className="h-6 w-px bg-slate-300 dark:bg-slate-600 mx-2" />

          <button
            onClick={handleAddRow}
            className="px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors text-sm font-medium"
          >
            + Tambah Baris
          </button>

          <button
            onClick={handleDeleteRow}
            className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm font-medium"
          >
            − Hapus Baris
          </button>
        </div>

        <div className="flex items-center gap-3">
          {isDirty && (
            <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
              ● Modified
            </span>
          )}

          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm font-medium font-semibold"
          >
            ✓ Simpan Perubahan
          </button>
        </div>
      </div>

      {/* Handsontable */}
      <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
        <HotTable ref={hotRef} settings={hotSettings} />
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-b-lg">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-sm">Keterangan Warna:</span>
          <div className="flex gap-2 flex-wrap">
            <span className="px-3 py-1 bg-green-600 text-white rounded text-xs font-medium">Completed</span>
            <span className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium">In Progress</span>
            <span className="px-3 py-1 bg-yellow-500 text-white rounded text-xs font-medium">Planning</span>
            <span className="px-3 py-1 bg-red-600 text-white rounded text-xs font-medium">Delayed</span>
            <span className="px-3 py-1 bg-purple-600 text-white rounded text-xs font-medium">On Hold</span>
          </div>
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-400">
          Tips: Pilih cell → klik tombol untuk merge atau warnai
        </div>
      </div>
    </div>
  );
}

// Custom renderer for header row
function headerRenderer(
  instance: any,
  td: HTMLTableCellElement,
  row: number,
  col: number,
  prop: string,
  value: any,
  cellProperties: any
) {
  td.innerHTML = `<strong>${value}</strong>`;
  td.style.backgroundColor = "#f1f5f9";
  td.style.fontWeight = "600";
  td.style.textAlign = "center";
  td.style.color = "#0f172a";
  td.style.borderBottom = "2px solid #cbd5e1";
}
