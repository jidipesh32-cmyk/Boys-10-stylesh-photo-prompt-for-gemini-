import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone, type DropzoneOptions } from 'react-dropzone';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, Camera, Sparkles, RefreshCw, CheckCircle2, 
  AlertCircle, Download, Image as ImageIcon, 
  User as UserIcon, LogOut, Bookmark, Settings,
  Maximize2, Trash2, ChevronRight, History
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { STYLES, generateVariation } from './services/gemini';
import { api, type User, type SavedImage, type Preferences } from './services/api';
import { AuthModal } from './components/AuthModal';
import { ImageModal } from './components/ImageModal';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GenerationState {
  id: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  result?: string;
  error?: string;
  isSaved?: boolean;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [savedImages, setSavedImages] = useState<SavedImage[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPrefsOpen, setIsPrefsOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [zoomImage, setZoomImage] = useState<{ url: string; title: string } | null>(null);

  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [generations, setGenerations] = useState<GenerationState[]>(
    STYLES.map(s => ({ id: s.id, status: 'idle' }))
  );
  const [isProcessing, setIsProcessing] = useState(false);

  // Initial Data Fetch
  useEffect(() => {
    const init = async () => {
      const me = await api.getMe();
      if (me) {
        setUser(me);
        const [prefs, images] = await Promise.all([
          api.getPreferences(),
          api.getImages()
        ]);
        setPreferences(prefs);
        setSavedImages(images);
      }
    };
    init();
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSourceImage(reader.result as string);
        setGenerations(STYLES.map(s => ({ id: s.id, status: 'idle' })));
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const dropzoneOptions: DropzoneOptions = {
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
    disabled: isProcessing
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone(dropzoneOptions);

  const handleGenerate = async () => {
    if (!sourceImage) return;
    setIsProcessing(true);
    
    const processStyle = async (styleId: string) => {
      setGenerations(prev => prev.map(g => g.id === styleId ? { ...g, status: 'loading' } : g));
      const style = STYLES.find(s => s.id === styleId)!;
      try {
        const result = await generateVariation(sourceImage, style.prompt);
        setGenerations(prev => prev.map(g => g.id === styleId ? { ...g, status: 'success', result } : g));
        
        // Auto-save if enabled
        if (user && preferences?.auto_save) {
          await api.saveImage(result, styleId);
          const images = await api.getImages();
          setSavedImages(images);
          setGenerations(prev => prev.map(g => g.id === styleId ? { ...g, isSaved: true } : g));
        }
      } catch (error) {
        console.error(`Error generating ${styleId}:`, error);
        setGenerations(prev => prev.map(g => g.id === styleId ? { ...g, status: 'error', error: 'Failed to generate' } : g));
      }
    };

    const batchSize = 2;
    for (let i = 0; i < STYLES.length; i += batchSize) {
      const batch = STYLES.slice(i, i + batchSize);
      await Promise.all(batch.map(s => processStyle(s.id)));
    }
    setIsProcessing(false);
  };

  const handleSaveImage = async (url: string, styleId: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    try {
      await api.saveImage(url, styleId);
      const images = await api.getImages();
      setSavedImages(images);
      setGenerations(prev => prev.map(g => g.id === styleId ? { ...g, isSaved: true } : g));
    } catch (err) {
      console.error("Failed to save image", err);
    }
  };

  const handleDeleteSaved = async (id: number) => {
    try {
      await api.deleteImage(id);
      setSavedImages(prev => prev.filter(img => img.id !== id));
    } catch (err) {
      console.error("Failed to delete image", err);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setPreferences(null);
    setSavedImages([]);
    setIsGalleryOpen(false);
    setIsPrefsOpen(false);
  };

  const updatePref = async (newPrefs: Partial<Preferences>) => {
    if (!preferences) return;
    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);
    await api.updatePreferences(updated);
  };

  return (
    <div className="min-h-screen bg-[#E6E6E6] text-[#151619] font-sans selection:bg-[#151619] selection:text-white">
      {/* Header */}
      <header className="border-b border-black/10 bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#151619] rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold tracking-tight uppercase">PersonaMorph AI</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsGalleryOpen(true)}
                  className="p-2 hover:bg-black/5 rounded-full transition-colors relative"
                  title="Saved Gallery"
                >
                  <History className="w-5 h-5" />
                  {savedImages.length > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white" />
                  )}
                </button>
                <button 
                  onClick={() => setIsPrefsOpen(true)}
                  className="p-2 hover:bg-black/5 rounded-full transition-colors"
                  title="Preferences"
                >
                  <Settings className="w-5 h-5" />
                </button>
                <div className="h-6 w-px bg-black/10 mx-2" />
                <div className="flex items-center gap-3 pl-2">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-black/40 leading-none mb-1">Authenticated</p>
                    <p className="text-sm font-bold leading-none">{user.username}</p>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest hover:scale-105 transition-transform"
              >
                <UserIcon className="w-4 h-4" />
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-[400px_1fr] gap-12 items-start">
          
          {/* Left Column: Controls */}
          <div className="space-y-8 sticky top-28">
            <section className="bg-[#151619] rounded-2xl p-6 shadow-2xl text-white">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-white/50">Input Module</h2>
                <Camera className="w-4 h-4 text-white/30" />
              </div>

              <div 
                {...getRootProps()} 
                className={cn(
                  "relative aspect-square rounded-xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center gap-4 cursor-pointer overflow-hidden",
                  isDragActive ? "border-white/50 bg-white/5" : "border-white/10 hover:border-white/30 hover:bg-white/5",
                  sourceImage && "border-none"
                )}
              >
                <input {...getInputProps()} />
                {sourceImage ? (
                  <>
                    <img src={sourceImage} alt="Source" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <p className="text-xs font-mono uppercase tracking-widest">Change Image</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                      <Upload className="w-6 h-6 text-white/50" />
                    </div>
                    <div className="text-center px-6">
                      <p className="text-sm font-medium">Drop reference photo</p>
                      <p className="text-[10px] text-white/40 mt-1 font-mono uppercase">PNG, JPG up to 10MB</p>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={handleGenerate}
                disabled={!sourceImage || isProcessing}
                className={cn(
                  "w-full mt-6 py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2",
                  !sourceImage || isProcessing 
                    ? "bg-white/5 text-white/20 cursor-not-allowed" 
                    : "bg-white text-black hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-white/10"
                )}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate 10 Styles
                  </>
                )}
              </button>

              <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-white/30">Resolution</span>
                  <span className="text-[10px] font-mono text-white/70">4K ULTRA HD</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-white/30">Identity Lock</span>
                  <span className="text-[10px] font-mono text-emerald-400">ACTIVE</span>
                </div>
              </div>
            </section>

            {user && (
              <div className="bg-white rounded-2xl p-6 border border-black/5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-mono uppercase tracking-widest text-black/40">Quick Stats</h3>
                  <History className="w-4 h-4 text-black/20" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-black/5 rounded-xl">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-black/40 mb-1">Saved</p>
                    <p className="text-xl font-bold">{savedImages.length}</p>
                  </div>
                  <div className="p-4 bg-black/5 rounded-xl">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-black/40 mb-1">Styles</p>
                    <p className="text-xl font-bold">{STYLES.length}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Results Grid */}
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight">Output Gallery</h2>
              <div className="flex gap-2">
                <div className="px-3 py-1 rounded-full bg-black/5 border border-black/5 text-[10px] font-mono uppercase">
                  {generations.filter(g => g.status === 'success').length} / 10 Ready
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {generations.map((gen, index) => {
                const style = STYLES.find(s => s.id === gen.id)!;
                return (
                  <motion.div
                    key={gen.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative bg-white rounded-2xl border border-black/5 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500"
                  >
                    <div className="aspect-[4/5] relative bg-[#F0F0F0] overflow-hidden">
                      <AnimatePresence mode="wait">
                        {gen.status === 'idle' && (
                          <motion.div 
                            key="idle"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center text-black/20"
                          >
                            <ImageIcon className="w-12 h-12 mb-2" />
                            <span className="text-[10px] font-mono uppercase tracking-widest">Awaiting Input</span>
                          </motion.div>
                        )}

                        {gen.status === 'loading' && (
                          <motion.div 
                            key="loading"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-10"
                          >
                            <div className="relative w-16 h-16">
                              <div className="absolute inset-0 border-4 border-black/5 rounded-full" />
                              <div className="absolute inset-0 border-4 border-black border-t-transparent rounded-full animate-spin" />
                            </div>
                            <p className="mt-4 text-[10px] font-mono uppercase tracking-widest animate-pulse">Synthesizing...</p>
                          </motion.div>
                        )}

                        {gen.status === 'success' && gen.result && (
                          <motion.img
                            key="success"
                            initial={{ scale: 1.1, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            src={gen.result}
                            alt={style.name}
                            className="w-full h-full object-cover cursor-zoom-in"
                            onClick={() => setZoomImage({ url: gen.result!, title: style.name })}
                          />
                        )}

                        {gen.status === 'error' && (
                          <motion.div 
                            key="error"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center text-red-500 bg-red-50"
                          >
                            <AlertCircle className="w-10 h-10 mb-2" />
                            <span className="text-[10px] font-mono uppercase tracking-widest">Generation Failed</span>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Overlay Info */}
                      <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="flex items-center justify-between">
                          <p className="text-white text-[10px] font-mono uppercase tracking-widest">Variation {String(index + 1).padStart(2, '0')}</p>
                          <div className="flex gap-2">
                            {gen.status === 'success' && (
                              <>
                                <button 
                                  onClick={() => handleSaveImage(gen.result!, style.id)}
                                  disabled={gen.isSaved}
                                  className={cn(
                                    "p-2 rounded-full transition-all",
                                    gen.isSaved ? "bg-emerald-500 text-white" : "bg-white text-black hover:scale-110"
                                  )}
                                >
                                  <Bookmark className={cn("w-4 h-4", gen.isSaved && "fill-current")} />
                                </button>
                                <button 
                                  onClick={() => setZoomImage({ url: gen.result!, title: style.name })}
                                  className="p-2 bg-white rounded-full text-black hover:scale-110 transition-transform"
                                >
                                  <Maximize2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-sm tracking-tight">{style.name}</h3>
                        {gen.status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      </div>
                      <p className="text-xs text-black/50 leading-relaxed">{style.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Modals & Panels */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSuccess={(u) => {
          setUser(u);
          api.getPreferences().then(setPreferences);
          api.getImages().then(setSavedImages);
        }} 
      />

      <ImageModal 
        isOpen={!!zoomImage} 
        onClose={() => setZoomImage(null)} 
        imageUrl={zoomImage?.url || ''} 
        title={zoomImage?.title || ''} 
      />

      {/* Preferences Drawer */}
      <AnimatePresence>
        {isPrefsOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsPrefsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-xl font-bold tracking-tight">Preferences</h2>
                  <button onClick={() => setIsPrefsOpen(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                    <LogOut className="w-5 h-5 rotate-90" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold">Auto-Save Generations</p>
                      <p className="text-xs text-black/50">Automatically save all successful transformations to your gallery</p>
                    </div>
                    <button 
                      onClick={() => updatePref({ auto_save: preferences?.auto_save ? 0 : 1 })}
                      className={cn(
                        "w-12 h-6 rounded-full transition-colors relative",
                        preferences?.auto_save ? "bg-black" : "bg-black/10"
                      )}
                    >
                      <motion.div 
                        animate={{ x: preferences?.auto_save ? 24 : 4 }}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                      />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-bold">Default Style</p>
                    <div className="grid grid-cols-2 gap-2">
                      {STYLES.map(s => (
                        <button
                          key={s.id}
                          onClick={() => updatePref({ default_style: s.id })}
                          className={cn(
                            "px-3 py-2 rounded-xl text-[10px] font-mono uppercase tracking-wider text-left border transition-all",
                            preferences?.default_style === s.id 
                              ? "bg-black text-white border-black" 
                              : "bg-black/5 text-black/40 border-transparent hover:bg-black/10"
                          )}
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Saved Gallery Drawer */}
      <AnimatePresence>
        {isGalleryOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsGalleryOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              className="relative w-full max-w-2xl bg-[#E6E6E6] h-full shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-black/5 bg-white flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Saved Gallery</h2>
                  <p className="text-xs text-black/50 mt-1">{savedImages.length} items preserved</p>
                </div>
                <button onClick={() => setIsGalleryOpen(false)} className="p-3 hover:bg-black/5 rounded-full transition-colors">
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                {savedImages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-black/20">
                    <Bookmark className="w-16 h-16 mb-4" />
                    <p className="text-sm font-mono uppercase tracking-widest">No saved transformations</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-6">
                    {savedImages.map(img => (
                      <div key={img.id} className="group bg-white rounded-2xl overflow-hidden border border-black/5 shadow-sm">
                        <div className="aspect-[4/5] relative">
                          <img src={img.url} alt={img.style_id} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <button 
                              onClick={() => setZoomImage({ url: img.url, title: STYLES.find(s => s.id === img.style_id)?.name || 'Saved Image' })}
                              className="p-3 bg-white rounded-full text-black hover:scale-110 transition-transform"
                            >
                              <Maximize2 className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteSaved(img.id)}
                              className="p-3 bg-red-500 rounded-full text-white hover:scale-110 transition-transform"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                        <div className="p-4 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold">{STYLES.find(s => s.id === img.style_id)?.name || 'Unknown Style'}</p>
                            <p className="text-[10px] text-black/40 font-mono uppercase mt-1">
                              {new Date(img.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-black/5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-black/30" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-black/30">PersonaMorph Engine v2.5.0</span>
          </div>
          <div className="flex gap-8">
            <a href="#" className="text-[10px] font-mono uppercase tracking-widest text-black/40 hover:text-black transition-colors">Privacy Policy</a>
            <a href="#" className="text-[10px] font-mono uppercase tracking-widest text-black/40 hover:text-black transition-colors">Terms of Service</a>
            <a href="#" className="text-[10px] font-mono uppercase tracking-widest text-black/40 hover:text-black transition-colors">API Documentation</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
