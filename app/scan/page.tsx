"use client"

import type React from "react"

import { useState, useRef } from "react"
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
      
      // Add items data if available
      if (scannedData.items && scannedData.items.length > 0) {
        params.set('items', JSON.stringify(scannedData.items))
      }
      
      window.location.href = `/add-expense?${params.toString()}`
    }
  }

  const triggerImageUpload = () => {
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

      {/* Main Content */}
      <div className="flex-1 mx-6 mb-32 rounded-2xl bg-card flex items-center justify-center">
        {!scannedData && !isScanning && !error && (
          <div className="text-center space-y-6">
            <div className="w-48 h-48 border-2 border-dashed border-muted rounded-2xl flex items-center justify-center">
              <div className="text-center">
                <Camera className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">Ready to scan receipt</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              Tap "Add Image" to take a photo or choose from your gallery
            </p>
          </div>
        )}

        {isScanning && (
          <div className="text-center space-y-6">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <div className="space-y-2">
              <p className="text-lg font-medium">Analyzing Receipt...</p>
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

      {/* Bottom Action Button - Large Circular */}
      {!scannedData && !isScanning && (
        <div className="fixed bottom-0 left-0 right-0 safe-area-bottom">
          <div className="p-8 bg-gradient-to-t from-background via-background/98 to-background/80 backdrop-blur-sm">
            <div className="max-w-md mx-auto flex justify-center">
              <Button
                className="h-20 w-20 bg-gradient-to-br from-primary via-primary to-primary/80 hover:from-primary/95 hover:via-primary/90 hover:to-primary/70 text-primary-foreground rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center group border-2 border-primary/20"
                onClick={triggerImageUpload}
                disabled={isScanning}
              >
                <Camera className="h-9 w-9 group-hover:scale-125 transition-transform duration-300" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input that triggers native camera/photo options */}
      <input 
        ref={fileInputRef} 
        type="file" 
        accept="image/*" 
        className="hidden" 
        onChange={handleFileUpload} 
      />
    </div>
  )
}


