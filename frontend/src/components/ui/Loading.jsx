import React from 'react';
import { Loader2 } from 'lucide-react';

// 1. Full Screen Loader (Saat membuka aplikasi/halaman)
export const PageLoader = ({ text = "Memuat..." }) => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-dark-900/80 backdrop-blur-md">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-8 h-8 bg-blue-500 rounded-full animate-pulse opacity-20"></div>
      </div>
    </div>
    <p className="mt-4 text-gray-400 text-sm font-medium tracking-widest uppercase animate-pulse">{text}</p>
  </div>
);

// 2. Typing Indicator (Gelembung chat saat AI berpikir)
export const TypingBubble = () => (
  <div className="flex items-center gap-1 px-4 py-3 bg-white/5 rounded-2xl w-fit rounded-tl-sm border border-white/5">
    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
  </div>
);

// 3. Skeleton Card (Untuk Dashboard list)
export const SkeletonCard = () => (
  <div className="w-full h-24 bg-white/5 rounded-xl animate-pulse border border-white/5 p-4 flex flex-col justify-between">
    <div className="flex gap-4 items-center">
        <div className="w-10 h-10 bg-white/10 rounded-full"></div>
        <div className="flex-1 space-y-2">
            <div className="h-4 bg-white/10 rounded w-3/4"></div>
            <div className="h-3 bg-white/10 rounded w-1/2"></div>
        </div>
    </div>
  </div>
);

// 4. Spinner Kecil (Untuk tombol)
export const ButtonSpinner = () => (
  <Loader2 className="animate-spin w-5 h-5" />
);