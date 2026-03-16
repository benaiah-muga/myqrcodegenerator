'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Download, Link2, QrCode, ClipboardPaste, Check, Copy, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Home() {
  const [url, setUrl] = useState('')
  const [isValidUrl, setIsValidUrl] = useState(false)
  const [copied, setCopied] = useState(false)
  const [pasteDetected, setPasteDetected] = useState(false)
  const [qrSize, setQrSize] = useState(256)
  const inputRef = useRef<HTMLInputElement>(null)
  const qrRef = useRef<HTMLDivElement>(null)

  // Validate URL
  const validateUrl = useCallback((value: string) => {
    if (!value.trim()) return false
    
    try {
      // Add protocol if missing
      let urlToTest = value
      if (!value.startsWith('http://') && !value.startsWith('https://')) {
        urlToTest = 'https://' + value
      }
      
      const urlObj = new URL(urlToTest)
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
    } catch {
      return false
    }
  }, [])

  // Handle URL change
  const handleUrlChange = useCallback((value: string) => {
    setUrl(value)
    setIsValidUrl(validateUrl(value))
    setPasteDetected(false)
  }, [validateUrl])

  // Handle paste event
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const pastedText = e.clipboardData?.getData('text')
      if (pastedText) {
        setUrl(pastedText)
        setIsValidUrl(validateUrl(pastedText))
        setPasteDetected(true)
        
        // Reset paste indicator after 2 seconds
        setTimeout(() => setPasteDetected(false), 2000)
      }
    }

    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [validateUrl])

  // Update QR size based on screen width
  useEffect(() => {
    const updateQrSize = () => {
      const width = window.innerWidth
      if (width < 400) setQrSize(200)
      else if (width < 640) setQrSize(220)
      else setQrSize(256)
    }

    updateQrSize()
    window.addEventListener('resize', updateQrSize)
    return () => window.removeEventListener('resize', updateQrSize)
  }, [])

  // Get the URL to encode (add protocol if missing)
  const getUrlToEncode = () => {
    if (!url.trim()) return ''
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }
    return 'https://' + url
  }

  // Download QR code as PNG
  const downloadQR = () => {
    const svg = qrRef.current?.querySelector('svg')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    canvas.width = qrSize * 2
    canvas.height = qrSize * 2
    
    img.onload = () => {
      // White background
      ctx!.fillStyle = 'white'
      ctx!.fillRect(0, 0, canvas.width, canvas.height)
      ctx!.drawImage(img, 0, 0, canvas.width, canvas.height)
      
      const pngFile = canvas.toDataURL('image/png')
      const downloadLink = document.createElement('a')
      downloadLink.download = `qrcode-${Date.now()}.png`
      downloadLink.href = pngFile
      downloadLink.click()
    }
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  // Copy URL to clipboard
  const copyUrl = async () => {
    if (!url) return
    try {
      await navigator.clipboard.writeText(getUrlToEncode())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Clear input
  const clearInput = () => {
    setUrl('')
    setIsValidUrl(false)
    inputRef.current?.focus()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col">
      {/* Header */}
      <header className="w-full py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-3">
          <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
            <QrCode className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            QR Code Generator
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-start justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="w-full max-w-lg">
          {/* Input Card */}
          <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl sm:text-2xl">Generate QR Code</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Paste or type any link to instantly generate a QR code
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* URL Input */}
              <div className="relative">
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    ref={inputRef}
                    type="text"
                    placeholder="Paste or type a URL..."
                    value={url}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    className={`pl-10 pr-20 h-12 text-base transition-all duration-200 ${
                      url && isValidUrl 
                        ? 'border-emerald-500 focus-visible:ring-emerald-500' 
                        : url && !isValidUrl 
                          ? 'border-red-400 focus-visible:ring-red-400' 
                          : ''
                    }`}
                    autoFocus
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {url && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={clearInput}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={copyUrl}
                      disabled={!url}
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Paste Detected Indicator */}
                <AnimatePresence>
                  {pasteDetected && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute -bottom-8 left-0 right-0 flex justify-center"
                    >
                      <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 gap-1">
                        <ClipboardPaste className="w-3 h-3" />
                        Link pasted!
                      </Badge>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* QR Code Display */}
              <AnimatePresence mode="wait">
                {url && isValidUrl ? (
                  <motion.div
                    key="qr-code"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center space-y-4 pt-4"
                  >
                    {/* QR Code */}
                    <div 
                      ref={qrRef}
                      className="p-4 bg-white rounded-2xl shadow-lg border border-slate-100"
                    >
                      <QRCodeSVG
                        value={getUrlToEncode()}
                        size={qrSize}
                        level="H"
                        includeMargin={true}
                        bgColor="#ffffff"
                        fgColor="#000000"
                      />
                    </div>

                    {/* URL Preview */}
                    <div className="text-center max-w-full">
                      <p className="text-xs text-muted-foreground break-all px-4">
                        {getUrlToEncode()}
                      </p>
                    </div>

                    {/* Download Button */}
                    <Button
                      onClick={downloadQR}
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6"
                      size="lg"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Download QR Code
                    </Button>
                  </motion.div>
                ) : url && !isValidUrl ? (
                  <motion.div
                    key="invalid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center py-8 text-center"
                  >
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full mb-3">
                      <Link2 className="w-8 h-8 text-red-500" />
                    </div>
                    <p className="text-red-600 dark:text-red-400 font-medium">
                      Invalid URL
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Please enter a valid web address
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center py-8 text-center"
                  >
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
                      <QrCode className="w-12 h-12 text-slate-400" />
                    </div>
                    <p className="text-muted-foreground">
                      Your QR code will appear here
                    </p>
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                      <ClipboardPaste className="w-4 h-4" />
                      Just paste a link anywhere on this page
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Tips */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>
              💡 Tip: Press <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono">Ctrl</kbd> + <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono">V</kbd> to paste anywhere
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-muted-foreground">
        <p>Generate QR codes instantly • No data stored</p>
      </footer>
    </div>
  )
}
