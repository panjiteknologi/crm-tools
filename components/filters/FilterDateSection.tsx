import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FilterDateSectionProps {
  filterTahun: string;
  setFilterTahun: (value: string) => void;
  filterFromBulanExp: string;
  setFilterFromBulanExp: (value: string) => void;
  filterToBulanExp: string;
  setFilterToBulanExp: (value: string) => void;
  filterFromBulanTTD?: string;
  setFilterFromBulanTTD?: (value: string) => void;
  filterToBulanTTD?: string;
  setFilterToBulanTTD?: (value: string) => void;
  tahunOptions: string[];
  bulanOptions: Array<{ value: string; label: string }>;
}

export function FilterDateSection({
  filterTahun,
  setFilterTahun,
  filterFromBulanExp,
  setFilterFromBulanExp,
  filterToBulanExp,
  setFilterToBulanExp,
  filterFromBulanTTD,
  setFilterFromBulanTTD,
  filterToBulanTTD,
  setFilterToBulanTTD,
  tahunOptions,
  bulanOptions,
}: FilterDateSectionProps) {
  return (
    <>
      {/* Tahun */}
      <div>
        <Label className="mb-1.5 block text-xs font-semibold text-purple-900">Tahun</Label>
        <Select value={filterTahun} onValueChange={setFilterTahun}>
          <SelectTrigger className="w-full h-8 border-purple-200">
            <SelectValue placeholder="All Tahun" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tahun</SelectItem>
            {tahunOptions.map((tahun) => (
              <SelectItem key={tahun} value={tahun}>
                {tahun}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Section: Bulan Exp Date - BLUE THEME */}
      <div className="border border-blue-200 rounded-lg p-2 bg-blue-50/30 space-y-2">
        <div className="text-xs font-semibold text-blue-900 mb-1">📅 Bulan Exp Date</div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="mb-1 block text-[10px] text-blue-700">From</Label>
            <Select value={filterFromBulanExp} onValueChange={setFilterFromBulanExp}>
              <SelectTrigger className="w-full h-8 border-blue-200 text-xs">
                <SelectValue placeholder="From" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {bulanOptions.map((bulan) => (
                  <SelectItem key={bulan.value} value={bulan.value}>
                    {bulan.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1 block text-[10px] text-blue-700">To</Label>
            <Select value={filterToBulanExp} onValueChange={setFilterToBulanExp}>
              <SelectTrigger className="w-full h-8 border-blue-200 text-xs">
                <SelectValue placeholder="To" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {bulanOptions.map((bulan) => (
                  <SelectItem key={bulan.value} value={bulan.value}>
                    {bulan.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Section: Bulan TTD Notif - ORANGE THEME */}
      {(filterFromBulanTTD !== undefined || filterToBulanTTD !== undefined) && (
        <div className="border border-orange-200 rounded-lg p-2 bg-orange-50/30 space-y-2">
          <div className="text-xs font-semibold text-orange-900 mb-1">✍️ Bulan TTD Notif</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="mb-1 block text-[10px] text-orange-700">From</Label>
              <Select value={filterFromBulanTTD || 'all'} onValueChange={setFilterFromBulanTTD || (() => {})}>
                <SelectTrigger className="w-full h-8 border-orange-200 text-xs">
                  <SelectValue placeholder="From" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {bulanOptions.map((bulan) => (
                    <SelectItem key={bulan.value} value={bulan.value}>
                      {bulan.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block text-[10px] text-orange-700">To</Label>
              <Select value={filterToBulanTTD || 'all'} onValueChange={setFilterToBulanTTD || (() => {})}>
                <SelectTrigger className="w-full h-8 border-orange-200 text-xs">
                  <SelectValue placeholder="To" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {bulanOptions.map((bulan) => (
                    <SelectItem key={bulan.value} value={bulan.value}>
                      {bulan.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
