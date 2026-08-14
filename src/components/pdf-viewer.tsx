'use client'

import { useState, useRef, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, Maximize2, Minimize2, ArrowLeft } from 'lucide-react'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface PDFViewerProps {
  url: string
  title: string
  author?: string
  code?: string
  onBack?: () => void
}

export function PDFViewer({ url, title, author, code, onBack }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [pageWidth, setPageWidth] = useState<number>(850)

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
    setPageNumber(1)
  }

  const changePage = (offset: number) => {
    setPageNumber(prev => Math.min(Math.max(1, prev + offset), numPages || 1))
  }

  // True HTML5 Fullscreen API
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen?.().catch(() => {})
      setIsFullscreen(false)
    }
  }

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

  // Measure container and auto-scale PDF slides/documents to fit width perfectly
  useEffect(() => {
    const updateWidth = () => {
      if (!containerRef.current) return
      const elWidth = containerRef.current.clientWidth
      if (elWidth > 0) {
        const padding = window.innerWidth < 640 ? 20 : 64
        const target = Math.max(300, Math.min(elWidth - padding, isFullscreen ? 1400 : 1050))
        setPageWidth(target)
      }
    }

    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [isFullscreen])

  return (
    <div className="flex flex-col w-full min-h-screen bg-background text-foreground">
      
      {/* Unified Clean Top Bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 sm:px-8 py-3.5 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button 
              onClick={onBack} 
              className="flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium hover:bg-secondary transition-colors shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-semibold text-foreground truncate max-w-52 sm:max-w-md">{title}</h1>
            {(code || author) && (
              <p className="text-xs text-muted-foreground truncate">{[code, author].filter(Boolean).join(' · ')}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button 
            onClick={() => setScale(prev => Math.max(prev - 0.2, 0.6))} 
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={() => setScale(1.0)}
            className="text-xs font-semibold text-foreground px-2.5 py-1 rounded-lg hover:bg-secondary transition-colors min-w-12 text-center"
            title="Click to Reset (100% Fit Width)"
          >
            {Math.round(scale * 100)}%
          </button>
          <button 
            onClick={() => setScale(prev => Math.min(prev + 0.2, 2.5))} 
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <div className="w-px h-4 bg-border/80 mx-1" />
          <a 
            href={url} 
            download 
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Download PDF"
          >
            <Download className="h-4 w-4" />
          </a>
          <button 
            onClick={toggleFullscreen} 
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* PDF Viewer Canvas Body */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto bg-[#F7F5F0] dark:bg-[#121214] flex justify-center py-6 sm:py-10 px-3 sm:px-6 overscroll-contain"
      >
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex flex-col items-center justify-center gap-3 py-28 text-muted-foreground">
              <div className="h-8 w-8 border-2 border-primary/30 border-t-primary animate-spin rounded-full" />
              <span className="text-sm font-medium">Loading document...</span>
            </div>
          }
          error={
            <div className="flex flex-col items-center justify-center gap-2 py-28 text-destructive text-sm">
              <span>Failed to load PDF document.</span>
            </div>
          }
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={pageNumber}
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.15 }}
              className="shadow-2xl rounded-2xl overflow-hidden bg-white border border-black/5"
            >
              <Page
                pageNumber={pageNumber}
                width={pageWidth * scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="max-w-none"
              />
            </motion.div>
          </AnimatePresence>
        </Document>
      </div>

      {/* Bottom Page Navigation (Apple Books Style) */}
      <div className="sticky bottom-0 z-30 flex items-center justify-center gap-4 px-6 py-3.5 bg-background/80 backdrop-blur-xl border-t border-border/50">
        <button
          onClick={() => changePage(-1)}
          disabled={pageNumber <= 1}
          className="flex size-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          aria-label="Previous Page"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold text-foreground min-w-[90px] text-center select-none">
          {pageNumber} <span className="text-muted-foreground font-normal">of</span> {numPages || '—'}
        </span>
        <button
          onClick={() => changePage(1)}
          disabled={pageNumber >= (numPages || 1)}
          className="flex size-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          aria-label="Next Page"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
