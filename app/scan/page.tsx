"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { ArrowLeft, Camera, Loader2, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface ReceiptData {
  merchantName: string
  total: number
  currency: string
  transactionDate: string
  items?: Array<{
    name: string
    price: number
    quantity?: number
  }>
  tax?: number
  tip?: number
  confidence: number
}

export default function ScanPage() {
  const [isScanning, setIsScanning] = useState(false)
  const [scannedData, setScannedData] = useState<ReceiptData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Check for pending file from homepage
  useEffect(() => {
    const pendingFile = sessionStorage.getItem('pendingReceiptFile')
    if (pendingFile) {
      try {
        const fileData = JSON.parse(pendingFile)
        sessionStorage.removeItem('pendingReceiptFile')
        
        // Convert data URL back to File
        const response = fetch(fileData.data)
        response.then(res => res.blob()).then(blob => {
          const file = new File([blob], fileData.name, { type: fileData.type })
          handleScan(file)
        })
      } catch (err) {
        console.error('Error processing pending file:', err)
        setError('Failed to process uploaded file')
      }
    }
  }, [])

  const handleScan = async (file: File) => {
    setIsScanning(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/scan-receipt', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to scan receipt')
      }

      const receiptData = await response.json()
      setScannedData(receiptData)
    } catch (err) {
      console.error('Scanning error:', err)
      setError(err instanceof Error ? err.message : 'Failed to scan receipt')
    } finally {
      setIsScanning(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleScan(file)
    }
  }

  const handleConfirm = () => {
    if (scannedData) {
      const params = new URLSearchParams({
        amount: scannedData.total.toString(),
        merchant: scannedData.merchantName,
        date: scannedData.transactionDate,
        currency: scannedData.currency,
      })
      window.location.href = `/add-expense?${params.toString()}`
    }
  }

  const triggerCameraOptions = () => {
    fileInputRef.current?.click()
  }

  const resetScan = () => {
    setScannedData(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="p-6 pt-16 safe-area-top flex items-center">
        <Button variant="ghost" size="icon" className="mr-4" onClick={() => window.history.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-medium">Scan Receipt</h1>
      </header>

      {/* Camera View */}
      <div className="flex-1 mx-6 mb-32 rounded-2xl bg-card flex items-center justify-center">
        {!scannedData && !isScanning && !error && (
          <div className="text-center space-y-6">
            <div className="w-48 h-48 border-2 border-dashed border-muted rounded-2xl flex items-center justify-center">
              <div className="text-center">
                <Camera className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">Position receipt here</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              Make sure the receipt is well-lit and all text is visible
            </p>
          </div>
        )}

        {isScanning && (
          <div className="text-center space-y-6">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <div className="space-y-2">
              <p className="text-lg font-medium">Analyzing...</p>
              <p className="text-sm text-muted-foreground">AI is extracting receipt details</p>
            </div>
          </div>
        )}

        {error && (
          <Card className="minimal-card w-full max-w-sm mx-4">
            <CardContent className="p-6 space-y-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AlertCircle className="h-6 w-6 text-red-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">Scan Failed</h3>
                <p className="text-sm text-muted-foreground mb-4">{error}</p>
              </div>

              <Button className="w-full rounded-xl bg-primary hover:bg-primary/90" onClick={resetScan}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {scannedData && (
          <Card className="minimal-card w-full max-w-sm mx-4">
            <CardContent className="p-6 space-y-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Check className="h-6 w-6 text-green-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">Receipt Scanned</h3>
                {scannedData.confidence < 0.8 && (
                  <p className="text-xs text-yellow-400 mb-2">
                    Low confidence - please verify details
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Merchant</span>
                  <span className="font-medium">{scannedData.merchantName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="text-xl font-medium text-primary">
                    {scannedData.currency} {scannedData.total.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">{scannedData.transactionDate}</span>
                </div>
                {scannedData.tax && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-medium">{scannedData.currency} {scannedData.tax.toFixed(2)}</span>
                  </div>
                )}
                {scannedData.tip && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tip</span>
                    <span className="font-medium">{scannedData.currency} {scannedData.tip.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="flex space-x-3">
                <Button variant="secondary" className="flex-1 rounded-xl" onClick={resetScan}>
                  Retry
                </Button>
                <Button className="flex-1 rounded-xl bg-primary hover:bg-primary/90" onClick={handleConfirm}>
                  Confirm
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bottom Controls */}
      {!scannedData && !isScanning && (
        <div className="fixed bottom-0 left-0 right-0 safe-area-bottom">
          <div className="p-6 bg-background/95 backdrop-blur-sm border-t border-border">
            <div className="max-w-md mx-auto">
              <Button
                className="w-full h-14 bg-primary hover:bg-primary/90 text-lg font-medium rounded-2xl"
                onClick={triggerCameraOptions}
                disabled={isScanning}
              >
                <Camera className="h-6 w-6 mr-3" />
                Scan Receipt
              </Button>

              {/* Hidden file input that triggers native iPhone camera/photo options */}
              <input 
                ref={fileInputRef} 
                type="file" 
                accept="image/*" 
                capture="environment"
                className="hidden" 
                onChange={handleFileUpload} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


