"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export type KategoriProduk = "ISO" | "SUSTAIN" | "SEMUA"

interface FilterKategoriProdukSectionProps {
  selectedKategori: KategoriProduk
  onKategoriChange: (kategori: KategoriProduk) => void
}

export function FilterKategoriProdukSection({
  selectedKategori,
  onKategoriChange,
}: FilterKategoriProdukSectionProps) {
  const kategoriOptions: { value: KategoriProduk; label: string; color: string }[] = [
    { value: "SEMUA", label: "Semua", color: "bg-gray-100 hover:bg-gray-200 text-black-700 border-gray-300" },
    { value: "ISO", label: "ISO", color: "bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-300" },
    { value: "SUSTAIN", label: "SUSTAIN", color: "bg-green-100 hover:bg-green-200 text-green-700 border-green-300" },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {kategoriOptions.map((option) => (
        <Button
          key={option.value}
          onClick={() => onKategoriChange(option.value)}
          variant={selectedKategori === option.value ? "default" : "outline"}
          className={
            selectedKategori === option.value
              ? "bg-black  hover:bg-gray-800 cursor-pointer"
              : `${option.color}  hover:opacity-90 cursor-pointer`
          }
        >
          {option.label}
        </Button>
      ))}
    </div>
  )
}
