"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import Handsontable from 'handsontable';
import * as XLSX from 'xlsx';
import 'handsontable/dist/handsontable.full.css';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { IconPlus, IconDownload, IconUpload, IconTrash, IconTableExport, IconDeviceFloppy, IconFilter, IconSortAscending, IconSortDescending, IconFileImport } from "@tabler/icons-react";

// Register ALL Handsontable modules for full Excel features
registerAllModules();

interface KPITable {
  id: string;
  name: string;
  year: string;
  employee: string;
  data: any[][];
  mergeCells?: Array<{ row: number; col: number; rowspan: number; colspan: number }>;
  cellColors?: Record<string, string>;
  cellStyles?: Record<string, any>;
}

// Helper function to convert Excel color to hex
const excelColorToHex = (color: any): string | null => {
  if (!color) return null;
  
  // Handle RGB format
  if (color.rgb) {
    let rgb = color.rgb.toString().toUpperCase();
    // Remove alpha channel if present (ARGB format)
    if (rgb.length === 8) {
      rgb = rgb.substring(2);
    }
    return '#' + rgb;
  }
  
  // Handle indexed colors (Excel's color palette)
  if (color.indexed !== undefined) {
    const indexedColors: Record<number, string> = {
      0: '#000000', 1: '#FFFFFF', 2: '#FF0000', 3: '#00FF00',
      4: '#0000FF', 5: '#FFFF00', 6: '#FF00FF', 7: '#00FFFF',
      8: '#000000', 9: '#FFFFFF', 10: '#FF0000', 11: '#00FF00',
      12: '#0000FF', 13: '#FFFF00', 14: '#FF00FF', 15: '#00FFFF',
      16: '#800000', 17: '#008000', 18: '#000080', 19: '#808000',
      20: '#800080', 21: '#008080', 22: '#C0C0C0', 23: '#808080',
      24: '#9999FF', 25: '#993366', 26: '#FFFFCC', 27: '#CCFFFF',
      28: '#660066', 29: '#FF8080', 30: '#0066CC', 31: '#CCCCFF',
      32: '#000080', 33: '#FF00FF', 34: '#FFFF00', 35: '#00FFFF',
      36: '#800080', 37: '#800000', 38: '#008080', 39: '#0000FF',
      40: '#00CCFF', 41: '#CCFFFF', 42: '#CCFFCC', 43: '#FFFF99',
      44: '#99CCFF', 45: '#FF99CC', 46: '#CC99FF', 47: '#FFCC99',
      48: '#3366FF', 49: '#33CCCC', 50: '#99CC00', 51: '#FFCC00',
      52: '#FF9900', 53: '#FF6600', 54: '#666699', 55: '#969696',
      56: '#003366', 57: '#339966', 58: '#003300', 59: '#333300',
      60: '#993300', 61: '#993366', 62: '#333399', 63: '#333333',
      64: '#000000', 65: '#FFFFFF'
    };
    return indexedColors[color.indexed] || null;
  }
  
  // Handle theme colors
  if (color.theme !== undefined) {
    const themeColors: Record<number, string> = {
      0: '#000000', 1: '#FFFFFF', 2: '#E7E6E6', 3: '#44546A',
      4: '#5B9BD5', 5: '#ED7D31', 6: '#A5A5A5', 7: '#FFC000',
      8: '#4472C4', 9: '#70AD47'
    };
    
    let baseColor = themeColors[color.theme] || '#FFFFFF';
    
    // Apply tint if present
    if (color.tint !== undefined && color.tint !== 0) {
      baseColor = applyTint(baseColor, color.tint);
    }
    
    return baseColor;
  }
  
  return null;
};

// Helper to apply tint to color
const applyTint = (hexColor: string, tint: number): string => {
  const rgb = parseInt(hexColor.substring(1), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = rgb & 0xff;
  
  let nr, ng, nb;
  if (tint < 0) {
    nr = Math.round(r * (1 + tint));
    ng = Math.round(g * (1 + tint));
    nb = Math.round(b * (1 + tint));
  } else {
    nr = Math.round(r * (1 - tint) + 255 * tint);
    ng = Math.round(g * (1 - tint) + 255 * tint);
    nb = Math.round(b * (1 - tint) + 255 * tint);
  }
  
  return '#' + ((nr << 16) | (ng << 8) | nb).toString(16).padStart(6, '0').toUpperCase();
};

// Get cell key for storing colors and styles
const getCellKey = (row: number, col: number) => `${row}-${col}`;

export default function KPIPage() {
  const hotTableRef = useRef(null);
  const selectedCellsRef = useRef<any[]>([]);
  const [cellColors, setCellColors] = useState<Record<string, string>>({});
  const [cellStyles, setCellStyles] = useState<Record<string, any>>({});

  const applyColorToCells = (color: string) => {
    if (!hotTableRef.current) return;
    const hotInstance = hotTableRef.current.hotInstance;

    if (!selectedCellsRef.current || selectedCellsRef.current.length === 0) {
      alert('Pilih cell terlebih dahulu!');
      return;
    }

    const newColors = { ...cellColors };
    selectedCellsRef.current.forEach((selection: any[]) => {
      const [rowStart, colStart, rowEnd, colEnd] = selection;

      for (let row = Math.min(rowStart, rowEnd); row <= Math.max(rowStart, rowEnd); row++) {
        for (let col = Math.min(colStart, colEnd); col <= Math.max(colStart, colEnd); col++) {
          const key = getCellKey(row, col);
          newColors[key] = color;
        }
      }
    });

    setCellColors(newColors);

    setTimeout(() => {
      hotInstance.render();
    }, 0);
  };

  const clearCellColors = () => {
    if (!hotTableRef.current) return;
    const hotInstance = hotTableRef.current.hotInstance;

    if (!selectedCellsRef.current || selectedCellsRef.current.length === 0) {
      alert('Pilih cell terlebih dahulu!');
      return;
    }

    const newColors = { ...cellColors };
    selectedCellsRef.current.forEach((selection: any[]) => {
      const [rowStart, colStart, rowEnd, colEnd] = selection;

      for (let row = Math.min(rowStart, rowEnd); row <= Math.max(rowStart, rowEnd); row++) {
        for (let col = Math.min(colStart, colEnd); col <= Math.max(colStart, colEnd); col++) {
          const key = getCellKey(row, col);
          delete newColors[key];
        }
      }
    });

    setCellColors(newColors);

    setTimeout(() => {
      hotInstance.render();
    }, 0);
  };

  const [tables, setTables] = useState<KPITable[]>([
    {
      id: "1",
      name: "KPI 2025 - Ahmad Subekti",
      year: "2025",
      employee: "Ahmad Subekti",
      data: Array.from({ length: 200 }, () => Array(50).fill("")),
      mergeCells: [],
      cellColors: {},
      cellStyles: {},
    },
  ]);

  const [selectedTableId, setSelectedTableId] = useState(tables[0]?.id || "");
  const [isNewTableModalOpen, setIsNewTableModalOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedTable = tables.find((t) => t.id === selectedTableId);

  // Reset cell colors when switching tables
  useEffect(() => {
    if (selectedTable) {
      setCellColors(selectedTable.cellColors || {});
      setCellStyles(selectedTable.cellStyles || {});
    }
  }, [selectedTableId, selectedTable]);

  // IMPROVED Excel Import Function
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, {
          type: 'binary',
          cellStyles: true,
          cellNF: true,
          cellDates: true,
          cellFormula: true,
        });

        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        console.log('📊 Starting Excel import...');
        console.log('Sheet name:', sheetName);

        // Convert to array data with proper handling
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
          blankrows: true,
          raw: false, // Format values as strings
        }) as any[][];

        console.log('✅ Data rows:', jsonData.length);
        console.log('📝 Sample data:', jsonData.slice(0, 3));

        // === 1. DETECT MERGE CELLS ===
        const merges = worksheet['!merges'] || [];
        const mergeCells = merges.map((merge: any) => {
          const rowStart = merge.s.r;
          const colStart = merge.s.c;
          const rowEnd = merge.e.r;
          const colEnd = merge.e.c;

          return {
            row: rowStart,
            col: colStart,
            rowspan: rowEnd - rowStart + 1,
            colspan: colEnd - colStart + 1
          };
        });

        console.log('🔗 Merge cells found:', mergeCells.length);
        mergeCells.forEach(m => {
          console.log(`  Merge: R${m.row}C${m.col} span ${m.rowspan}x${m.colspan}`);
        });

        // === 2. DETECT CELL COLORS & STYLES ===
        const newCellColors: Record<string, string> = {};
        const newCellStyles: Record<string, any> = {};

        Object.keys(worksheet).forEach(cellAddress => {
          if (cellAddress.startsWith('!')) return; // Skip meta keys

          const cell = worksheet[cellAddress];
          if (!cell) return;

          // Parse cell address (e.g., "A1" -> row: 0, col: 0)
          const match = cellAddress.match(/^([A-Z]+)(\d+)$/);
          if (!match) return;

          const colLetter = match[1];
          const rowNum = parseInt(match[2]);
          const col = XLSX.utils.decode_col(colLetter);
          const row = rowNum - 1; // Excel is 1-based, JS is 0-based
          const key = getCellKey(row, col);

          // Extract cell style
          if (cell.s) {
            const style = cell.s;
            
            // === BACKGROUND COLOR ===
            let bgColor = null;

            // Try fill.fgColor first (most common)
            if (style.fill && style.fill.fgColor) {
              bgColor = excelColorToHex(style.fill.fgColor);
            }
            // Try fill.bgColor
            else if (style.fill && style.fill.bgColor) {
              bgColor = excelColorToHex(style.fill.bgColor);
            }
            // Try legacy bgColor
            else if (style.bgColor) {
              bgColor = excelColorToHex(style.bgColor);
            }
            // Try legacy fgColor
            else if (style.fgColor) {
              bgColor = excelColorToHex(style.fgColor);
            }

            if (bgColor && bgColor !== '#FFFFFF') {
              newCellColors[key] = bgColor;
              console.log(`🎨 Cell ${cellAddress} (${row},${col}): ${bgColor}`);
            }

            // === FONT STYLES ===
            const cellStyle: any = {};
            
            if (style.font) {
              // Bold
              if (style.font.bold) {
                cellStyle.fontWeight = 'bold';
              }
              
              // Italic
              if (style.font.italic) {
                cellStyle.fontStyle = 'italic';
              }
              
              // Font color
              if (style.font.color) {
                const fontColor = excelColorToHex(style.font.color);
                if (fontColor) {
                  cellStyle.color = fontColor;
                }
              }
              
              // Font size
              if (style.font.sz) {
                cellStyle.fontSize = `${style.font.sz}pt`;
              }
              
              // Font family
              if (style.font.name) {
                cellStyle.fontFamily = style.font.name;
              }
            }

            // === ALIGNMENT ===
            if (style.alignment) {
              // Horizontal alignment
              if (style.alignment.horizontal) {
                const hAlign = style.alignment.horizontal;
                if (hAlign === 'center') cellStyle.textAlign = 'center';
                else if (hAlign === 'right') cellStyle.textAlign = 'right';
                else if (hAlign === 'left') cellStyle.textAlign = 'left';
              }
              
              // Vertical alignment
              if (style.alignment.vertical) {
                const vAlign = style.alignment.vertical;
                if (vAlign === 'center') cellStyle.verticalAlign = 'middle';
                else if (vAlign === 'top') cellStyle.verticalAlign = 'top';
                else if (vAlign === 'bottom') cellStyle.verticalAlign = 'bottom';
              }
              
              // Text wrap
              if (style.alignment.wrapText) {
                cellStyle.whiteSpace = 'normal';
              }
            }

            // === BORDERS ===
            if (style.border) {
              const borders: any = {};
              
              if (style.border.top) {
                borders.borderTop = `1px ${style.border.top.style || 'solid'} #000`;
              }
              if (style.border.bottom) {
                borders.borderBottom = `1px ${style.border.bottom.style || 'solid'} #000`;
              }
              if (style.border.left) {
                borders.borderLeft = `1px ${style.border.left.style || 'solid'} #000`;
              }
              if (style.border.right) {
                borders.borderRight = `1px ${style.border.right.style || 'solid'} #000`;
              }
              
              Object.assign(cellStyle, borders);
            }

            if (Object.keys(cellStyle).length > 0) {
              newCellStyles[key] = cellStyle;
            }
          }
        });

        console.log('🎨 Total colored cells:', Object.keys(newCellColors).length);
        console.log('💅 Total styled cells:', Object.keys(newCellStyles).length);

        // === 3. UPDATE HANDSONTABLE ===
        if (hotTableRef.current) {
          const hotInstance = hotTableRef.current.hotInstance;

          // Step 1: Load data
          hotInstance.loadData(jsonData);
          console.log('✅ Data loaded');

          // Step 2: Apply merge cells
          setTimeout(() => {
            if (mergeCells.length > 0) {
              const mergeCellsPlugin = hotInstance.getPlugin('mergeCells');
              mergeCellsPlugin.mergedCellsCollection.mergedCells = [];
              
              mergeCells.forEach(merge => {
                mergeCellsPlugin.merge(
                  merge.row,
                  merge.col,
                  merge.row + merge.rowspan - 1,
                  merge.col + merge.colspan - 1
                );
              });
              
              console.log('✅ Merge cells applied');
            }

            // Step 3: Apply colors and styles
            setTimeout(() => {
              setCellColors(newCellColors);
              setCellStyles(newCellStyles);
              hotInstance.render();
              console.log('✅ Colors and styles applied');

              // Update table state
              setTables((prev) =>
                prev.map((table) =>
                  table.id === selectedTableId
                    ? {
                        ...table,
                        data: jsonData,
                        mergeCells,
                        cellColors: newCellColors,
                        cellStyles: newCellStyles,
                      }
                    : table
                )
              );

              setIsDirty(true);

              // Success message
              alert(
                `✅ Import Excel Berhasil!\n\n` +
                `📊 Data: ${jsonData.length} baris\n` +
                `🔗 Merge cells: ${mergeCells.length}\n` +
                `🎨 Cell berwarna: ${Object.keys(newCellColors).length}\n` +
                `💅 Cell dengan style: ${Object.keys(newCellStyles).length}`
              );
            }, 150);
          }, 100);
        }

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        console.error('❌ Error importing Excel:', error);
        alert('❌ Gagal import Excel: ' + (error as Error).message);
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleSaveTable = () => {
    if (hotTableRef.current) {
      const hotInstance = hotTableRef.current.hotInstance;
      const data = hotInstance.getData();
      const mergeCellsPlugin = hotInstance.getPlugin('mergeCells');
      const mergeCells = mergeCellsPlugin.mergedCellsCollection.mergedCells.map((m: any) => ({
        row: m.row,
        col: m.col,
        rowspan: m.rowspan,
        colspan: m.colspan,
      }));

      setTables((prev) =>
        prev.map((table) =>
          table.id === selectedTableId
            ? {
                ...table,
                data,
                mergeCells,
                cellColors,
                cellStyles,
              }
            : table
        )
      );

      setIsDirty(false);
      alert("✅ Data berhasil disimpan!");
    }
  };

  const handleExportExcel = () => {
    if (hotTableRef.current) {
      const exportPlugin = hotTableRef.current.hotInstance.getPlugin('exportFile');
      exportPlugin.downloadFile('csv', {
        filename: `KPI_${selectedTable?.name}_${new Date().toISOString().split('T')[0]}`,
        columnHeaders: true,
        rowHeaders: true,
      });
    }
  };

  const handleCreateNewTable = (name: string, year: string, employee: string) => {
    const newTable: KPITable = {
      id: Date.now().toString(),
      name: `${name} - ${employee}`,
      year,
      employee,
      data: Array.from({ length: 200 }, () => Array(50).fill("")),
      mergeCells: [],
      cellColors: {},
      cellStyles: {},
    };

    setTables([...tables, newTable]);
    setSelectedTableId(newTable.id);
    setIsNewTableModalOpen(false);
  };

  const handleDeleteTable = (tableId: string) => {
    if (tables.length === 1) {
      alert("Tidak bisa menghapus tabel terakhir");
      return;
    }

    setTables(tables.filter((t) => t.id !== tableId));
    if (selectedTableId === tableId) {
      setSelectedTableId(tables[0]?.id || "");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:to-slate-900 p-6">
      <div className="max-w-[1900px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 dark:from-slate-50 dark:via-blue-50 dark:to-indigo-50 bg-clip-text text-transparent">
              KPI Annual Tracker
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2 text-lg">
              Kelola Key Performance Indicator tahunan dengan import Excel lengkap (merge, warna, style)
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="default"
              size="default"
              className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              onClick={() => setIsNewTableModalOpen(true)}
            >
              <IconPlus className="h-4 w-4" />
              Buat KPI Baru
            </Button>
            <Button 
              variant="outline" 
              size="default" 
              className="gap-2 border-blue-200 hover:bg-blue-50"
              onClick={handleSaveTable}
            >
              <IconDeviceFloppy className="h-4 w-4" />
              Simpan
            </Button>
            <Button
              variant="outline"
              size="default"
              className="gap-2 border-green-200 hover:bg-green-50"
              onClick={handleExportExcel}
            >
              <IconTableExport className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Import Excel Section - Enhanced */}
        <Card className="p-5 border-blue-200 dark:border-slate-800 shadow-lg bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-lg">
                <IconFileImport className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Import dari Excel</h3>
                <p className="text-sm text-slate-600">
                  ✨ Support lengkap: Merge cells, Warna background, Font style, Alignment, Borders
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportExcel}
                className="hidden"
              />
              <Button
                variant="default"
                size="lg"
                className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                onClick={() => fileInputRef.current?.click()}
              >
                <IconUpload className="h-5 w-5" />
                Pilih File Excel
              </Button>
            </div>
          </div>
        </Card>

        {/* Color Palette */}
        <Card className="p-4 border-blue-200 dark:border-slate-800 shadow-lg bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm font-semibold text-slate-700">🎨 Warna Cell:</span>
            <div className="flex gap-2 flex-wrap">
              {[
                { color: '#FCC900', name: 'Kuning' },
                { color: '#00FF00', name: 'Hijau' },
                { color: '#0000FF', name: 'Biru' },
                { color: '#4F46E5', name: 'Indigo' },
                { color: '#EC4899', name: 'Pink' },
                { color: '#FF0000', name: 'Merah' },
                { color: '#9333EA', name: 'Ungu' },
                { color: '#F97316', name: 'Orange' },
              ].map(({ color, name }) => (
                <button
                  key={color}
                  onClick={() => applyColorToCells(color)}
                  className="w-8 h-8 rounded border-2 border-slate-300 hover:border-slate-500 hover:scale-110 transition-all"
                  style={{ backgroundColor: color }}
                  title={name}
                />
              ))}
              <button
                onClick={clearCellColors}
                className="px-3 py-1 text-sm border-2 border-slate-300 rounded hover:bg-slate-100 transition-colors font-semibold"
                title="Hapus warna"
              >
                ❌ Clear
              </button>
            </div>
            <span className="text-xs text-slate-500 italic">Pilih cell(s) lalu klik warna</span>
          </div>
        </Card>

        {/* Table Selector */}
        <Card className="p-5 border-blue-200 dark:border-slate-800 shadow-lg bg-white/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <Label className="text-sm font-bold whitespace-nowrap text-slate-700">Pilih KPI:</Label>
              <Select value={selectedTableId} onValueChange={setSelectedTableId}>
                <SelectTrigger className="w-[450px] border-blue-200">
                  <SelectValue placeholder="Pilih tabel KPI" />
                </SelectTrigger>
                <SelectContent>
                  {tables.map((table) => (
                    <SelectItem key={table.id} value={table.id}>
                      {table.name} ({table.year})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTable && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-900 border-blue-200">
                    📅 {selectedTable.year}
                  </Badge>
                  <Badge variant="outline" className="gap-1 border-indigo-200 text-indigo-900">
                    👤 {selectedTable.employee}
                  </Badge>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => selectedTableId && handleDeleteTable(selectedTableId)}
            >
              <IconTrash className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        {/* KPI Data Grid - Handsontable with Enhanced Rendering */}
        {selectedTable && (
          <Card className="border-blue-200 dark:border-slate-800 overflow-hidden shadow-xl bg-white">
            <div className="p-6">
              <HotTable
                key={selectedTableId}
                ref={hotTableRef}
                data={selectedTable.data}
                id={`hotTable-${selectedTableId}`}
                colHeaders={true}
                rowHeaders={true}
                width="100%"
                height={800}
                licenseKey="non-commercial-and-evaluation"
                mergeCells={selectedTable.mergeCells || []}
                afterGetCellMeta={(row, col, cellProperties) => {
                  const key = getCellKey(row, col);
                  
                  // Custom renderer with color and style support
                  cellProperties.renderer = function(instance, td, row, col, prop, value, cellProperties) {
                    // Render with base TextRenderer
                    Handsontable.renderers.TextRenderer.apply(this, arguments);
                    
                    // Apply background color
                    if (cellColors[key]) {
                      td.style.backgroundColor = cellColors[key];
                    }
                    
                    // Apply custom styles
                    if (cellStyles[key]) {
                      const styles = cellStyles[key];
                      Object.keys(styles).forEach(styleProp => {
                        td.style[styleProp as any] = styles[styleProp];
                      });
                    }
                    
                    // Ensure smooth transitions
                    td.style.transition = 'all 0.15s ease';
                  };
                }}
                contextMenu={{
                  items: {
                    'row_above': {},
                    'row_below': {},
                    'col_left': {},
                    'col_right': {},
                    'remove_row': {},
                    'remove_col': {},
                    'undo': {},
                    'redo': {},
                    'make_read_only': {},
                    'alignment': {},
                    'mergeCells': {},
                  }
                }}
                manualColumnResize={true}
                manualRowResize={true}
                autoWrapRow={true}
                autoWrapCol={true}
                fillHandle={true}
                stretchH="all"
                className="htCore"
                afterSelection={(rowStart, colStart, rowEnd, colEnd) => {
                  if (rowStart !== null && colStart !== null && rowEnd !== null && colEnd !== null) {
                    selectedCellsRef.current = [[rowStart, colStart, rowEnd, colEnd]];
                  }
                }}
                afterChange={(changes, source) => {
                  if (source !== 'loadData') {
                    setIsDirty(true);
                  }
                }}
              />
            </div>
          </Card>
        )}

        {/* Enhanced Instructions */}
        <Card className="p-6 border-blue-200 dark:border-slate-800 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950 dark:to-indigo-950 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="bg-blue-600 text-white p-3 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 dark:text-slate-50 mb-4 text-lg">
                🚀 Panduan Import Excel Lengkap
              </h3>
              <div className="grid md:grid-cols-2 gap-6 text-sm text-slate-700 dark:text-slate-300">
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <span className="text-blue-600 font-bold">✨</span>
                    <div>
                      <strong className="text-slate-900">Import Excel:</strong> Semua format otomatis terdeteksi
                      <ul className="ml-4 mt-1 text-xs space-y-1">
                        <li>• Merge cells (gabungan sel)</li>
                        <li>• Warna background (fill colors)</li>
                        <li>• Font style (bold, italic, color, size)</li>
                        <li>• Alignment (horizontal, vertical)</li>
                        <li>• Borders & text wrap</li>
                      </ul>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-blue-600 font-bold">🎨</span>
                    <div>
                      <strong className="text-slate-900">Warna Support:</strong> RGB, ARGB, Indexed, Theme colors
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <span className="text-indigo-600 font-bold">📋</span>
                    <div>
                      <strong className="text-slate-900">Copy/Paste:</strong> Ctrl+C dari Excel → Ctrl+V ke tabel
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-indigo-600 font-bold">💾</span>
                    <div>
                      <strong className="text-slate-900">Simpan:</strong> Klik "Simpan" untuk menyimpan semua perubahan
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-indigo-600 font-bold">📤</span>
                    <div>
                      <strong className="text-slate-900">Export:</strong> Download sebagai CSV
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Features Info */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-4 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="text-blue-600 mb-2">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
            <h4 className="font-bold text-slate-900 mb-1">🎨 Full Excel Styling</h4>
            <p className="text-sm text-slate-700">Import lengkap dengan semua warna, font, dan alignment dari Excel</p>
          </Card>
          
          <Card className="p-4 border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100">
            <div className="text-indigo-600 mb-2">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5z" />
              </svg>
            </div>
            <h4 className="font-bold text-slate-900 mb-1">🔗 Smart Merge Detection</h4>
            <p className="text-sm text-slate-700">Deteksi otomatis merge cells dari Excel dan preservasi strukturnya</p>
          </Card>
          
          <Card className="p-4 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
            <div className="text-purple-600 mb-2">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h4 className="font-bold text-slate-900 mb-1">💾 Auto-Save State</h4>
            <p className="text-sm text-slate-700">Semua format tersimpan dan bisa di-edit ulang kapan saja</p>
          </Card>
        </div>
      </div>

      {/* New Table Modal */}
      {isNewTableModalOpen && (
        <NewTableModal
          onClose={() => setIsNewTableModalOpen(false)}
          onSave={handleCreateNewTable}
        />
      )}
      
      {/* Custom Styles */}
      <style jsx global>{`
        .htCore thead th {
          background: linear-gradient(135deg, #3B82F6 0%, #6366F1 100%) !important;
          color: white !important;
          font-weight: 600 !important;
          border-color: #1e40af !important;
        }

        .htCore tbody th {
          background: #f1f5f9 !important;
          font-weight: 500 !important;
          color: #334155 !important;
        }

        .htCore td {
          border-color: #e2e8f0 !important;
        }

        .ht_master .wtHolder {
          background: #ffffff !important;
        }

        .handsontable td.htInvalid {
          background-color: #fef2f2 !important;
        }

        .handsontable .htCommentCell::after {
          border-color: #3b82f6 transparent transparent #3b82f6 !important;
        }
      `}</style>
    </div>
  );
}

function NewTableModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (name: string, year: string, employee: string) => void;
}) {
  const [name, setName] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [employee, setEmployee] = useState("");

  const years = Array.from({ length: 10 }, (_, i) => {
    const y = new Date().getFullYear() - 5 + i;
    return y.toString();
  });

  const handleSave = () => {
    if (!name || !year || !employee) {
      alert("Mohon isi semua field");
      return;
    }
    onSave(name, year, employee);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6 space-y-4 shadow-2xl border-blue-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
            <IconPlus className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-900 to-indigo-900 bg-clip-text text-transparent">
            Buat KPI Baru
          </h2>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-700 font-semibold">Nama KPI</Label>
          <Input
            placeholder="Contoh: Sales Performance Q1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border-blue-200 focus:border-blue-400"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-slate-700 font-semibold">Tahun</Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="border-blue-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-700 font-semibold">Nama Karyawan</Label>
          <Input
            placeholder="Nama lengkap karyawan"
            value={employee}
            onChange={(e) => setEmployee(e.target.value)}
            className="border-blue-200 focus:border-blue-400"
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose} className="border-slate-300">
            Batal
          </Button>
          <Button 
            onClick={handleSave}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            Buat KPI
          </Button>
        </div>
      </Card>
    </div>
  );
}
