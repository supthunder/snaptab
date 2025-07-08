"use client"

import { useState, useRef } from "react"
import { Camera, Plus, ArrowRight, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function HomePage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [activeTrip] = useState({
    id: "1",
    name: "Tokyo Adventure",
    members: 4,
    totalExpenses: 1247.5,
    yourBalance: -89.25,
    currency: "USD",
  })

  const [trips] = useState([
    {
      id: "1",
      name: "Tokyo Adventure",
      members: 4,
      totalExpenses: 1247.5,
      yourBalance: -89.25,
      currency: "USD",
      startDate: "2024-01-10",
      endDate: "2024-01-20",
      isActive: true,
    },
    {
      id: "2",
      name: "Paris Weekend",
      members: 3,
      totalExpenses: 890.0,
      yourBalance: 45.3,
      currency: "EUR",
      startDate: "2023-12-15",
      endDate: "2023-12-18",
      isActive: false,
    },
    {
      id: "3",
      name: "NYC Business Trip",
      members: 2,
      totalExpenses: 567.25,
      yourBalance: -12.5,
      currency: "USD",
      startDate: "2023-11-05",
      endDate: "2023-11-08",
      isActive: false,
    },
    {
      id: "4",
      name: "Bali Vacation",
      members: 6,
      totalExpenses: 2150.75,
      yourBalance: 125.8,
      currency: "USD",
      startDate: "2023-09-20",
      endDate: "2023-09-30",
      isActive: false,
    },
  ])

  const recentExpenses = [
    { id: "1", description: "Dinner at Sushi Zen", amount: 180.0, paidBy: "You", date: "2h" },
    { id: "2", description: "Train tickets", amount: 45.5, paidBy: "Sarah", date: "5h" },
    { id: "3", description: "Hotel booking", amount: 320.0, paidBy: "Mike", date: "1d" },
  ]

  const handleScanClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Store the file in sessionStorage and navigate to scan page
      // We'll let the scan page handle the actual processing
      const reader = new FileReader()
      reader.onload = () => {
        sessionStorage.setItem('pendingReceiptFile', JSON.stringify({
          name: file.name,
          type: file.type,
          data: reader.result
        }))
        window.location.href = "/scan"
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Minimal Header */}
      <header className="p-6 pt-16 safe-area-top">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => (window.location.href = "/trips")}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <h1 className="text-3xl font-light text-foreground mb-2">SnapTab</h1>
            <p className="text-muted-foreground text-sm">{activeTrip.name}</p>
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* Balance Card */}
        <Card className="minimal-card mb-6">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground text-sm mb-2">Your balance</p>
            <p className={`text-4xl font-light mb-4 ${activeTrip.yourBalance < 0 ? "text-red-400" : "text-green-400"}`}>
              {activeTrip.yourBalance < 0 ? "-" : "+"}${Math.abs(activeTrip.yourBalance).toFixed(2)}
            </p>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Total: ${activeTrip.totalExpenses.toFixed(2)}</span>
              <span>{activeTrip.members} members</span>
            </div>
          </CardContent>
        </Card>
      </header>

      {/* Recent Expenses */}
      <main className="flex-1 px-6 pb-32 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Recent</h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => (window.location.href = "/expenses")}
          >
            View all <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        <div className="space-y-3">
          {recentExpenses.map((expense) => (
            <Card key={expense.id} className="minimal-card">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{expense.description}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {expense.paidBy} • {expense.date}
                    </p>
                  </div>
                  <p className="text-lg font-medium">${expense.amount.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      {/* Bottom Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 safe-area-bottom">
        <div className="p-6 bg-background/95 backdrop-blur-sm border-t border-border">
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <Button
              className="h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl flex flex-col items-center justify-center space-y-1"
              onClick={handleScanClick}
            >
              <Camera className="h-6 w-6" />
              <span className="text-sm font-medium">Scan</span>
            </Button>
            <Button
              variant="secondary"
              className="h-14 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-2xl flex flex-col items-center justify-center space-y-1"
              onClick={() => (window.location.href = "/add-expense")}
            >
              <Plus className="h-6 w-6" />
              <span className="text-sm font-medium">Add</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Hidden file input for native camera/photo options */}
      <input 
        ref={fileInputRef} 
        type="file" 
        accept="image/*" 
        capture="environment"
        className="hidden" 
        onChange={handleFileUpload} 
      />
    </div>
  )
}
