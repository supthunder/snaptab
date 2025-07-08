"use client"

import { useState } from "react"
import { Camera, Plus, Users, DollarSign, Settings, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  const [activeTrip] = useState({
    id: "1",
    name: "Tokyo Adventure",
    members: 4,
    totalExpenses: 1247.5,
    yourBalance: -89.25,
    currency: "USD",
  })

  const recentExpenses = [
    { id: "1", description: "Dinner at Sushi Zen", amount: 180.0, paidBy: "You", date: "2 hours ago" },
    { id: "2", description: "Train tickets", amount: 45.5, paidBy: "Sarah", date: "5 hours ago" },
    { id: "3", description: "Hotel booking", amount: 320.0, paidBy: "Mike", date: "1 day ago" },
  ]

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 pt-12">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">SnapTab</h1>
          <Button variant="ghost" size="icon" className="text-white">
            <Settings className="h-5 w-5" />
          </Button>
        </div>

        {/* Current Trip Card */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              {activeTrip.name}
              <span className="text-sm font-normal flex items-center">
                <Users className="h-4 w-4 mr-1" />
                {activeTrip.members}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm opacity-90">Your balance</p>
                <p className={`text-xl font-bold ${activeTrip.yourBalance < 0 ? "text-red-200" : "text-green-200"}`}>
                  {activeTrip.yourBalance < 0 ? "-" : "+"}${Math.abs(activeTrip.yourBalance).toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-90">Total spent</p>
                <p className="text-xl font-bold">${activeTrip.totalExpenses.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 space-y-4">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            className="h-16 bg-blue-600 hover:bg-blue-700 flex flex-col items-center justify-center space-y-1"
            onClick={() => (window.location.href = "/scan")}
          >
            <Camera className="h-6 w-6" />
            <span className="text-sm">Scan Receipt</span>
          </Button>
          <Button
            variant="outline"
            className="h-16 flex flex-col items-center justify-center space-y-1 bg-transparent"
            onClick={() => (window.location.href = "/add-expense")}
          >
            <Plus className="h-6 w-6" />
            <span className="text-sm">Add Expense</span>
          </Button>
        </div>

        {/* Recent Expenses */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Recent Expenses</h2>
            <Button variant="ghost" size="sm" onClick={() => (window.location.href = "/expenses")}>
              View All <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <div className="space-y-2">
            {recentExpenses.map((expense) => (
              <Card key={expense.id} className="border-gray-200">
                <CardContent className="p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{expense.description}</p>
                      <p className="text-sm text-gray-500">
                        Paid by {expense.paidBy} • {expense.date}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">${expense.amount.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Balance Summary */}
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Settlement</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => (window.location.href = "/settlement")}>
                View Details
              </Button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {activeTrip.yourBalance < 0
                ? `You owe $${Math.abs(activeTrip.yourBalance).toFixed(2)} to the group`
                : `The group owes you $${activeTrip.yourBalance.toFixed(2)}`}
            </p>
          </CardContent>
        </Card>
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-200 p-2">
        <div className="flex justify-around">
          <Button variant="ghost" className="flex flex-col items-center py-2 text-blue-600">
            <DollarSign className="h-5 w-5" />
            <span className="text-xs mt-1">Home</span>
          </Button>
          <Button
            variant="ghost"
            className="flex flex-col items-center py-2"
            onClick={() => (window.location.href = "/expenses")}
          >
            <Plus className="h-5 w-5" />
            <span className="text-xs mt-1">Expenses</span>
          </Button>
          <Button
            variant="ghost"
            className="flex flex-col items-center py-2"
            onClick={() => (window.location.href = "/trips")}
          >
            <Users className="h-5 w-5" />
            <span className="text-xs mt-1">Trips</span>
          </Button>
          <Button variant="ghost" className="flex flex-col items-center py-2">
            <Settings className="h-5 w-5" />
            <span className="text-xs mt-1">Settings</span>
          </Button>
        </div>
      </nav>
    </div>
  )
}
