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
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";

// Register ALL Handsontable modules for full Excel features
registerAllModules();

interface KPIWithYear {
  year: string;
  name: string;
  createdAt: number;
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
  const router = useRouter();
  const hotTableRef = useRef(null);
  const selectedCellsRef = useRef<any[]>([]);
  const [cellColors, setCellColors] = useState<Record<string, string>>({});
  const [cellStyles, setCellStyles] = useState<Record<string, any>>({});
  const currentYear = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);
  const [isDirty, setIsDirty] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isNewKPIModalOpen, setIsNewKPIModalOpen] = useState(false);
  const [isLoadingYear, setIsLoadingYear] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    const userStr = localStorage.getItem('crm_user');
    if (!userStr) {
      router.push('/login');
    }
  }, [router]);

  // Get current user
  const getCurrentUser = () => {
    const userStr = localStorage.getItem('crm_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  };

  // Convex queries
  const allYears = useQuery(api.kpiAnnual.getAllYears);
  const selectedKPI = useQuery(api.kpiAnnual.getByYear, { year: selectedYear });

  // Track if Convex is still loading data
  const isLoadingConvexData = selectedKPI === undefined;

  // Convex mutations
  const updateKPI = useMutation(api.kpiAnnual.update);
  const createKPI = useMutation(api.kpiAnnual.create);

  // Handle create new KPI
  const handleCreateKPI = async (year: string, name: string) => {
    try {
      // Get current user from localStorage
      const currentUser = getCurrentUser();
      if (!currentUser) {
        alert("❌ Anda belum login. Silakan login terlebih dahulu.");
        router.push('/login');
        return;
      }

      // Check if user has _id
      if (!currentUser._id) {
        alert("❌ Data user tidak valid. Silakan login ulang.");
        router.push('/login');
        return;
      }

      // Set loading state
      setIsLoadingYear(true);

      // Check if user is authenticated by attempting the mutation
      await createKPI({
        year,
        name,
        data: Array.from({ length: 200 }, () => Array(50).fill("")), // Empty 200x50 grid
        mergeCells: [],
        cellColors: {},
        cellStyles: JSON.stringify({}),
        userId: currentUser._id as any, // Pass userId from localStorage
      });

      setSelectedYear(year);
      setIsNewKPIModalOpen(false);

      // Turn off loading after a short delay
      setTimeout(() => {
        setIsLoadingYear(false);
      }, 500);

      alert(`✅ KPI "${name}" untuk tahun ${year} berhasil dibuat!`);
    } catch (error: any) {
      console.error("Error creating KPI:", error);

      // Turn off loading state on error
      setIsLoadingYear(false);

      // Handle specific errors
      if (error.message.includes("Unauthorized") || error.message.includes("User not found")) {
        alert("❌ Sesi Anda telah berakhir. Silakan login ulang.");
        router.push('/login');
      } else if (error.message.includes("sudah ada")) {
        alert("❌ " + error.message);
      } else {
        alert("❌ Gagal membuat KPI: " + error.message);
      }
    }
  };

  // Select KPI from dropdown
  const handleSelectKPI = (year: string) => {
    // Only show loading if actually changing years
    if (year !== selectedYear) {
      setIsLoadingYear(true);
    }
    setSelectedYear(year);
  };

  const applyColorToCells = (color: string) => {
    if (!hotTableRef.current) return;
    const hotInstance = hotTableRef.current.hotInstance;

    if (!hotInstance || !hotInstance.isWorking) {
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
          newColors[key] = color;
        }
      }
    });

    setCellColors(newColors);

    setTimeout(() => {
      if (hotTableRef.current && hotInstance.isWorking) {
        try {
          hotInstance.render();
        } catch (error) {
          console.error('Error rendering after color change:', error);
        }
      }
    }, 0);
  };

  const applyTextColorToCells = (color: string) => {
    if (!hotTableRef.current) return;
    const hotInstance = hotTableRef.current.hotInstance;

    if (!hotInstance || !hotInstance.isWorking) {
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

    setCellStyles(newStyles);

    setTimeout(() => {
      if (hotTableRef.current && hotInstance.isWorking) {
        try {
          hotInstance.render();
        } catch (error) {
          console.error('Error rendering after text color change:', error);
        }
      }
    }, 0);
  };

  const applyBorderToCells = (borderStyle: string) => {
    if (!hotTableRef.current) return;
    const hotInstance = hotTableRef.current.hotInstance;

    if (!hotInstance || !hotInstance.isWorking) {
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
          // Apply border with !important to override Handsontable defaults
          newStyles[key].border = borderStyle;
          newStyles[key].borderColor = '#000000';
        }
      }
    });

    setCellStyles(newStyles);

    setTimeout(() => {
      if (hotTableRef.current && hotInstance.isWorking) {
        try {
          hotInstance.render();
        } catch (error) {
          console.error('Error rendering after border change:', error);
        }
      }
    }, 0);
  };

  const clearCellColors = () => {
    if (!hotTableRef.current) return;
    const hotInstance = hotTableRef.current.hotInstance;

    if (!hotInstance || !hotInstance.isWorking) {
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

    setCellColors(newColors);

    setTimeout(() => {
      if (hotTableRef.current && hotInstance.isWorking) {
        try {
          hotInstance.render();
        } catch (error) {
          console.error('Error rendering after clearing colors:', error);
        }
      }
    }, 0);
  };

  const clearCellStyles = () => {
    if (!hotTableRef.current) return;
    const hotInstance = hotTableRef.current.hotInstance;

    if (!hotInstance || !hotInstance.isWorking) {
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

    setCellStyles(newStyles);

    setTimeout(() => {
      if (hotTableRef.current && hotInstance.isWorking) {
        try {
          hotInstance.render();
        } catch (error) {
          console.error('Error rendering after clearing styles:', error);
        }
      }
    }, 0);
  };

  // Load KPI data when switching years
  useEffect(() => {
    let isMounted = true;

    // Turn off loading when Convex data is fully loaded (not undefined anymore)
    if (!isLoadingConvexData && isLoadingYear) {
      setIsLoadingYear(false);
    }

    // If KPI data exists and is loaded
    if (selectedKPI) {
      if (hotTableRef.current) {
        const hotInstance = hotTableRef.current.hotInstance;

        // Check if instance is still valid
        if (!hotInstance || !hotInstance.isWorking) {
          return;
        }

        // Load data
        hotInstance.loadData(selectedKPI.data);
        setCellColors(selectedKPI.cellColors || {});

        // Parse cellStyles from JSON string
        if (selectedKPI.cellStyles) {
          try {
            const parsedStyles = JSON.parse(selectedKPI.cellStyles);
            setCellStyles(parsedStyles);
          } catch (error) {
            console.error('Error parsing cellStyles:', error);
            setCellStyles({});
          }
        } else {
          setCellStyles({});
        }

        // Apply merge cells
        setTimeout(() => {
          // Double check if instance is still valid and component is mounted
          if (!isMounted || !hotTableRef.current || !hotInstance || !hotInstance.isWorking) {
            return;
          }

          if (selectedKPI.mergeCells && selectedKPI.mergeCells.length > 0) {
            const mergeCellsPlugin = hotInstance.getPlugin('mergeCells');
            if (mergeCellsPlugin) {
              mergeCellsPlugin.mergedCellsCollection.mergedCells = [];

              selectedKPI.mergeCells.forEach((merge: any) => {
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

          try {
            hotInstance.render();
          } catch (error) {
            console.error('Error rendering Handsontable:', error);
          }
        }, 100);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [selectedKPI, selectedYear, isLoadingYear, isLoadingConvexData]);

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

              // Save to Convex
              const cellStylesJson = JSON.stringify(newCellStyles);
              const currentUser = getCurrentUser();

              if (!currentUser || !currentUser._id) {
                alert("❌ Sesi Anda telah berakhir. Silakan login ulang.");
                router.push('/login');
                return;
              }

              if (selectedKPI) {
                // Update existing KPI
                updateKPI({
                  year: selectedYear,
                  data: jsonData,
                  mergeCells,
                  cellColors: newCellColors,
                  cellStyles: cellStylesJson,
                  userId: currentUser._id as any,
                });
              } else {
                // Create new KPI for this year
                createKPI({
                  year: selectedYear,
                  name: `KPI Annual ${selectedYear}`,
                  data: jsonData,
                  mergeCells,
                  cellColors: newCellColors,
                  cellStyles: cellStylesJson,
                  userId: currentUser._id as any,
                });
              }

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
        const cellStylesJson = JSON.stringify(cellStyles);
        const currentUser = getCurrentUser();

        if (!currentUser || !currentUser._id) {
          alert("❌ Sesi Anda telah berakhir. Silakan login ulang.");
          router.push('/login');
          return;
        }

        if (selectedKPI) {
          // Update existing KPI
          await updateKPI({
            year: selectedYear,
            data,
            mergeCells,
            cellColors,
            cellStyles: cellStylesJson,
            userId: currentUser._id as any,
          });
        } else {
          // Create new KPI
          await createKPI({
            year: selectedYear,
            name: `KPI Annual ${selectedYear}`,
            data,
            mergeCells,
            cellColors,
            cellStyles: cellStylesJson,
            userId: currentUser._id as any,
          });
        }

        setIsDirty(false);
        alert("✅ Data berhasil disimpan!");
      } catch (error) {
        console.error("Error saving KPI:", error);
        alert("❌ Gagal menyimpan data: " + (error as Error).message);
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
              Kelola Key Performance Indicator tahunan per divisi (1 KPI per tahun) - Bisa copy-paste langsung dari Excel
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="default"
              size="default"
              className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 cursor-pointer"
              onClick={() => setIsNewKPIModalOpen(true)}
            >
              <IconPlus className="h-4 w-4" />
              Buat KPI Baru
            </Button>
            <Button
              variant="outline"
              size="default"
              className="gap-2 border-blue-200 hover:bg-blue-50 cursor-pointer"
              onClick={handleSaveTable}
            >
              <IconDeviceFloppy className="h-4 w-4" />
              Simpan
            </Button>
            <Button
              variant="outline"
              size="default"
              className="gap-2 border-green-200 hover:bg-green-50 cursor-pointer"
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
                <h3 className="text-lg font-bold text-slate-900">Import dari Excel atau Copy-Paste</h3>
                <p className="text-sm text-slate-600">
                  ✨ <strong>2 Cara Input Data:</strong> 1) Upload file Excel, atau 2) Copy dari Excel & paste langsung ke tabel
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
                className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <IconUpload className="h-5 w-5" />
                Upload Excel
              </Button>
            </div>
          </div>
        </Card>

        {/* Year Selector */}
        <Card className="p-5 border-blue-200 dark:border-slate-800 shadow-lg bg-white/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <Label className="text-sm font-bold whitespace-nowrap text-slate-700">Pilih Tahun KPI:</Label>
              <Select value={selectedYear} onValueChange={handleSelectKPI}>
                <SelectTrigger className="w-[300px] border-blue-200">
                  <SelectValue placeholder="Pilih tahun KPI" />
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
                <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-900 border-blue-200">
                  📅 {selectedKPI.year} - {selectedKPI.name}
                </Badge>
              )}
            </div>
          </div>
        </Card>

        {/* KPI Data Grid - Handsontable with Excel-like Toolbar */}
        {isLoadingYear || isLoadingConvexData ? (
          /* Loading State */
          <Card className="border-blue-200 dark:border-slate-800 shadow-xl bg-white">
            <div className="p-20 flex flex-col items-center justify-center">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
              <p className="mt-6 text-lg font-semibold text-slate-700">Memuat data KPI...</p>
              <p className="text-sm text-slate-500 mt-2">Mohon tunggu sebentar</p>
            </div>
          </Card>
        ) : selectedKPI && !isNewKPIModalOpen ? (
          <Card className="border-blue-200 dark:border-slate-800 overflow-hidden shadow-xl bg-white">
            {/* Excel-like Toolbar */}
            <div className="border-b border-blue-200 bg-slate-50 p-3 space-y-3">
              {/* Background Color */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">🎨 BG:</span>
                <div className="flex gap-1 flex-wrap">
                  {[
                    { color: '#FCC900' }, { color: '#00FF00' }, { color: '#0000FF' },
                    { color: '#4F46E5' }, { color: '#EC4899' }, { color: '#FF0000' },
                    { color: '#9333EA' }, { color: '#F97316' }, { color: '#FFFFFF' },
                    { color: '#000000' },
                  ].map(({ color }) => (
                    <button
                      key={color}
                      onClick={() => applyColorToCells(color)}
                      className="w-6 h-6 rounded border border-slate-300 hover:scale-110 transition-all hover:border-slate-500 cursor-pointer"
                      style={{ backgroundColor: color }}
                      title="Background color"
                    />
                  ))}
                  <button
                    onClick={clearCellColors}
                    className="px-2 py-1 text-xs border border-slate-300 rounded hover:bg-slate-200 transition-colors cursor-pointer"
                    title="Clear background"
                  >
                    ❌
                  </button>
                </div>
              </div>

              {/* Text Color & Border */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">✏️ Text:</span>
                <div className="flex gap-1 flex-wrap">
                  {[
                    { color: '#000000' }, { color: '#FFFFFF' }, { color: '#FF0000' },
                    { color: '#00FF00' }, { color: '#0000FF' }, { color: '#FCC900' },
                    { color: '#9333EA' }, { color: '#EC4899' }, { color: '#F97316' },
                  ].map(({ color }) => (
                    <button
                      key={color}
                      onClick={() => applyTextColorToCells(color)}
                      className="w-6 h-6 rounded border border-slate-300 hover:scale-110 transition-all hover:border-slate-500 flex items-center justify-center text-[10px] font-bold cursor-pointer"
                      style={{ backgroundColor: color === '#FFFFFF' ? '#f3f4f6' : '#ffffff', color }}
                      title="Text color"
                    >
                      A
                    </button>
                  ))}
                </div>

                <div className="w-px h-6 bg-slate-300 mx-2"></div>

                <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">🔲 Border:</span>
                <div className="flex gap-1 flex-wrap">
                  {[
                    { border: '0.1px solid #b8b8b8', name: 'Thin' },
                    { border: '1px solid #b8b8b8', name: 'Med' },
                    { border: '2px solid #b8b8b8', name: 'Thick' },
                    { border: '0.5px dashed #b8b8b8', name: 'Dash' },
                    { border: '1px dashed #b8b8b8', name: 'T.Dash' },
                    { border: '0.5px dotted #b8b8b8', name: 'Dot' },
                    { border: '2px double #b8b8b8', name: 'Dbl' },
                    { border: 'none', name: 'None' },
                  ].map(({ border, name }) => (
                    <button
                      key={name}
                      onClick={() => applyBorderToCells(border)}
                      className="px-2 py-1 text-xs border border-slate-300 rounded hover:bg-slate-200 transition-all bg-white font-semibold cursor-pointer"
                      style={{ border: border === 'none' ? '1px solid #d1d5db' : border }}
                      title={`Border: ${name}`}
                    >
                      {name}
                    </button>
                  ))}
                  <button
                    onClick={clearCellStyles}
                    className="px-2 py-1 text-xs border border-red-300 text-red-600 rounded hover:bg-red-50 transition-all bg-white font-semibold cursor-pointer"
                    title="Clear all styles"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              <HotTable
                key={selectedYear}
                ref={hotTableRef}
                data={selectedKPI?.data || Array.from({ length: 200 }, () => Array(50).fill(""))}
                id={`hotTable-${selectedYear}`}
                colHeaders={true}
                rowHeaders={true}
                width="100%"
                height={800}
                licenseKey="non-commercial-and-evaluation"
                mergeCells={selectedKPI?.mergeCells || []}
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
                        // Apply border with !important to override Handsontable defaults
                        if (styleProp === 'border') {
                          td.style.setProperty('border', styles[styleProp], 'important');
                        } else if (styleProp === 'borderColor') {
                          td.style.setProperty('border-color', styles[styleProp], 'important');
                        } else {
                          td.style[styleProp as any] = styles[styleProp];
                        }
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
        ) : (
          /* Empty State - No KPI Selected */
          <Card className="border-blue-200 dark:border-slate-800 shadow-xl bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
            <div className="p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <IconPlus className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-3">
                  Belum Ada KPI Dipilih
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Silakan buat KPI baru atau pilih tahun KPI yang sudah ada untuk mulai mengelola data.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={() => setIsNewKPIModalOpen(true)}
                    className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 cursor-pointer"
                  >
                    <IconPlus className="h-4 w-4" />
                    Buat KPI Baru
                  </Button>
                  {allYears && allYears.length > 0 && (
                    <Button
                      variant="outline"
                      className="gap-2 border-blue-200 hover:bg-blue-50 cursor-pointer"
                      onClick={() => {
                        const latestYear = allYears[0].year;
                        handleSelectKPI(latestYear);
                      }}
                    >
                      <IconTableExport className="h-4 w-4" />
                      Buka KPI {allYears[0].year}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Enhanced Instructions - Only show when KPI is selected */}
        {selectedKPI && (
          <Card className="p-6 border-blue-200 dark:border-slate-800 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950 dark:to-indigo-950 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="bg-blue-600 text-white p-3 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 dark:text-slate-50 mb-4 text-lg">
                🚀 Panduan Lengkap KPI Editor
              </h3>
              <div className="grid md:grid-cols-3 gap-6 text-sm text-slate-700 dark:text-slate-300">
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <span className="text-blue-600 font-bold">✨</span>
                    <div>
                      <strong className="text-slate-900">2 Cara Input Data:</strong>
                      <ul className="ml-4 mt-1 text-xs space-y-1">
                        <li>• Upload file Excel (support semua format)</li>
                        <li>• Copy dari Excel & paste langsung</li>
                        <li>• Support merge, warna, style</li>
                      </ul>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-blue-600 font-bold">🎨</span>
                    <div>
                      <strong className="text-slate-900">Background Color:</strong> Klik warna untuk set warna background cell
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <span className="text-indigo-600 font-bold">✏️</span>
                    <div>
                      <strong className="text-slate-900">Text Color:</strong> Ubah warna teks dalam cell
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-indigo-600 font-bold">🔲</span>
                    <div>
                      <strong className="text-slate-900">Border:</strong> Pilih style border (solid, dashed, dotted, double)
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <span className="text-purple-600 font-bold">💾</span>
                    <div>
                      <strong className="text-slate-900">Simpan:</strong> Klik "Simpan" untuk menyimpan semua perubahan
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-purple-600 font-bold">📤</span>
                    <div>
                      <strong className="text-slate-900">Export:</strong> Download sebagai CSV
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
        )}

        {/* Features Info - Only show when KPI is selected */}
        {selectedKPI && (
          <div className="grid md:grid-cols-4 gap-4">
          <Card className="p-4 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="text-blue-600 mb-2">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
            <h4 className="font-bold text-slate-900 mb-1">🎨 Background Color</h4>
            <p className="text-sm text-slate-700">10 warna untuk background cell</p>
          </Card>

          <Card className="p-4 border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100">
            <div className="text-indigo-600 mb-2">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <h4 className="font-bold text-slate-900 mb-1">✏️ Text Color</h4>
            <p className="text-sm text-slate-700">10 warna untuk teks dalam cell</p>
          </Card>

          <Card className="p-4 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
            <div className="text-purple-600 mb-2">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5z" />
              </svg>
            </div>
            <h4 className="font-bold text-slate-900 mb-1">🔲 Border Styles</h4>
            <p className="text-sm text-slate-700">8 style border (solid, dashed, dotted, double)</p>
          </Card>

          <Card className="p-4 border-pink-200 bg-gradient-to-br from-pink-50 to-pink-100">
            <div className="text-pink-600 mb-2">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h4 className="font-bold text-slate-900 mb-1">💾 Auto-Save</h4>
            <p className="text-sm text-slate-700">Semua format tersimpan permanen</p>
          </Card>
        </div>
        )}
      </div>

      {/* New KPI Modal */}
      {isNewKPIModalOpen && (
        <NewKPIModal
          onClose={() => setIsNewKPIModalOpen(false)}
          onSave={handleCreateKPI}
          selectedYear={selectedYear}
          currentYear={currentYear}
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
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
            <IconPlus className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-900 to-indigo-900 bg-clip-text text-transparent">
            Buat KPI Baru
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-slate-700 font-semibold">Nama KPI</Label>
            <Input
              placeholder="Contoh: KPI Sales Division 2025"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-blue-200 focus:border-blue-400 w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700 font-semibold">Tahun</Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="border-blue-200 w-full">
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
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose} className="border-slate-300 cursor-pointer">
            Batal
          </Button>
          <Button
            onClick={handleSave}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 cursor-pointer"
          >
            Buat KPI
          </Button>
        </div>
      </Card>
    </div>
  );
}
