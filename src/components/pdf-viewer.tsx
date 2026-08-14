'use client'

import { useState, useRef, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, Maximize2, Minimize2 } from 'lucide-react'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface PDFViewerProps {
  url: string
  title: string
}

export function PDFViewer({ url, title }: PDFViewerProps) {
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

  // Measure container and auto-scale PDF slides/documents to fit width perfectly
  useEffect(() => {
    const updateWidth = () => {
      if (!containerRef.current) return
      const elWidth = containerRef.current.clientWidth
      if (elWidth > 0) {
        const padding = window.innerWidth < 640 ? 24 : 64
        const target = Math.max(300, Math.min(elWidth - padding, 1050))
        setPageWidth(target)
      }
    }

    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [isFullscreen])

  return (
    <div className={`flex flex-col relative bg-card ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'w-full min-h-[650px] rounded-3xl border border-border/80 shadow-sm overflow-hidden'}`}>
      
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-card/90 backdrop-blur-md border-b border-border/60 z-10">
        <h2 className="text-sm font-semibold text-foreground truncate max-w-[50%]">{title}</h2>
        <div className="flex items-center gap-1 sm:gap-1.5">
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
            onClick={() => setIsFullscreen(!isFullscreen)} 
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* PDF Viewer Canvas Body */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto bg-[#F7F5F0] dark:bg-[#18181B] flex justify-center py-6 sm:py-10 px-3 sm:px-6 overscroll-contain"
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
      <div className="flex items-center justify-center gap-4 px-6 py-3.5 bg-card/90 backdrop-blur-md border-t border-border/60 z-10">
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
