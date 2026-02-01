import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Power, PowerOff } from 'lucide-react';

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
  filterBulanExpEnabled?: boolean;
  setFilterBulanExpEnabled?: (value: boolean) => void;
  filterBulanTTDEnabled?: boolean;
  setFilterBulanTTDEnabled?: (value: boolean) => void;
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
  filterBulanExpEnabled = true,
  setFilterBulanExpEnabled,
  filterBulanTTDEnabled = true,
  setFilterBulanTTDEnabled,
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
      <div className={`border rounded-lg p-2 space-y-2 transition-opacity ${filterBulanExpEnabled ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200 bg-gray-50/30 opacity-60'}`}>
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-blue-900">📅 Bulan Exp Date</div>
          {setFilterBulanExpEnabled && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 cursor-pointer hover:bg-gray-300"
              onClick={() => setFilterBulanExpEnabled(!filterBulanExpEnabled)}
            >
              {filterBulanExpEnabled ? (
                <>
                  <Power className="h-3 w-3 mr-1 text-green-600" />
                  <span className="text-[10px] text-green-600">Aktif</span>
                </>
              ) : (
                <>
                  <PowerOff className="h-3 w-3 mr-1 text-red-600" />
                  <span className="text-[10px] text-red-600">Nonaktif</span>
                </>
              )}
            </Button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="mb-1 block text-[10px] text-blue-700">From</Label>
            <Select
              value={filterFromBulanExp}
              onValueChange={setFilterFromBulanExp}
              disabled={!filterBulanExpEnabled}
            >
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
            <Select
              value={filterToBulanExp}
              onValueChange={setFilterToBulanExp}
              disabled={!filterBulanExpEnabled}
            >
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
        <div className={`border rounded-lg p-2 space-y-2 transition-opacity ${filterBulanTTDEnabled ? 'border-orange-200 bg-orange-50/30' : 'border-gray-200 bg-gray-50/30 opacity-60'}`}>
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-orange-900">✍️ Bulan TTD Notif</div>
            {setFilterBulanTTDEnabled && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 cursor-pointer hover:bg-gray-300"
                onClick={() => setFilterBulanTTDEnabled(!filterBulanTTDEnabled)}
              >
                {filterBulanTTDEnabled ? (
                  <>
                    <Power className="h-3 w-3 mr-1 text-green-600" />
                    <span className="text-[10px] text-green-600">Aktif</span>
                  </>
                ) : (
                  <>
                    <PowerOff className="h-3 w-3 mr-1 text-red-600" />
                    <span className="text-[10px] text-red-600">Nonaktif</span>
                  </>
                )}
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="mb-1 block text-[10px] text-orange-700">From</Label>
              <Select
                value={filterFromBulanTTD || 'all'}
                onValueChange={setFilterFromBulanTTD || (() => {})}
                disabled={!filterBulanTTDEnabled}
              >
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
              <Select
                value={filterToBulanTTD || 'all'}
                onValueChange={setFilterToBulanTTD || (() => {})}
                disabled={!filterBulanTTDEnabled}
              >
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
