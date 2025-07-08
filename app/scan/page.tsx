"use client"

import type React from "react"

import { useState, useRef } from "react"
import { ArrowLeft, Camera, Upload, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function ScanPage() {
  const [isScanning, setIsScanning] = useState(false)
  const [scannedData, setScannedData] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleScan = async () => {
    setIsScanning(true)

    // Simulate AI processing
    setTimeout(() => {
      setScannedData({
        total: 89.5,
        currency: "USD",
        merchantName: "Tokyo Ramen House",
        transactionDate: "2024-01-15",
        confidence: 0.95,
      })
      setIsScanning(false)
    }, 3000)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleScan()
    }
  }

  const handleConfirm = () => {
    // Navigate to add expense with pre-filled data
    const params = new URLSearchParams({
      amount: scannedData.total.toString(),
      merchant: scannedData.merchantName,
      date: scannedData.transactionDate,
    })
    window.location.href = `/add-expense?${params.toString()}`
  }

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Header */}
      <header className="bg-black text-white p-4 pt-12 flex items-center">
        <Button variant="ghost" size="icon" className="text-white mr-3" onClick={() => window.history.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Scan Receipt</h1>
      </header>

      {/* Camera View */}
      <div className="flex-1 relative bg-gray-900 flex items-center justify-center">
        {!scannedData && !isScanning && (
          <div className="text-center text-white space-y-4">
            <div className="w-64 h-64 border-2 border-dashed border-white/50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Camera className="h-12 w-12 mx-auto mb-2 text-white/70" />
                <p className="text-sm text-white/70">Position receipt in frame</p>
              </div>
            </div>
            <p className="text-sm text-white/80">Make sure the receipt is well-lit and all text is visible</p>
          </div>
        )}

        {isScanning && (
          <div className="text-center text-white space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-400" />
            <div className="space-y-2">
              <p className="text-lg font-medium">Analyzing receipt...</p>
              <p className="text-sm text-white/70">AI is extracting expense details</p>
            </div>
          </div>
        )}

        {scannedData && (
          <div className="absolute inset-4 flex items-center justify-center">
            <Card className="w-full max-w-sm bg-white">
              <CardContent className="p-6 space-y-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Camera className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Receipt Scanned!</h3>
                  <p className="text-sm text-gray-600">AI extracted the following details:</p>
                </div>

                <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Merchant:</span>
                    <span className="text-sm font-medium">{scannedData.merchantName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Amount:</span>
                    <span className="text-lg font-bold text-green-600">${scannedData.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Date:</span>
                    <span className="text-sm font-medium">{scannedData.transactionDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Confidence:</span>
                    <span className="text-sm font-medium text-green-600">
                      {(scannedData.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setScannedData(null)}>
                    Retry
                  </Button>
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleConfirm}>
                    Confirm
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      {!scannedData && !isScanning && (
        <div className="p-6 space-y-4">
          <Button className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-lg font-medium" onClick={handleScan}>
            <Camera className="h-6 w-6 mr-2" />
            Capture Receipt
          </Button>

          <div className="flex items-center space-x-4">
            <div className="flex-1 h-px bg-white/20"></div>
            <span className="text-white/60 text-sm">or</span>
            <div className="flex-1 h-px bg-white/20"></div>
          </div>

          <Button
            variant="outline"
            className="w-full h-12 border-white/30 text-white hover:bg-white/10 bg-transparent"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-5 w-5 mr-2" />
            Upload from Gallery
          </Button>

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
        </div>
      )}
    </div>
  )
}
