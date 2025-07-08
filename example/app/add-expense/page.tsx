"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ArrowLeft, DollarSign, Users, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AddExpensePage() {
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    paidBy: "You",
  })

  const [splitWith, setSplitWith] = useState<string[]>(["You", "Sarah", "Mike", "Emma"])
  const [selectedMembers, setSelectedMembers] = useState<string[]>(["You", "Sarah", "Mike", "Emma"])

  useEffect(() => {
    // Check for pre-filled data from receipt scan
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
    if (member === "You") return // Can't unselect yourself

    setSelectedMembers((prev) => (prev.includes(member) ? prev.filter((m) => m !== member) : [...prev, member]))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically save the expense
    console.log("Saving expense:", { ...formData, splitWith: selectedMembers })

    // Show success and redirect
    alert("Expense added successfully!")
    window.location.href = "/"
  }

  const splitAmount = Number.parseFloat(formData.amount) / selectedMembers.length || 0

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4 pt-12">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="mr-3" onClick={() => window.history.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Add Expense</h1>
        </div>
      </header>

      {/* Form */}
      <main className="flex-1 p-4 space-y-4 overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
                Expense Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="What was this expense for?"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="amount">Amount ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="paidBy">Paid by</Label>
                <select
                  id="paidBy"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={formData.paidBy}
                  onChange={(e) => setFormData((prev) => ({ ...prev, paidBy: e.target.value }))}
                >
                  {splitWith.map((member) => (
                    <option key={member} value={member}>
                      {member}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Split Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-600" />
                Split Between
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {splitWith.map((member) => (
                  <div
                    key={member}
                    className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedMembers.includes(member) ? "border-blue-200 bg-blue-50" : "border-gray-200 bg-gray-50"
                    } ${member === "You" ? "opacity-100" : ""}`}
                    onClick={() => handleMemberToggle(member)}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          selectedMembers.includes(member) ? "border-blue-600 bg-blue-600" : "border-gray-300"
                        }`}
                      >
                        {selectedMembers.includes(member) && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <span className="font-medium">{member}</span>
                      {member === "You" && <span className="text-xs text-gray-500">(required)</span>}
                    </div>
                    {selectedMembers.includes(member) && formData.amount && (
                      <span className="text-sm font-medium text-blue-600">${splitAmount.toFixed(2)}</span>
                    )}
                  </div>
                ))}
              </div>

              {formData.amount && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Total amount:</span>
                    <span className="font-medium">${Number.parseFloat(formData.amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Split {selectedMembers.length} ways:</span>
                    <span className="font-medium">${splitAmount.toFixed(2)} each</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-lg font-medium"
            disabled={!formData.description || !formData.amount}
          >
            Add Expense
          </Button>
        </form>
      </main>
    </div>
  )
}
