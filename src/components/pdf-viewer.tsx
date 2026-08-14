'use client'

import { useState } from 'react'
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

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
    setPageNumber(1)
  }

  const changePage = (offset: number) => {
    setPageNumber(prev => Math.min(Math.max(1, prev + offset), numPages || 1))
  }

  return (
    <div className={`flex flex-col relative bg-background ${isFullscreen ? 'fixed inset-0 z-50' : 'w-full min-h-[600px] rounded-2xl border border-border overflow-hidden'}`}>
      
      {/* Slim Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <h2 className="text-sm font-semibold text-foreground truncate max-w-[60%]">{title}</h2>
        <div className="flex items-center gap-1">
          <button onClick={() => setScale(prev => Math.max(prev - 0.25, 0.5))} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-xs font-semibold text-foreground w-10 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(prev => Math.min(prev + 0.25, 3.0))} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <ZoomIn className="h-4 w-4" />
          </button>
          <div className="w-px h-4 bg-border mx-1" />
          <a href={url} download className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <Download className="h-4 w-4" />
          </a>
          <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto bg-[#F0EAD9] flex justify-center py-6">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
              <div className="h-8 w-8 border-2 border-primary/30 border-t-primary animate-spin rounded-full" />
              <span className="text-sm font-medium">Loading document...</span>
            </div>
          }
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={pageNumber}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="shadow-lg rounded-lg overflow-hidden"
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            </motion.div>
          </AnimatePresence>
        </Document>
      </div>

      {/* Minimal Bottom Nav — Apple Books style */}
      <div className="flex items-center justify-center gap-4 px-4 py-3 bg-card border-t border-border">
        <button
          onClick={() => changePage(-1)}
          disabled={pageNumber <= 1}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold text-foreground min-w-[80px] text-center">
          {pageNumber} <span className="text-muted-foreground font-normal">of</span> {numPages || '—'}
        </span>
        <button
          onClick={() => changePage(1)}
          disabled={pageNumber >= (numPages || 1)}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
