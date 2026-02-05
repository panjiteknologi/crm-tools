"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconUpload, IconFileExcel } from "@tabler/icons-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ExcelViewer } from "@/components/excel-viewer";

export default function KPIPerformancePage() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedKPI, setSelectedKPI] = useState<any | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Fetch KPI data
  const kpis = useQuery(api.kpiPerformance.list, {});
  const kpisByYear = useQuery(api.kpiPerformance.getByYear, {
    year: selectedYear,
  });

  const displayKpis = selectedYear === "all"
    ? (kpis ?? [])
    : (kpisByYear ?? []);

  const currentKPI = selectedKPI || displayKpis?.[0] || null;

  const years = Array.from({ length: 10 }, (_, i) => {
    const y = new Date().getFullYear() - 5 + i;
    return y.toString();
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 dark:from-slate-950 dark:to-slate-900 p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-green-900 to-emerald-900 dark:from-slate-50 dark:via-green-50 dark:to-emerald-50 bg-clip-text text-transparent">
              KPI Performance
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2 text-lg">
              View file Excel KPI Performance per tahun
            </p>
          </div>
          <Button
            onClick={() => setIsUploadModalOpen(true)}
            className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            <IconUpload className="h-4 w-4" />
            Upload KPI Excel
          </Button>
        </div>

        {/* Filter Section */}
        <Card className="p-4 border-green-200 dark:border-slate-800 shadow-lg bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-700">Filter:</span>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-[200px] border-green-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tahun</SelectItem>
                    {years.map((y) => (
                      <SelectItem key={y} value={y}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {displayKpis.length > 0 && (
                <>
                  <span className="text-slate-400">|</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-700">File:</span>
                    <Select
                      value={currentKPI?._id || ""}
                      onValueChange={(val) => {
                        const kpi = displayKpis.find((k: any) => k._id === val);
                        setSelectedKPI(kpi);
                      }}
                    >
                      <SelectTrigger className="w-[400px] border-green-200">
                        <SelectValue placeholder="Pilih file KPI" />
                      </SelectTrigger>
                      <SelectContent>
                        {displayKpis.map((kpi: any) => (
                          <SelectItem key={kpi._id} value={kpi._id}>
                            <div className="flex items-center gap-2">
                              <IconFileExcel className="h-4 w-4 text-green-600" />
                              <span>{kpi.fileName}</span>
                              <span className="text-xs text-slate-500">({new Date(kpi.uploadedAt).toLocaleDateString("id-ID")})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>

            {currentKPI && (
              <div className="text-sm text-slate-600">
                📁 {currentKPI.fileName} | 👤 {currentKPI.uploadedBy}
              </div>
            )}
          </div>
        </Card>

        {/* Excel Viewer */}
        {currentKPI ? (
          <Card className="overflow-hidden shadow-xl border-green-200 dark:border-slate-800 bg-white">
            <div className="p-4 border-b border-green-200 bg-green-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconFileExcel className="h-5 w-5 text-green-600" />
                  <h3 className="font-bold text-slate-900">{currentKPI.fileName}</h3>
                </div>
                <a
                  href={currentKPI.fileUrl}
                  download={currentKPI.fileName}
                  className="text-sm text-green-600 hover:text-green-700 underline"
                >
                  ⬇️ Download
                </a>
              </div>
            </div>
            <div className="w-full" style={{ height: "calc(100vh - 350px)" }}>
              <ExcelViewer fileUrl={currentKPI.fileUrl} fileName={currentKPI.fileName} />
            </div>
          </Card>
        ) : (
          <Card className="p-12 border-dashed border-2 border-slate-300">
            <div className="text-center text-slate-500">
              <IconFileExcel className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-semibold">Belum ada KPI untuk ditampilkan</p>
              <p className="text-sm mt-2">
                {displayKpis.length === 0
                  ? "Klik tombol 'Upload KPI Excel' untuk menambahkan"
                  : "Pilih file KPI dari dropdown di atas"
                }
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <UploadModal
          onClose={() => setIsUploadModalOpen(false)}
          onSuccess={() => {
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

function UploadModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const years = Array.from({ length: 10 }, (_, i) => {
    const y = new Date().getFullYear() - 5 + i;
    return y.toString();
  });

  const handleUpload = async () => {
    if (!year || !file) {
      alert("Mohon pilih tahun dan file Excel!");
      return;
    }

    setIsUploading(true);

    try {
      // Convert file to base64 untuk disimpan di Convex
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;

        // Simpan ke Convex dengan base64 data
        await fetch("/api/kpi-performance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            year,
            fileName: file.name,
            fileUrl: `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64.split(',')[1]}`,
            uploadedBy: "Admin",
          }),
        });

        alert("✅ File berhasil diupload!");
        onSuccess();
        onClose();
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Upload error:", error);
      alert("❌ Gagal mengupload file!");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6 space-y-4 shadow-2xl border-green-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-2 rounded-lg">
            <IconUpload className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-green-900 to-emerald-900 bg-clip-text text-transparent">
            Upload KPI Excel
          </h2>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Tahun</label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="border-green-200">
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
          <label className="text-sm font-semibold text-slate-700">File Excel</label>
          <Input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="border-green-200"
          />
          {file && (
            <p className="text-xs text-green-600">
              ✅ {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isUploading}
            className="border-slate-300"
          >
            Batal
          </Button>
          <Button
            onClick={handleUpload}
            disabled={isUploading || !file}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            {isUploading ? "⏳ Uploading..." : "Upload"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
