"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ArrowLeft, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AddExpensePage() {
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    paidBy: "You",
  })

  const [splitWith] = useState<string[]>(["You", "Sarah", "Mike", "Emma"])
  const [selectedMembers, setSelectedMembers] = useState<string[]>(["You", "Sarah", "Mike", "Emma"])

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const amount = urlParams.get("amount")
    const merchant = urlParams.get("merchant")
    const date = urlParams.get("date")

    if (amount || merchant || date) {
      setFormData((prev) => ({
        ...prev,
        amount: amount || prev.amount,
        description: merchant || prev.description,
        date: date || prev.date,
      }))
    }
  }, [])

  const handleMemberToggle = (member: string) => {
    if (member === "You") return

    setSelectedMembers((prev) => (prev.includes(member) ? prev.filter((m) => m !== member) : [...prev, member]))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Saving expense:", { ...formData, splitWith: selectedMembers })
    alert("Expense added successfully!")
    window.location.href = "/"
  }

  const splitAmount = Number.parseFloat(formData.amount) / selectedMembers.length || 0

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="p-6 pt-16 safe-area-top flex items-center">
        <Button variant="ghost" size="icon" className="mr-4" onClick={() => window.history.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-medium">Add Expense</h1>
      </header>

      {/* Form */}
      <main className="flex-1 px-6 pb-32 overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Details */}
          <Card className="minimal-card">
            <CardContent className="p-6 space-y-4">
              <div>
                <Label htmlFor="description" className="text-muted-foreground text-sm">
                  Description
                </Label>
                <Input
                  id="description"
                  placeholder="What was this for?"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="mt-2 bg-background border-border rounded-xl h-12"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount" className="text-muted-foreground text-sm">
                    Amount
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                    className="mt-2 bg-background border-border rounded-xl h-12"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="date" className="text-muted-foreground text-sm">
                    Date
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                    className="mt-2 bg-background border-border rounded-xl h-12"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Split Between */}
          <Card className="minimal-card">
            <CardContent className="p-6">
              <h3 className="font-medium mb-4">Split between</h3>
              <div className="space-y-3">
                {splitWith.map((member) => (
                  <div
                    key={member}
                    className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-colors ${
                      selectedMembers.includes(member)
                        ? "bg-primary/10 border border-primary/20"
                        : "bg-background border border-border"
                    } ${member === "You" ? "opacity-100" : ""}`}
                    onClick={() => handleMemberToggle(member)}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          selectedMembers.includes(member) ? "border-primary bg-primary" : "border-muted-foreground"
                        }`}
                      >
                        {selectedMembers.includes(member) && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <span className="font-medium">{member}</span>
                    </div>
                    {selectedMembers.includes(member) && formData.amount && (
                      <span className="text-primary font-medium">${splitAmount.toFixed(2)}</span>
                    )}
                  </div>
                ))}
              </div>

              {formData.amount && (
                <div className="mt-4 p-4 bg-background rounded-xl border border-border">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Total amount</span>
                    <span className="font-medium">${Number.parseFloat(formData.amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Split {selectedMembers.length} ways</span>
                    <span className="font-medium text-primary">${splitAmount.toFixed(2)} each</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </form>
      </main>

      {/* Bottom Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 safe-area-bottom">
        <div className="p-6 bg-background/95 backdrop-blur-sm border-t border-border">
          <div className="max-w-md mx-auto">
            <Button
              type="submit"
              className="w-full h-14 bg-primary hover:bg-primary/90 text-lg font-medium rounded-2xl"
              disabled={!formData.description || !formData.amount}
              onClick={handleSubmit}
            >
              Add Expense
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
