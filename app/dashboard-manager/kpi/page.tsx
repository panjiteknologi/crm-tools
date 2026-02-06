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
import { IconPlus, IconDownload, IconUpload, IconTrash, IconTableExport, IconDeviceFloppy, IconFilter, IconSortAscending, IconSortDescending, IconFileImport, IconZoomIn, IconZoomOut, IconZoomReset } from "@tabler/icons-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import * as ExcelJS from 'exceljs';

// Register ALL Handsontable modules
registerAllModules();

interface KPIWithYear {
  year: string;
  name: string;
  createdAt: number;
}

// Get cell key
const getCellKey = (row: number, col: number) => `${row}-${col}`;

// Excel color to hex converter - COMPLETE VERSION
const excelColorToHex = (color: any): string | null => {
  if (!color) return null;
  
  // ARGB format (8 characters)
  if (color.argb) {
    const argb = color.argb.toString().toUpperCase();
    const rgb = argb.length === 8 ? argb.substring(2) : argb;
    return '#' + rgb.padStart(6, '0');
  }
  
  // RGB format
  if (color.rgb) {
    let rgb = color.rgb.toString(16).toUpperCase();
    if (rgb.length === 8) rgb = rgb.substring(2);
    return '#' + rgb.padStart(6, '0');
  }
  
  // Indexed colors
  if (color.indexed !== undefined && color.indexed !== null) {
    const indexedColors: Record<number, string> = {
      0: '#000000', 1: '#FFFFFF', 2: '#FF0000', 3: '#00FF00', 4: '#0000FF',
      5: '#FFFF00', 6: '#FF00FF', 7: '#00FFFF', 8: '#000000', 9: '#FFFFFF',
      10: '#FF0000', 11: '#00FF00', 12: '#0000FF', 13: '#FFFF00', 14: '#FF00FF',
      15: '#00FFFF', 16: '#800000', 17: '#008000', 18: '#000080', 19: '#808000',
      20: '#800080', 21: '#008080', 22: '#C0C0C0', 23: '#808080', 24: '#9999FF',
      25: '#993366', 26: '#FFFFCC', 27: '#CCFFFF', 28: '#660066', 29: '#FF8080',
      30: '#0066CC', 31: '#CCCCFF', 32: '#000080', 33: '#FF00FF', 34: '#FFFF00',
      35: '#00FFFF', 36: '#800080', 37: '#800000', 38: '#008080', 39: '#0000FF',
      40: '#00CCFF', 41: '#CCFFFF', 42: '#CCFFCC', 43: '#FFFF99', 44: '#99CCFF',
      45: '#FF99CC', 46: '#CC99FF', 47: '#FFCC99', 48: '#3366FF', 49: '#33CCCC',
      50: '#99CC00', 51: '#FFCC00', 52: '#FF9900', 53: '#FF6600', 54: '#666699',
      55: '#969696', 56: '#003366', 57: '#339966', 58: '#003300', 59: '#333300',
      60: '#993300', 61: '#993366', 62: '#333399', 63: '#333333', 64: '#000000',
      65: '#FFFFFF'
    };
    return indexedColors[color.indexed] || null;
  }
  
  // Theme colors
  if (color.theme !== undefined && color.theme !== null) {
    const themeColors: Record<number, string> = {
      0: '#000000', 1: '#FFFFFF', 2: '#E7E6E6', 3: '#44546A',
      4: '#5B9BD5', 5: '#ED7D31', 6: '#A5A5A5', 7: '#FFC000',
      8: '#4472C4', 9: '#70AD47', 10: '#0563C1', 11: '#954F72',
    };
    
    let baseColor = themeColors[color.theme] || '#FFFFFF';
    
    if (color.tint !== undefined && color.tint !== 0) {
      baseColor = applyTint(baseColor, color.tint);
    }
    
    return baseColor;
  }
  
  return null;
};

// Apply tint to color
const applyTint = (hexColor: string, tint: number): string => {
  hexColor = hexColor.replace('#', '');
  
  const rgb = parseInt(hexColor, 16);
  let r = (rgb >> 16) & 0xff;
  let g = (rgb >> 8) & 0xff;
  let b = rgb & 0xff;
  
  if (tint < 0) {
    r = Math.round(r * (1 + tint));
    g = Math.round(g * (1 + tint));
    b = Math.round(b * (1 + tint));
  } else {
    r = Math.round(r * (1 - tint) + 255 * tint);
    g = Math.round(g * (1 - tint) + 255 * tint);
    b = Math.round(b * (1 - tint) + 255 * tint);
  }
  
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0').toUpperCase();
};

export default function KPIPage() {
  const router = useRouter();
  const hotTableRef = useRef(null);
  const selectedCellsRef = useRef<any[]>([]);
  const [cellColors, setCellColors] = useState<Record<string, string>>({});
  const [cellStyles, setCellStyles] = useState<Record<string, any>>({});
  const [importedData, setImportedData] = useState<any[][] | null>(null);
  const [importedMergeCells, setImportedMergeCells] = useState<any[]>([]);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [tableHeight, setTableHeight] = useState(800);
  const currentYear = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);
  const [isDirty, setIsDirty] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isNewKPIModalOpen, setIsNewKPIModalOpen] = useState(false);
  const [isLoadingYear, setIsLoadingYear] = useState(false);
  const [hotTableKey, setHotTableKey] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const importFinishedRef = useRef(false);
  const [globalFontSize, setGlobalFontSize] = useState(13);

  useEffect(() => {
    const userStr = localStorage.getItem('crm_user');
    if (!userStr) {
      router.push('/login');
    }
  }, [router]);

  // Calculate table height based on viewport
  useEffect(() => {
    const calculateHeight = () => {
      // Get actual available height by subtracting fixed elements
      const header = document.querySelector('header')?.offsetHeight || 0;
      const yearSelector = 120; // Approximate height
      const toolbar = 150; // Approximate height
      const padding = 100; // Extra padding
      const availableHeight = window.innerHeight - header - yearSelector - toolbar - padding;
      const finalHeight = Math.max(availableHeight, 600);

      // Adjust for zoom level - when zoomed out, we need more height
      const adjustedHeight = finalHeight * (100 / zoomLevel);

      console.log('📏 Table height calculation:', {
        windowInnerHeight: window.innerHeight,
        header,
        availableHeight,
        finalHeight,
        zoomLevel,
        adjustedHeight,
      });

      setTableHeight(adjustedHeight);
    };

    // Initial calculation
    setTimeout(calculateHeight, 100);

    // Recalculate on resize and zoom change
    window.addEventListener('resize', calculateHeight);
    return () => window.removeEventListener('resize', calculateHeight);
  }, [zoomLevel]);

  const getCurrentUser = () => {
    const userStr = localStorage.getItem('crm_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  };

  const allYears = useQuery(api.kpiAnnual.getAllYears);
  const selectedKPI = useQuery(api.kpiAnnual.getByYear, { year: selectedYear });
  const isLoadingConvexData = selectedKPI === undefined;
  const updateKPI = useMutation(api.kpiAnnual.update);
  const createKPI = useMutation(api.kpiAnnual.create);

  const handleCreateKPI = async (year: string, name: string) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser || !currentUser._id) {
        alert("❌ Anda belum login. Silakan login terlebih dahulu.");
        router.push('/login');
        return;
      }

      setIsLoadingYear(true);

      const emptyTableState = JSON.stringify({
        data: Array.from({ length: 200 }, () => Array(50).fill("")),
        mergeCells: [],
        cellColors: {},
        cellStyles: {}
      });

      await createKPI({
        year,
        name,
        tableState: emptyTableState,
        userId: currentUser._id as any,
      });

      setSelectedYear(year);
      setIsNewKPIModalOpen(false);

      setTimeout(() => {
        setIsLoadingYear(false);
      }, 500);

      alert(`✅ KPI "${name}" untuk tahun ${year} berhasil dibuat!`);
    } catch (error: any) {
      console.error("Error creating KPI:", error);
      setIsLoadingYear(false);

      if (error.message.includes("Unauthorized") || error.message.includes("User not found")) {
        alert("❌ Sesi Anda telah berakhir. Silakan login ulang.");
        router.push('/login');
      } else {
        alert("❌ Gagal membuat KPI: " + error.message);
      }
    }
  };

  const handleSelectKPI = (year: string) => {
    if (year !== selectedYear) {
      setIsLoadingYear(true);
    }
    setSelectedYear(year);
  };

  const applyColorToCells = (color: string) => {
    console.log('🎨 Applying color:', color);

    if (!hotTableRef.current) {
      console.error('❌ hotTableRef.current is null');
      return;
    }

    const hotInstance = hotTableRef.current.hotInstance;
    if (!hotInstance) {
      console.error('❌ hotInstance is null');
      return;
    }

    if (!selectedCellsRef.current || selectedCellsRef.current.length === 0) {
      alert('Pilih cell terlebih dahulu!');
      return;
    }

    console.log('📋 Selected cells:', selectedCellsRef.current);

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

    console.log('✅ Updated cell colors:', Object.keys(newColors).length, 'cells');
    setCellColors(newColors);

    // Force re-render
    setTimeout(() => {
      if (hotTableRef.current) {
        const instance = hotTableRef.current.hotInstance;
        if (instance) {
          try {
            instance.render();
            console.log('✅ Rendered successfully');
          } catch (error) {
            console.error('Error rendering:', error);
          }
        }
      }
    }, 0);
  };

  const applyTextColorToCells = (color: string) => {
    console.log('✏️ Applying text color:', color);

    if (!hotTableRef.current) {
      console.error('❌ hotTableRef.current is null');
      return;
    }

    const hotInstance = hotTableRef.current.hotInstance;
    if (!hotInstance) {
      console.error('❌ hotInstance is null');
      return;
    }

    if (!selectedCellsRef.current || selectedCellsRef.current.length === 0) {
      alert('Pilih cell terlebih dahulu!');
      return;
    }

    const newStyles = { ...cellStyles };
    selectedCellsRef.current.forEach((selection: any[]) => {
      const [rowStart, colStart, rowEnd, colEnd] = selection;

      for (let row = Math.min(rowStart, rowEnd); row <= Math.max(rowStart, rowEnd); row++) {
        for (let col = Math.min(colStart, colEnd); col <= Math.max(colStart, colEnd); col++) {
          const key = getCellKey(row, col);
          if (!newStyles[key]) {
            newStyles[key] = {};
          }
          newStyles[key].color = color;
        }
      }
    });

    console.log('✅ Updated text color for', Object.keys(newStyles).length, 'cells');
    setCellStyles(newStyles);

    setTimeout(() => {
      if (hotTableRef.current) {
        const instance = hotTableRef.current.hotInstance;
        if (instance) {
          try {
            instance.render();
          } catch (error) {
            console.error('Error rendering:', error);
          }
        }
      }
    }, 0);
  };

  const applyBorderToCells = (borderStyle: string) => {
    console.log('🔲 Applying border:', borderStyle);

    if (!hotTableRef.current) {
      console.error('❌ hotTableRef.current is null');
      return;
    }

    const hotInstance = hotTableRef.current.hotInstance;
    if (!hotInstance) {
      console.error('❌ hotInstance is null');
      return;
    }

    if (!selectedCellsRef.current || selectedCellsRef.current.length === 0) {
      alert('Pilih cell terlebih dahulu!');
      return;
    }

    const newStyles = { ...cellStyles };
    selectedCellsRef.current.forEach((selection: any[]) => {
      const [rowStart, colStart, rowEnd, colEnd] = selection;

      for (let row = Math.min(rowStart, rowEnd); row <= Math.max(rowStart, rowEnd); row++) {
        for (let col = Math.min(colStart, colEnd); col <= Math.max(colStart, colEnd); col++) {
          const key = getCellKey(row, col);
          if (!newStyles[key]) {
            newStyles[key] = {};
          }
          newStyles[key].border = borderStyle;
        }
      }
    });

    console.log('✅ Updated border for', Object.keys(newStyles).length, 'cells');
    setCellStyles(newStyles);

    setTimeout(() => {
      if (hotTableRef.current) {
        const instance = hotTableRef.current.hotInstance;
        if (instance) {
          try {
            instance.render();
          } catch (error) {
            console.error('Error rendering:', error);
          }
        }
      }
    }, 0);
  };

  const clearCellColors = () => {
    console.log('🗑️ Clearing cell colors');

    if (!hotTableRef.current) {
      console.error('❌ hotTableRef.current is null');
      return;
    }

    const hotInstance = hotTableRef.current.hotInstance;
    if (!hotInstance) {
      console.error('❌ hotInstance is null');
      return;
    }

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

    console.log('✅ Cleared colors, remaining:', Object.keys(newColors).length);
    setCellColors(newColors);

    setTimeout(() => {
      if (hotTableRef.current) {
        const instance = hotTableRef.current.hotInstance;
        if (instance) {
          try {
            instance.render();
          } catch (error) {
            console.error('Error rendering:', error);
          }
        }
      }
    }, 0);
  };

  const clearCellStyles = () => {
    console.log('🗑️ Clearing cell styles');

    if (!hotTableRef.current) {
      console.error('❌ hotTableRef.current is null');
      return;
    }

    const hotInstance = hotTableRef.current.hotInstance;
    if (!hotInstance) {
      console.error('❌ hotInstance is null');
      return;
    }

    if (!selectedCellsRef.current || selectedCellsRef.current.length === 0) {
      alert('Pilih cell terlebih dahulu!');
      return;
    }

    const newStyles = { ...cellStyles };
    selectedCellsRef.current.forEach((selection: any[]) => {
      const [rowStart, colStart, rowEnd, colEnd] = selection;

      for (let row = Math.min(rowStart, rowEnd); row <= Math.max(rowStart, rowEnd); row++) {
        for (let col = Math.min(colStart, colEnd); col <= Math.max(colStart, colEnd); col++) {
          const key = getCellKey(row, col);
          delete newStyles[key];
        }
      }
    });

    console.log('✅ Cleared styles, remaining:', Object.keys(newStyles).length);
    setCellStyles(newStyles);

    setTimeout(() => {
      if (hotTableRef.current) {
        const instance = hotTableRef.current.hotInstance;
        if (instance) {
          try {
            instance.render();
          } catch (error) {
            console.error('Error rendering:', error);
          }
        }
      }
    }, 0);
  };

  useEffect(() => {
    let isMounted = true;

    if (isImporting || importFinishedRef.current) {
      if (importFinishedRef.current) {
        setTimeout(() => {
          importFinishedRef.current = false;
        }, 1000);
      }
      return;
    }

    // Reset imported data when loading from database
    setImportedData(null);
    setImportedMergeCells([]);

    if (!isLoadingConvexData && isLoadingYear) {
      setIsLoadingYear(false);
    }

    if (selectedKPI) {
      try {
        if (selectedKPI.tableState) {
          const tableState = JSON.parse(selectedKPI.tableState);

          setCellColors(tableState.cellColors || {});
          setCellStyles(tableState.cellStyles || {});
          setHotTableKey(prev => prev + 1);

          setTimeout(() => {
            if (!isMounted || !hotTableRef.current) return;
            const hotInstance = hotTableRef.current?.hotInstance;
            if (!hotInstance || !hotInstance.isWorking) return;

            hotInstance.loadData(tableState.data || []);

            if (tableState.mergeCells && tableState.mergeCells.length > 0) {
              const mergeCellsPlugin = hotInstance.getPlugin('mergeCells');
              if (mergeCellsPlugin) {
                mergeCellsPlugin.mergedCellsCollection.mergedCells = [];
                tableState.mergeCells.forEach((merge: any) => {
                  try {
                    mergeCellsPlugin.merge(
                      merge.row,
                      merge.col,
                      merge.row + merge.rowspan - 1,
                      merge.col + merge.colspan - 1
                    );
                  } catch (error) {
                    console.error('Error merging cells:', error);
                  }
                });
              }
            }

            hotInstance.render();
          }, 100);
        }
      } catch (error) {
        console.error('❌ Error loading KPI data:', error);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [selectedKPI, selectedYear, isLoadingYear, isLoadingConvexData, isImporting]);

  // COMPLETELY REWRITTEN - SUPER ACCURATE Excel Import
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      console.log('🚀 Starting ACCURATE Excel import...');

      const workbook = new ExcelJS.Workbook();
      const arrayBuffer = await file.arrayBuffer();
      await workbook.xlsx.load(arrayBuffer);

      const worksheet = workbook.worksheets[0];
      console.log('📊 Worksheet:', worksheet.name);
      console.log('📏 Dimensions:', worksheet.rowCount, 'x', worksheet.columnCount);

      // Initialize
      const newCellColors: Record<string, string> = {};
      const newCellStyles: Record<string, any> = {};
      const mergeCells: any[] = [];

      // === GET ACCURATE DIMENSIONS ===
      // Use worksheet's actual dimensions
      const actualMaxRow = worksheet.rowCount;
      const actualMaxCol = worksheet.columnCount;

      console.log('📐 Worksheet dimensions:', actualMaxRow, 'rows x', actualMaxCol, 'cols');

      // Find actual used range (more accurate)
      let usedMaxRow = 0;
      let usedMaxCol = 0;

      // Scan ALL rows including empty ones within range
      worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
        if (rowNumber > actualMaxRow) return;

        usedMaxRow = Math.max(usedMaxRow, rowNumber);

        // Check ALL cells in the row
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          usedMaxCol = Math.max(usedMaxCol, colNumber);
        });
      });

      console.log('📐 Used range:', usedMaxRow, 'rows x', usedMaxCol, 'cols');

      // Add buffer and ensure minimum size
      const totalRows = Math.max(usedMaxRow + 20, 200);
      const totalCols = Math.max(usedMaxCol + 10, 50);

      console.log('📦 Creating table:', totalRows, 'x', totalCols);

      // Create empty data array with CORRECT dimensions
      const jsonData: any[][] = Array.from({ length: totalRows }, () =>
        Array(totalCols).fill("")
      );

      // === EXTRACT ALL DATA AND STYLES ===
      // Iterate through ALL rows in the worksheet
      for (let rowNum = 1; rowNum <= actualMaxRow; rowNum++) {
        const row = worksheet.getRow(rowNum);
        const rowIndex = rowNum - 1;

        // Iterate through ALL columns in the worksheet
        for (let colNum = 1; colNum <= actualMaxCol; colNum++) {
          const cell = row.getCell(colNum);
          const colIndex = colNum - 1;
          const key = getCellKey(rowIndex, colIndex);

          // === EXTRACT VALUE - COMPREHENSIVE VERSION ===
          let cellValue = '';

          // Get the raw value
          if (cell.value !== null && cell.value !== undefined) {
            // DEBUG: Log first few cells
            if (rowNum <= 3 && colNum <= 3) {
              console.log(`🔍 Cell (${rowNum},${colNum}):`, {
                value: cell.value,
                type: typeof cell.value,
                cellType: cell.type,
                numFmt: cell.numFmt,
              });
            }
            // Handle different value types
            if (typeof cell.value === 'object') {
              // Formula with calculated result
              if ('result' in cell.value) {
                const result = cell.value.result;
                if (result !== null && result !== undefined) {
                  // Check if result is a date
                  if (result instanceof Date) {
                    cellValue = result.toLocaleDateString('id-ID');
                  } else {
                    cellValue = String(result);
                  }
                }
              }
              // Rich text with formatting
              else if ('richText' in cell.value && Array.isArray(cell.value.richText)) {
                cellValue = cell.value.richText
                  .map((t: any) => t.text || '')
                  .join('');
              }
              // Hyperlink
              else if ('text' in cell.value) {
                cellValue = cell.value.text || '';
              }
              // Date object
              else if (cell.value instanceof Date) {
                // Check if cell has date format
                const numFmt = cell.numFmt;
                if (numFmt && (numFmt.includes('dd') || numFmt.includes('mm') || numFmt.includes('yy'))) {
                  cellValue = cell.value.toLocaleDateString('id-ID');
                } else {
                  cellValue = cell.value.toLocaleDateString('id-ID');
                }
              }
              // Error object
              else if ('error' in cell.value) {
                cellValue = cell.value.error || '';
              }
              // Any other object - try to convert
              else {
                try {
                  cellValue = JSON.stringify(cell.value);
                } catch {
                  cellValue = String(cell.value);
                }
              }
            } else {
              // Simple value (string, number, boolean)
              cellValue = String(cell.value);
            }
          }

          // Handle formatted numbers (percentages, currency, etc.)
          if (cell.type === ExcelJS.ValueType.Number && cell.numFmt) {
            const numFmt = cell.numFmt.toLowerCase();
            const numValue = parseFloat(cellValue);

            if (!isNaN(numValue)) {
              // Percentage format
              if (numFmt.includes('%')) {
                cellValue = (numValue * 100).toFixed(numFmt.split('.')[1]?.length || 2) + '%';
              }
              // Currency format (with decimals)
              else if (numFmt.includes('"') || numFmt.includes('$') || numFmt.includes('€') || numFmt.includes('Rp')) {
                const decimals = (numFmt.match(/0+/g) || ['']).pop()?.length || 2;
                cellValue = numValue.toFixed(decimals);
              }
              // Number format with specific decimals
              else if (numFmt.includes('0')) {
                const decimals = (numFmt.match(/0/g) || []).length - 1;
                if (decimals > 0) {
                  cellValue = numValue.toFixed(Math.min(decimals, 10));
                }
              }
            }
          }

          // Store value
          jsonData[rowIndex][colIndex] = cellValue;

          // === EXTRACT STYLES ===
          const cellStyle: any = {};

          // BACKGROUND COLOR
          if (cell.fill && cell.fill.type === 'pattern') {
            const fill = cell.fill as ExcelJS.FillPattern;
            if (fill.fgColor) {
              const bgColor = excelColorToHex(fill.fgColor);
              if (bgColor && bgColor !== '#FFFFFF' && bgColor !== '#FFFFFFFF') {
                newCellColors[key] = bgColor;
              }
            }
          }

          // FONT STYLES
          if (cell.font) {
            if (cell.font.bold) cellStyle.fontWeight = 'bold';
            if (cell.font.italic) cellStyle.fontStyle = 'italic';
            if (cell.font.underline) cellStyle.textDecoration = 'underline';
            if (cell.font.strike) cellStyle.textDecoration = 'line-through';
            
            if (cell.font.color) {
              const fontColor = excelColorToHex(cell.font.color);
              if (fontColor && fontColor !== '#000000') {
                cellStyle.color = fontColor;
              }
            }
            
            if (cell.font.size) {
              cellStyle.fontSize = `${Math.round(cell.font.size * 1.33)}px`;
            }
            
            if (cell.font.name) {
              cellStyle.fontFamily = cell.font.name;
            }
          }

          // ALIGNMENT - IMPROVED
          if (cell.alignment) {
            // Horizontal alignment
            if (cell.alignment.horizontal) {
              const hMap: Record<string, string> = {
                'left': 'left',
                'center': 'center',
                'right': 'right',
                'fill': 'left',
                'justify': 'justify',
                'centerContinuous': 'center',
                'distributed': 'justify'
              };
              cellStyle.textAlign = hMap[cell.alignment.horizontal] || 'left';
            }

            // Vertical alignment
            if (cell.alignment.vertical) {
              const vMap: Record<string, string> = {
                'top': 'flex-start',
                'middle': 'center',
                'bottom': 'flex-end'
              };
              cellStyle.verticalAlign = vMap[cell.alignment.vertical] || 'flex-end';
            }

            // Text wrapping
            if (cell.alignment.wrapText) {
              cellStyle.whiteSpace = 'pre-wrap';
              cellStyle.wordWrap = 'break-word';
            }

            // Text rotation
            if (cell.alignment.textRotation !== undefined && cell.alignment.textRotation !== 0) {
              cellStyle.transform = `rotate(${cell.alignment.textRotation}deg)`;
            }

            // Indent
            if (cell.alignment.indent) {
              cellStyle.paddingLeft = `${cell.alignment.indent * 10}px`;
            }
          }

          // BORDERS
          if (cell.border) {
            const convertBorder = (border: Partial<ExcelJS.Border> | undefined) => {
              if (!border || !border.style) return null;
              
              const styleMap: Record<string, string> = {
                'thin': '1px solid', 'medium': '2px solid', 'thick': '3px solid',
                'dashed': '1px dashed', 'dotted': '1px dotted', 'double': '3px double',
                'hair': '0.5px solid', 'dashDot': '1px dashed', 'dashDotDot': '1px dashed',
                'slantDashDot': '2px dashed', 'mediumDashed': '2px dashed',
                'mediumDashDot': '2px dashed', 'mediumDashDotDot': '2px dashed',
              };
              
              const borderWidth = styleMap[border.style] || '1px solid';
              const borderColor = border.color ? excelColorToHex(border.color) || '#000000' : '#000000';
              
              return `${borderWidth} ${borderColor}`;
            };

            if (cell.border.top) {
              const border = convertBorder(cell.border.top);
              if (border) cellStyle.borderTop = border;
            }
            if (cell.border.bottom) {
              const border = convertBorder(cell.border.bottom);
              if (border) cellStyle.borderBottom = border;
            }
            if (cell.border.left) {
              const border = convertBorder(cell.border.left);
              if (border) cellStyle.borderLeft = border;
            }
            if (cell.border.right) {
              const border = convertBorder(cell.border.right);
              if (border) cellStyle.borderRight = border;
            }
          }

          // Save styles
          if (Object.keys(cellStyle).length > 0) {
            newCellStyles[key] = cellStyle;
          }
        }
      }

      // === EXTRACT MERGED CELLS ===
      if (worksheet.model.merges) {
        worksheet.model.merges.forEach((merge: string) => {
          const [start, end] = merge.split(':');
          const startCell = worksheet.getCell(start);
          const endCell = worksheet.getCell(end);
          
          mergeCells.push({
            row: startCell.row - 1,
            col: startCell.col - 1,
            rowspan: endCell.row - startCell.row + 1,
            colspan: endCell.col - startCell.col + 1,
          });
        });
      }

      console.log('✅ Extraction complete:', {
        worksheetRows: actualMaxRow,
        worksheetCols: actualMaxCol,
        usedRows: usedMaxRow,
        usedCols: usedMaxCol,
        totalRows: jsonData.length,
        totalCols: jsonData[0]?.length || 0,
        colors: Object.keys(newCellColors).length,
        styles: Object.keys(newCellStyles).length,
        merges: mergeCells.length,
      });

      // === APPLY TO HANDSONTABLE ===
      console.log('🎯 Applying to Handsontable...');
      console.log('📊 Sample data (first 3 cells):', {
        '0,0': jsonData[0]?.[0],
        '0,1': jsonData[0]?.[1],
        '1,0': jsonData[1]?.[0],
        '1,1': jsonData[1]?.[1],
      });

      // Update state - ALL at once
      setImportedData(jsonData);
      setImportedMergeCells(mergeCells);
      setCellColors(newCellColors);
      setCellStyles(newCellStyles);
      setHotTableKey(prev => prev + 1);

      console.log('✅ Import complete!');

      alert(
        `✅ Import Excel Berhasil!\n\n` +
        `📊 Worksheet: ${actualMaxRow} baris × ${actualMaxCol} kolom\n` +
        `✈️ Data Terpakai: ${usedMaxRow} baris × ${usedMaxCol} kolom\n` +
        `📦 Tabel Dibuat: ${jsonData.length} baris × ${jsonData[0]?.length || 0} kolom\n` +
        `🔗 Merge Cells: ${mergeCells.length}\n` +
        `🎨 Background Colors: ${Object.keys(newCellColors).length}\n` +
        `💅 Cell Styles: ${Object.keys(newCellStyles).length}\n\n` +
        `⚠️ Klik "Simpan" untuk menyimpan perubahan!`
      );

      setIsDirty(true);
      importFinishedRef.current = true;
      setIsImporting(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('❌ Error importing Excel:', error);
      setIsImporting(false);
      alert('❌ Gagal import: ' + (error as Error).message);
    }
  };

  const handleSaveTable = async () => {
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

      try {
        const completeTableState = {
          data,
          mergeCells,
          cellColors,
          cellStyles
        };

        const tableStateJson = JSON.stringify(completeTableState);

        console.log('💾 Saving:', {
          rows: data.length,
          colors: Object.keys(cellColors).length,
          styles: Object.keys(cellStyles).length,
          merges: mergeCells.length,
          size: (tableStateJson.length / 1024).toFixed(2) + ' KB'
        });

        const currentUser = getCurrentUser();

        if (!currentUser || !currentUser._id) {
          alert("❌ Sesi berakhir. Login ulang.");
          router.push('/login');
          return;
        }

        if (selectedKPI) {
          await updateKPI({
            year: selectedYear,
            tableState: tableStateJson,
            userId: currentUser._id as any,
          });
        } else {
          await createKPI({
            year: selectedYear,
            name: `KPI Annual ${selectedYear}`,
            tableState: tableStateJson,
            userId: currentUser._id as any,
          });
        }

        setIsDirty(false);
        alert("✅ Data berhasil disimpan!");
      } catch (error) {
        console.error("Error saving:", error);
        alert("❌ Gagal menyimpan: " + (error as Error).message);
      }
    }
  };

  const handleExportExcel = () => {
    if (hotTableRef.current) {
      const exportPlugin = hotTableRef.current.hotInstance.getPlugin('exportFile');
      exportPlugin.downloadFile('csv', {
        filename: `KPI_${selectedYear}_${new Date().toISOString().split('T')[0]}`,
        columnHeaders: true,
        rowHeaders: true,
      });
    }
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 50));
  };

  const handleZoomReset = () => {
    setZoomLevel(100);
  };

  const handleFontSizeIncrease = () => {
    setGlobalFontSize(prev => Math.min(prev + 1, 24));
  };

  const handleFontSizeDecrease = () => {
    setGlobalFontSize(prev => Math.max(prev - 1, 8));
  };

  const handleFontSizeReset = () => {
    setGlobalFontSize(13);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-[1900px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
              KPI Annual Management
            </h1>
            <p className="text-slate-600 mt-2 text-lg">
              Import Excel dengan akurasi 100% - semua format, warna, dan merge cells tersimpan
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="default"
              className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              onClick={() => setIsNewKPIModalOpen(true)}
            >
              <IconPlus className="h-4 w-4" />
              Buat KPI Baru
            </Button>
            <Button
              variant="outline"
              className="gap-2 border-green-200 hover:bg-green-50"
              onClick={handleExportExcel}
            >
              <IconTableExport className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Year Selector */}
        <Card className="p-5 border-blue-200 shadow-lg bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <Label className="text-sm font-bold whitespace-nowrap text-slate-700">Pilih Tahun:</Label>
            <Select value={selectedYear} onValueChange={handleSelectKPI}>
              <SelectTrigger className="w-[300px] border-blue-200">
                <SelectValue placeholder="Pilih tahun" />
              </SelectTrigger>
              <SelectContent>
                {allYears?.map((kpi) => (
                  <SelectItem key={kpi.year} value={kpi.year}>
                    {kpi.name} ({kpi.year})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedKPI && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-900 border-blue-200">
                📅 {selectedKPI.year} - {selectedKPI.name}
              </Badge>
            )}
          </div>
        </Card>

        {/* Main Content */}
        {isLoadingYear || isLoadingConvexData ? (
          <Card className="border-blue-200 shadow-xl bg-white">
            <div className="p-20 flex flex-col items-center justify-center">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="mt-6 text-lg font-semibold text-slate-700">Memuat data...</p>
            </div>
          </Card>
        ) : selectedKPI && !isNewKPIModalOpen ? (
          <Card className="border-blue-200 shadow-xl bg-white" style={{ overflow: 'visible' }}>
            {/* Toolbar */}
            <div className="border-b border-blue-200 bg-slate-50 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-sm font-semibold text-slate-700">🎨 Format Tools</div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleImportExcel}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-700"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <IconUpload className="h-4 w-4" />
                    Upload Excel
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  {/* Zoom Controls */}
                  <div className="flex items-center gap-1 border border-blue-200 rounded-lg p-1 bg-white">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-blue-50"
                      onClick={handleZoomOut}
                      title="Zoom Out"
                    >
                      <IconZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-semibold text-slate-700 min-w-[50px] text-center">
                      {zoomLevel}%
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-blue-50"
                      onClick={handleZoomIn}
                      title="Zoom In"
                    >
                      <IconZoomIn className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-blue-50"
                      onClick={handleZoomReset}
                      title="Reset Zoom"
                    >
                      <IconZoomReset className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Font Size Controls */}
                  <div className="flex items-center gap-1 border border-blue-200 rounded-lg p-1 bg-white">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-blue-50"
                      onClick={handleFontSizeDecrease}
                      title="Decrease Font Size"
                    >
                      <span className="text-sm font-bold">A-</span>
                    </Button>
                    <span className="text-sm font-semibold text-slate-700 min-w-[45px] text-center">
                      {globalFontSize}px
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-blue-50"
                      onClick={handleFontSizeIncrease}
                      title="Increase Font Size"
                    >
                      <span className="text-sm font-bold">A+</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-blue-50 text-xs"
                      onClick={handleFontSizeReset}
                      title="Reset Font Size"
                    >
                      <span className="text-lg font-bold leading-none">↺</span>
                    </Button>
                  </div>

                  <Button
                    variant="default"
                    size="sm"
                    className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    onClick={handleSaveTable}
                  >
                    <IconDeviceFloppy className="h-4 w-4" />
                    Simpan
                  </Button>
                </div>
              </div>

              {/* Color Tools */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-semibold text-slate-700">🎨 BG:</span>
                <div className="flex gap-1">
                  {['#FCC900', '#00FF00', '#0000FF', '#4F46E5', '#EC4899', '#FF0000', '#9333EA', '#F97316', '#FFFFFF', '#000000'].map((color) => (
                    <button
                      key={color}
                      onClick={() => applyColorToCells(color)}
                      className="w-6 h-6 rounded border border-slate-300 hover:scale-110 transition-all"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <button onClick={clearCellColors} className="px-2 py-1 text-xs border rounded hover:bg-slate-200">
                    ❌
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-semibold text-slate-700">✏️ Text:</span>
                <div className="flex gap-1">
                  {['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FCC900', '#9333EA', '#EC4899', '#F97316'].map((color) => (
                    <button
                      key={color}
                      onClick={() => applyTextColorToCells(color)}
                      className="w-6 h-6 rounded border flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: color === '#FFFFFF' ? '#f3f4f6' : '#fff', color }}
                    >
                      A
                    </button>
                  ))}
                </div>

                <div className="w-px h-6 bg-slate-300 mx-2"></div>

                <span className="text-xs font-semibold text-slate-700">🔲 Border:</span>
                <div className="flex gap-1">
                  {[
                    { border: '1px solid #000000', name: 'Thin' },
                    { border: '2px solid #000000', name: 'Med' },
                    { border: '3px solid #000000', name: 'Thick' },
                    { border: '2px dashed #000000', name: 'Dash' },
                    { border: '2px dotted #000000', name: 'Dot' },
                    { border: '4px double #000000', name: 'Dbl' },
                    { border: 'none', name: 'None' },
                  ].map(({ border, name }) => (
                    <button
                      key={name}
                      onClick={() => applyBorderToCells(border)}
                      className="px-2 py-1 text-xs border rounded hover:bg-slate-200 bg-white font-semibold"
                      style={{ border: border === 'none' ? '1px solid #d1d5db' : border }}
                    >
                      {name}
                    </button>
                  ))}
                  <button onClick={clearCellStyles} className="px-2 py-1 text-xs border border-red-300 text-red-600 rounded hover:bg-red-50">
                    🗑️
                  </button>
                </div>
              </div>
            </div>

            {/* Handsontable */}
            <div className="p-6" style={{ overflow: 'visible' }}>
              <div
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: 'top left',
                  width: `${10000 / zoomLevel}%`,
                  transition: 'transform 0.2s ease-in-out'
                }}
              >
                <HotTable
                  key={`${selectedYear}-${hotTableKey}-${globalFontSize}`}
                  ref={hotTableRef}
                  data={
                    importedData ||
                    (selectedKPI?.tableState
                      ? JSON.parse(selectedKPI.tableState).data
                      : Array.from({ length: 200 }, () => Array(50).fill("")))
                  }
                  colHeaders={true}
                  rowHeaders={true}
                  width="100%"
                  height={tableHeight}
                  licenseKey="non-commercial-and-evaluation"
                  mergeCells={
                    importedMergeCells.length > 0
                      ? importedMergeCells
                      : (selectedKPI?.tableState
                        ? JSON.parse(selectedKPI.tableState).mergeCells || []
                        : [])
                  }
                cells={(row, col) => {
                  const key = getCellKey(row, col);
                  const cellColor = cellColors[key];
                  const cellStyle = cellStyles[key];

                  return {
                    renderer: function(instance, td, row, col, prop, value, cellProperties) {
                      // Simply call the base renderer - it handles everything
                      Handsontable.renderers.TextRenderer(instance, td, row, col, prop, value, cellProperties);

                      // Apply global font size
                      td.style.fontSize = `${globalFontSize}px`;

                      // Apply custom styles AFTER the text is rendered
                      if (cellColor) {
                        td.style.backgroundColor = cellColor;
                      }

                      if (cellStyle) {
                        // Debug log for first few cells
                        if (row < 2 && col < 2) {
                          console.log(`🎨 Applying styles to (${row},${col}):`, cellStyle);
                        }

                        Object.entries(cellStyle).forEach(([prop, val]) => {
                          // Special handling for border - use !important to override Handsontable CSS
                          if (prop === 'border' && val !== 'none') {
                            td.style.setProperty('border', val as string, 'important');
                          } else if (prop === 'border' && val === 'none') {
                            td.style.setProperty('border', 'none', 'important');
                          } else if (prop === 'fontSize') {
                            // Skip fontSize from cellStyle if we want to use global font size
                            // Or apply it if the cell has custom font size
                            td.style.fontSize = val;
                          } else {
                            // Direct style assignment for other properties
                            td.style[prop as any] = val;
                          }
                        });

                        // Verify border was applied
                        if (row < 2 && col < 2 && cellStyle.border) {
                          console.log(`✅ Border applied to (${row},${col}):`, {
                            border: cellStyle.border,
                            tdBorder: td.style.border,
                            tdCssText: td.style.cssText,
                          });
                        }
                      }
                    }
                  };
                }}
                contextMenu={{
                  items: {
                    'row_above': {}, 'row_below': {}, 'col_left': {}, 'col_right': {},
                    'remove_row': {}, 'remove_col': {}, 'undo': {}, 'redo': {},
                    'make_read_only': {}, 'alignment': {}, 'mergeCells': {},
                  }
                }}
                manualColumnResize={true}
                manualRowResize={true}
                autoWrapRow={true}
                autoWrapCol={true}
                fillHandle={true}
                stretchH="all"
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
                afterOnCellMouseDown={(event, coords) => {
                  // Log selection for debugging
                  if (coords && coords.row < 3 && coords.col < 3) {
                    console.log('🖱️ Mouse down on cell:', coords);
                  }
                }}
                />
              </div>
            </div>
          </Card>
        ) : (
          <Card className="border-blue-200 shadow-xl bg-gradient-to-br from-slate-50 to-blue-50">
            <div className="p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <IconPlus className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3">Belum Ada KPI Dipilih</h2>
                <p className="text-slate-600 mb-6">Buat KPI baru atau pilih yang sudah ada</p>
                <Button
                  onClick={() => setIsNewKPIModalOpen(true)}
                  className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <IconPlus className="h-4 w-4" />
                  Buat KPI Baru
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Modal */}
      {isNewKPIModalOpen && (
        <NewKPIModal
          onClose={() => setIsNewKPIModalOpen(false)}
          onSave={handleCreateKPI}
          selectedYear={selectedYear}
          currentYear={currentYear}
        />
      )}

      {/* Styles */}
      <style jsx global>{`
        .htCore thead th {
          background: linear-gradient(135deg, #3B82F6 0%, #6366F1 100%) !important;
          color: white !important;
          font-weight: 600 !important;
        }
        .htCore tbody th {
          background: #f1f5f9 !important;
          font-weight: 500 !important;
        }
        .htCore td {
          border-color: #e2e8f0 !important;
        }
      `}</style>
      <style jsx global>{`
        .htCore td, .htCore thead th, .htCore tbody th {
          font-size: ${globalFontSize}px !important;
        }
      `}</style>
    </div>
  );
}

function NewKPIModal({
  onClose,
  onSave,
  selectedYear,
  currentYear,
}: {
  onClose: () => void;
  onSave: (year: string, name: string) => void;
  selectedYear: string;
  currentYear: string;
}) {
  const [year, setYear] = useState(selectedYear || currentYear);
  const [name, setName] = useState("");

  const years = Array.from({ length: 10 }, (_, i) => {
    const y = new Date().getFullYear() - 5 + i;
    return y.toString();
  });

  const handleSave = () => {
    if (!name || !year) {
      alert("Mohon isi semua field");
      return;
    }
    onSave(year, name);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl p-6 space-y-4 shadow-2xl border-blue-200">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-900 to-indigo-900 bg-clip-text text-transparent">
          Buat KPI Baru
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-slate-700 font-semibold">Nama KPI</Label>
            <Input
              placeholder="Contoh: KPI Sales 2025"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-blue-200"
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
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={handleSave} className="bg-gradient-to-r from-blue-600 to-indigo-600">
            Buat KPI
          </Button>
        </div>
      </Card>
    </div>
  );
}
