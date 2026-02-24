import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title: string;
}

export function ImageModal({ isOpen, onClose, imageUrl, title }: ImageModalProps) {
  const [zoom, setZoom] = React.useState(1);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${title}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/95 backdrop-blur-xl"
          />
          
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10">
              <div className="flex flex-col">
                <h3 className="text-white font-bold text-lg tracking-tight">{title}</h3>
                <p className="text-white/40 text-[10px] font-mono uppercase tracking-widest">4K Ultra HD Transformation</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-white/10 rounded-full p-1 border border-white/10">
                  <button 
                    onClick={() => setZoom(prev => Math.max(0.5, prev - 0.25))}
                    className="p-2 hover:bg-white/10 rounded-full text-white transition-colors"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] font-mono text-white px-2 min-w-[40px] text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button 
                    onClick={() => setZoom(prev => Math.min(3, prev + 0.25))}
                    className="p-2 hover:bg-white/10 rounded-full text-white transition-colors"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
                <button 
                  onClick={handleDownload}
                  className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button 
                  onClick={onClose}
                  className="p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Image Container */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-full max-h-full overflow-auto p-12 flex items-center justify-center"
            >
              <motion.img
                src={imageUrl}
                alt={title}
                style={{ scale: zoom }}
                className="max-w-full max-h-[80vh] object-contain shadow-2xl rounded-lg transition-transform duration-200"
              />
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
