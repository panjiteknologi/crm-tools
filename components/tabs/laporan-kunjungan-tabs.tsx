"use client";

import React, { useState, createContext, useContext } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Building2, Sparkles } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ExistingClientView } from './existing-client-view';
import { NewClientView } from './new-client-view';

// Create context for shared filter state
interface FilterContextType {
  selectedMonth: number;
  setSelectedMonth: (month: number) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  selectedPicCrm: string;
  setSelectedPicCrm: (pic: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  viewMode: "grid" | "table";
  setViewMode: (mode: "grid" | "table") => void;
  showHargaKontrak: boolean;
  setShowHargaKontrak: (show: boolean) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function useFilterContext() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilterContext must be used within LaporanKunjunganTabs');
  }
  return context;
}

export function LaporanKunjunganTabs() {
  const visitedTargets = useQuery(api.crmTargets.getVisitedTargets);
  const newClients = useQuery(api.crmNewClient.getAllNewClients);

  const existingCount = visitedTargets?.length || 0;
  const newClientCount = newClients?.length || 0;

  // Shared filter state
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedPicCrm, setSelectedPicCrm] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [showHargaKontrak, setShowHargaKontrak] = useState(false);

  return (
    <FilterContext.Provider
      value={{
        selectedMonth,
        setSelectedMonth,
        selectedYear,
        setSelectedYear,
        selectedPicCrm,
        setSelectedPicCrm,
        searchQuery,
        setSearchQuery,
        viewMode,
        setViewMode,
        showHargaKontrak,
        setShowHargaKontrak,
      }}
    >
      <div className="flex-1 space-y-6 p-4 sm:p-8 pt-6">
        <Tabs defaultValue="existing" className="w-full">
          {/* Sticky Tab Header */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-4 pt-2">
            <TabsList className="grid w-full max-w-md grid-cols-2 h-12 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg shadow-md">
              <TabsTrigger
                value="existing"
                className="cursor-pointer relative gap-2 bg-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all"
              >
                <Building2 className="h-4 w-4" />
                <span>Existing</span>
                <Badge variant="secondary" className="ml-1 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 data-[state=active]:bg-white data-[state=active]:text-purple-600">
                  {existingCount}
                </Badge>
              </TabsTrigger>

              <TabsTrigger
                value="new"
                className="cursor-pointer relative gap-2 bg-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all"
              >
                <Sparkles className="h-4 w-4" />
                <span>New</span>
                <Badge variant="secondary" className="ml-1 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 data-[state=active]:bg-white data-[state=active]:text-purple-600">
                  {newClientCount}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="existing" className="bg-purple-200 mt-4">
            <ExistingClientView />
          </TabsContent>

          <TabsContent value="new" className="bg-purple-200 mt-4">
            <NewClientView />
          </TabsContent>
        </Tabs>
      </div>
    </FilterContext.Provider>
  );
}
