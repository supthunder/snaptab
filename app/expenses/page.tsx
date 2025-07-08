"use client"

import { useState } from "react"
import { ArrowLeft, Search, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function ExpensesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("all")

  const expenses = [
    {
      id: "1",
      description: "Dinner at Sushi Zen",
      amount: 180.0,
      paidBy: "You",
      date: "2024-01-15",
      category: "Food",
      splitBetween: ["You", "Sarah", "Mike", "Emma"],
      yourShare: 45.0,
    },
    {
      id: "2",
      description: "Train tickets to Kyoto",
      amount: 45.5,
      paidBy: "Sarah",
      date: "2024-01-15",
      category: "Transport",
      splitBetween: ["You", "Sarah", "Mike", "Emma"],
      yourShare: 11.38,
    },
    {
      id: "3",
      description: "Hotel booking - 2 nights",
      amount: 320.0,
      paidBy: "Mike",
      date: "2024-01-14",
      category: "Accommodation",
      splitBetween: ["You", "Sarah", "Mike", "Emma"],
      yourShare: 80.0,
    },
    {
      id: "4",
      description: "Groceries for breakfast",
      amount: 28.75,
      paidBy: "Emma",
      date: "2024-01-14",
      category: "Food",
      splitBetween: ["You", "Sarah", "Mike", "Emma"],
      yourShare: 7.19,
    },
    {
      id: "5",
      description: "Museum entrance fees",
      amount: 60.0,
      paidBy: "You",
      date: "2024-01-13",
      category: "Entertainment",
      splitBetween: ["You", "Sarah", "Mike"],
      yourShare: 20.0,
    },
  ]

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter =
      selectedFilter === "all" ||
      (selectedFilter === "paid-by-you" && expense.paidBy === "You") ||
      (selectedFilter === "paid-by-others" && expense.paidBy !== "You")
    return matchesSearch && matchesFilter
  })

  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const yourTotal = expenses.reduce((sum, expense) => sum + expense.yourShare, 0)

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4 pt-12">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="icon" className="mr-3" onClick={() => window.history.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">All Expenses</h1>
        </div>

        {/* Search and Filter */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex space-x-2">
            <Button
              variant={selectedFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFilter("all")}
              className="text-xs"
            >
              All
            </Button>
            <Button
              variant={selectedFilter === "paid-by-you" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFilter("paid-by-you")}
              className="text-xs"
            >
              Paid by You
            </Button>
            <Button
              variant={selectedFilter === "paid-by-others" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFilter("paid-by-others")}
              className="text-xs"
            >
              Paid by Others
            </Button>
          </div>
        </div>
      </header>

      {/* Summary */}
      <div className="p-4 bg-blue-50 border-b border-blue-100">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Spent</p>
            <p className="text-xl font-bold text-gray-900">${totalAmount.toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Your Share</p>
            <p className="text-xl font-bold text-blue-600">${yourTotal.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Expenses List */}
      <main className="flex-1 p-4 space-y-3 overflow-y-auto">
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-8">
            <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No expenses found</p>
            <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredExpenses.map((expense) => (
            <Card key={expense.id} className="border-gray-200">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{expense.description}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-sm text-gray-500">Paid by {expense.paidBy}</span>
                      <span className="text-gray-300">•</span>
                      <span className="text-sm text-gray-500">{expense.date}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${expense.amount.toFixed(2)}</p>
                    <p className="text-sm text-blue-600">Your share: ${expense.yourShare.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex items-center space-x-1">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{expense.category}</span>
                  </div>
                  <div className="text-xs text-gray-500">Split {expense.splitBetween.length} ways</div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </main>
    </div>
  )
}
