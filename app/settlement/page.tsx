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
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="p-6 pt-16">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="mr-4" onClick={() => window.history.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-medium">Settlement</h1>
        </div>
      </header>

      <main className="flex-1 px-6 pb-6 space-y-6 overflow-y-auto">
        {/* Current Balances */}
        <Card className="minimal-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-primary" />
              Current Balances
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {balances.map((person) => (
              <div key={person.name} className="flex justify-between items-center">
                <span className="font-medium">{person.name}</span>
                <span
                  className={`font-semibold ${
                    person.balance > 0 ? "text-green-400" : person.balance < 0 ? "text-red-400" : "text-muted-foreground"
                  }`}
                >
                  {person.balance > 0 ? "+" : ""}${person.balance.toFixed(2)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Suggested Settlements */}
        <Card className="minimal-card">
          <CardHeader>
            <CardTitle className="text-base">Suggested Settlements</CardTitle>
            <p className="text-sm text-muted-foreground">Minimum transactions to settle all debts</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {settlements.map((settlement) => (
              <div
                key={settlement.id}
                className={`p-4 rounded-xl border ${
                  settlement.status === "completed" ? "border-green-400/20 bg-green-400/10" : "border-border bg-background"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{settlement.from}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
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
                      <div className="flex items-center space-x-1 text-green-400">
                        <Check className="h-4 w-4" />
                        <span className="text-sm font-medium">Paid</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Pending</span>
                    )}
                  </div>

                  {settlement.status === "pending" && settlement.from === "You" && (
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/90 rounded-xl"
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
        <Card className="minimal-card bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="font-semibold mb-2">Settlement Summary</h3>
              <p className="text-sm text-muted-foreground mb-4">After all settlements are complete, everyone will be even.</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total to settle</p>
                  <p className="font-semibold text-lg">$134.75</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Transactions needed</p>
                  <p className="font-semibold text-lg">2</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p>💡 Tip: Mark payments as complete when money is transferred</p>
          <p>This helps keep everyone's balances accurate</p>
        </div>
      </main>
    </div>
  )
}
