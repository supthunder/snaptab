"use client"

import { ArrowLeft, ArrowRight, Check, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SettlementPage() {
  const settlements = [
    {
      id: "1",
      from: "You",
      to: "Mike",
      amount: 89.25,
      status: "pending",
    },
    {
      id: "2",
      from: "Sarah",
      to: "You",
      amount: 45.5,
      status: "pending",
    },
    {
      id: "3",
      from: "Emma",
      to: "Mike",
      amount: 12.75,
      status: "completed",
    },
  ]

  const balances = [
    { name: "You", balance: -89.25 },
    { name: "Sarah", balance: -45.5 },
    { name: "Mike", balance: 102.0 },
    { name: "Emma", balance: 32.75 },
  ]

  const handleMarkPaid = (settlementId: string) => {
    // Here you would update the settlement status
    console.log("Marking settlement as paid:", settlementId)
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4 pt-12">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="mr-3" onClick={() => window.history.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Settlement</h1>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Current Balances */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
              Current Balances
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {balances.map((person) => (
              <div key={person.name} className="flex justify-between items-center">
                <span className="font-medium">{person.name}</span>
                <span
                  className={`font-semibold ${
                    person.balance > 0 ? "text-green-600" : person.balance < 0 ? "text-red-600" : "text-gray-600"
                  }`}
                >
                  {person.balance > 0 ? "+" : ""}${person.balance.toFixed(2)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Suggested Settlements */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Suggested Settlements</CardTitle>
            <p className="text-sm text-gray-600">Minimum transactions to settle all debts</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {settlements.map((settlement) => (
              <div
                key={settlement.id}
                className={`p-4 rounded-lg border-2 ${
                  settlement.status === "completed" ? "border-green-200 bg-green-50" : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{settlement.from}</span>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{settlement.to}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg">${settlement.amount.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center space-x-2">
                    {settlement.status === "completed" ? (
                      <div className="flex items-center space-x-1 text-green-600">
                        <Check className="h-4 w-4" />
                        <span className="text-sm font-medium">Paid</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Pending</span>
                    )}
                  </div>

                  {settlement.status === "pending" && settlement.from === "You" && (
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => handleMarkPaid(settlement.id)}
                    >
                      Mark as Paid
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Settlement Summary */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="font-semibold text-gray-900 mb-2">Settlement Summary</h3>
              <p className="text-sm text-gray-600 mb-3">After all settlements are complete, everyone will be even.</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Total to settle</p>
                  <p className="font-semibold text-lg">$134.75</p>
                </div>
                <div>
                  <p className="text-gray-600">Transactions needed</p>
                  <p className="font-semibold text-lg">2</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="text-center text-sm text-gray-500 space-y-2">
          <p>💡 Tip: Mark payments as complete when money is transferred</p>
          <p>This helps keep everyone's balances accurate</p>
        </div>
      </main>
    </div>
  )
}
