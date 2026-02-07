"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { X, ZoomIn, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImagePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string | null;
  alt?: string;
}

const ImagePreviewDialog = ({ open, onOpenChange, imageUrl, alt = "Preview" }: ImagePreviewDialogProps) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (open) {
      setImageError(false);
    }
  }, [open, imageUrl]);

  const handleDownload = () => {
    if (!imageUrl) return;

    try {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `bukti-kunjungan-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  if (!imageUrl) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[100vw] w-screen h-[100vh] p-0 gap-0 overflow-hidden bg-black dark:bg-black border-0 shadow-2xl rounded-none">
        <DialogTitle className="sr-only">Preview Bukti Kunjungan</DialogTitle>
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-3 sm:p-6 bg-gradient-to-b from-black/90 via-black/70 to-transparent">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <ZoomIn className="w-4 h-4 sm:w-6 sm:h-6 text-white flex-shrink-0" />
            <h3 className="text-white font-semibold text-xs sm:text-base truncate">Preview Bukti</h3>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="text-white hover:text-white hover:bg-white/20 h-8 w-8 sm:h-auto sm:w-auto p-0 sm:px-3"
            >
              <Download className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Download</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="bg-white/20 hover:bg-white/30 text-white h-8 w-8 sm:h-auto sm:w-auto p-0 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </Button>
          </div>
        </div>

        {/* Image Container */}
        <div className="w-full h-full flex items-center justify-center p-0 pt-14 sm:pt-20 bg-black">
          {imageError ? (
            <div className="text-center text-white">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center">
                <X className="w-8 h-8" />
              </div>
              <p className="text-lg font-semibold mb-2">Gagal memuat gambar</p>
              <p className="text-sm text-white/70">Gambar tidak dapat ditampilkan</p>
            </div>
          ) : (
            <img
              src={imageUrl}
              alt={alt}
              className="w-full h-full object-contain"
              onError={() => setImageError(true)}
            />
          )}
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <p className="text-center text-white/80 text-xs sm:text-sm">
            Klik di luar gambar atau tekan tombol close untuk menutup
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { ImagePreviewDialog };
