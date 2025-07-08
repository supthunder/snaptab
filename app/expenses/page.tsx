"use client"

import { useState } from "react"
import { ArrowLeft, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function ExpensesPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const expenses = [
    {
      id: "1",
      description: "Dinner at Sushi Zen",
      amount: 180.0,
      paidBy: "You",
      date: "Jan 15",
      yourShare: 45.0,
    },
    {
      id: "2",
      description: "Train tickets to Kyoto",
      amount: 45.5,
      paidBy: "Sarah",
      date: "Jan 15",
      yourShare: 11.38,
    },
    {
      id: "3",
      description: "Hotel booking - 2 nights",
      amount: 320.0,
      paidBy: "Mike",
      date: "Jan 14",
      yourShare: 80.0,
    },
    {
      id: "4",
      description: "Groceries for breakfast",
      amount: 28.75,
      paidBy: "Emma",
      date: "Jan 14",
      yourShare: 7.19,
    },
    {
      id: "5",
      description: "Museum entrance fees",
      amount: 60.0,
      paidBy: "You",
      date: "Jan 13",
      yourShare: 20.0,
    },
  ]

  const filteredExpenses = expenses.filter((expense) =>
    expense.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const yourTotal = expenses.reduce((sum, expense) => sum + expense.yourShare, 0)

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="p-6 pt-16">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" className="mr-4" onClick={() => window.history.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-medium">All Expenses</h1>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-12 bg-card border-border rounded-2xl"
          />
        </div>

        {/* Summary */}
        <Card className="minimal-card mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-6 text-center">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Total Spent</p>
                <p className="text-2xl font-light">${totalAmount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm mb-1">Your Share</p>
                <p className="text-2xl font-light text-primary">${yourTotal.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </header>

      {/* Expenses List */}
      <main className="flex-1 px-6 pb-6 overflow-y-auto">
        <div className="space-y-3">
          {filteredExpenses.map((expense) => (
            <Card key={expense.id} className="minimal-card">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium mb-1">{expense.description}</h3>
                    <p className="text-sm text-muted-foreground">
                      {expense.paidBy} • {expense.date}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-lg">${expense.amount.toFixed(2)}</p>
                    <p className="text-sm text-primary">Your share: ${expense.yourShare.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
