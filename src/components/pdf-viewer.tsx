'use client'

import { useState, useRef, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, Maximize2, Minimize2, ArrowLeft, ExternalLink } from 'lucide-react'
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

  // Responsive width calculation with zero horizontal overflow
  useEffect(() => {
    const updateWidth = () => {
      if (!containerRef.current) return
      const elWidth = containerRef.current.clientWidth
      if (elWidth > 0) {
        const isMobile = window.innerWidth < 640
        const padding = isMobile ? 16 : 48
        const target = Math.max(260, Math.min(elWidth - padding, isFullscreen ? 1400 : 1050))
        setPageWidth(target)
      }
    }

    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [isFullscreen])

  return (
    <div className="flex flex-col w-full min-h-screen bg-background text-foreground select-none">
      
      {/* Unified Top Navigation Bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-3 sm:px-8 py-3.5 bg-background/90 backdrop-blur-xl border-b border-border/50 shadow-xs">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {onBack && (
            <button 
              onClick={onBack} 
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs sm:text-sm font-medium hover:bg-secondary transition-colors shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}
          <div className="min-w-0">
            <h1 className="text-xs sm:text-base font-semibold text-foreground truncate max-w-40 sm:max-w-md">{title}</h1>
            {(code || author) && (
              <p className="text-[11px] text-muted-foreground truncate hidden sm:block">{[code, author].filter(Boolean).join(' · ')}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Fallback to Google Viewer */}
          <a
            href={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-secondary/60 hover:bg-secondary rounded-xl transition-colors mr-1"
            title="Open in Google Docs Viewer"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Google Viewer</span>
          </a>

          <button 
            onClick={() => setScale(prev => Math.max(prev - 0.2, 0.6))} 
            className="p-1.5 sm:p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={() => setScale(1.0)}
            className="text-xs font-semibold text-foreground px-2 py-1 rounded-lg hover:bg-secondary transition-colors min-w-10 text-center"
            title="Click to Reset (Fit Width)"
          >
            {Math.round(scale * 100)}%
          </button>
          <button 
            onClick={() => setScale(prev => Math.min(prev + 0.2, 2.5))} 
            className="p-1.5 sm:p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <div className="w-px h-4 bg-border/80 mx-0.5 sm:mx-1" />
          <a 
            href={url} 
            download 
            className="p-1.5 sm:p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Download PDF"
          >
            <Download className="h-4 w-4" />
          </a>
          <button 
            onClick={toggleFullscreen} 
            className="p-1.5 sm:p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* PDF Viewer Canvas Body - Zero Horizontal Scrollbar + Swipe Support */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden bg-[#F7F5F0] dark:bg-[#121214] flex flex-col items-center justify-center py-4 sm:py-8 px-2 sm:px-6 overscroll-contain touch-pan-y [scrollbar-width:none] [&::-webkit-scrollbar]:hidden min-h-[calc(100vh-120px)]"
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
            <div className="flex flex-col items-center justify-center gap-2 py-28 text-destructive text-sm text-center px-4">
              <span>Failed to load PDF document.</span>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 text-xs font-semibold underline text-primary"
              >
                Open directly in browser
              </a>
            </div>
          }
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pageNumber}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.15}
              onDragEnd={(e, { offset }) => {
                const swipe = offset.x
                if (swipe < -50 && pageNumber < (numPages || 1)) {
                  changePage(1)
                } else if (swipe > 50 && pageNumber > 1) {
                  changePage(-1)
                }
              }}
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.15 }}
              className="shadow-xl sm:shadow-2xl rounded-xl sm:rounded-2xl overflow-hidden bg-white border border-black/5 cursor-grab active:cursor-grabbing touch-pan-y"
            >
              <Page
                pageNumber={pageNumber}
                width={pageWidth * scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="max-w-none pointer-events-none sm:pointer-events-auto"
              />
            </motion.div>
          </AnimatePresence>
        </Document>

        {/* Mobile Swipe Hint */}
        <p className="text-[11px] text-muted-foreground/60 mt-3 sm:hidden">
          Swipe left or right to flip pages
        </p>
      </div>

      {/* Bottom Page Navigation (Apple Books Style) */}
      <div className="sticky bottom-0 z-30 flex items-center justify-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 bg-background/90 backdrop-blur-xl border-t border-border/50">
        <button
          onClick={() => changePage(-1)}
          disabled={pageNumber <= 1}
          className="flex size-8 sm:size-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          aria-label="Previous Page"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-xs sm:text-sm font-semibold text-foreground min-w-[80px] sm:min-w-[90px] text-center select-none">
          {pageNumber} <span className="text-muted-foreground font-normal">of</span> {numPages || '—'}
        </span>
        <button
          onClick={() => changePage(1)}
          disabled={pageNumber >= (numPages || 1)}
          className="flex size-8 sm:size-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          aria-label="Next Page"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
