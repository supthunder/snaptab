"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Calculator, Percent, DollarSign } from "lucide-react"

interface TripMember {
  id: string
  name: string
  email: string
}

interface SplitOption {
  userId: string
  amount: number
  percentage?: number
  shares?: number
}

interface AdvancedSplitDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (splits: SplitOption[]) => void
  totalAmount: number
  tripMembers: TripMember[]
  currency: string
}

type SplitMethod = "equal" | "percentage" | "shares" | "exact"

export function AdvancedSplitDialog({
  isOpen,
  onClose,
  onConfirm,
  totalAmount,
  tripMembers,
  currency
}: AdvancedSplitDialogProps) {
  const [splitMethod, setSplitMethod] = useState<SplitMethod>("equal")
  const [splits, setSplits] = useState<SplitOption[]>(
    tripMembers.map(member => ({
      userId: member.id,
      amount: totalAmount / tripMembers.length,
      percentage: 100 / tripMembers.length,
      shares: 1
    }))
  )

  const updateSplit = (userId: string, field: keyof SplitOption, value: number) => {
    setSplits(prev => prev.map(split => {
      if (split.userId === userId) {
        const updated = { ...split, [field]: value }
        
        // Auto-calculate based on split method
        if (splitMethod === "percentage" && field === "percentage") {
          updated.amount = (totalAmount * value) / 100
        } else if (splitMethod === "shares" && field === "shares") {
          const totalShares = splits.reduce((sum, s) => 
            s.userId === userId ? sum + value : sum + (s.shares || 1), 0
          )
          updated.amount = (totalAmount * value) / totalShares
        }
        
        return updated
      }
      return split
    }))
  }

  const recalculateShares = () => {
    if (splitMethod === "shares") {
      const totalShares = splits.reduce((sum, split) => sum + (split.shares || 1), 0)
      setSplits(prev => prev.map(split => ({
        ...split,
        amount: (totalAmount * (split.shares || 1)) / totalShares
      })))
    }
  }

  const getCurrentTotal = () => {
    return splits.reduce((sum, split) => sum + split.amount, 0)
  }

  const isValidSplit = () => {
    const total = getCurrentTotal()
    return Math.abs(total - totalAmount) < 0.01 // Allow for rounding differences
  }

  const handleMethodChange = (method: SplitMethod) => {
    setSplitMethod(method)
    
    if (method === "equal") {
      const equalAmount = totalAmount / tripMembers.length
      setSplits(prev => prev.map(split => ({
        ...split,
        amount: equalAmount,
        percentage: 100 / tripMembers.length,
        shares: 1
      })))
    } else if (method === "percentage") {
      const equalPercentage = 100 / tripMembers.length
      setSplits(prev => prev.map(split => ({
        ...split,
        percentage: equalPercentage,
        amount: (totalAmount * equalPercentage) / 100
      })))
    } else if (method === "shares") {
      setSplits(prev => prev.map(split => ({
        ...split,
        shares: 1,
        amount: totalAmount / tripMembers.length
      })))
    }
  }

  const handleConfirm = () => {
    if (isValidSplit()) {
      onConfirm(splits.filter(split => split.amount > 0))
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Advanced Split Options</DialogTitle>
          <DialogDescription>
            Choose how to split {currency} {totalAmount.toFixed(2)} among {tripMembers.length} members
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Split Method Selection */}
          <div className="space-y-3">
            <Label>Split Method</Label>
            <Select value={splitMethod} onValueChange={handleMethodChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equal">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>Equal Split</span>
                  </div>
                </SelectItem>
                <SelectItem value="percentage">
                  <div className="flex items-center space-x-2">
                    <Percent className="h-4 w-4" />
                    <span>By Percentage</span>
                  </div>
                </SelectItem>
                <SelectItem value="shares">
                  <div className="flex items-center space-x-2">
                    <Calculator className="h-4 w-4" />
                    <span>By Shares</span>
                  </div>
                </SelectItem>
                <SelectItem value="exact">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4" />
                    <span>Exact Amounts</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Member Split Configuration */}
          <div className="space-y-3">
            <Label>Configure Split</Label>
            <div className="space-y-3">
              {tripMembers.map((member) => {
                const split = splits.find(s => s.userId === member.id)
                if (!split) return null

                return (
                  <Card key={member.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          {splitMethod === "percentage" && (
                            <div className="space-y-1">
                              <Label className="text-xs">Percentage</Label>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={split.percentage || 0}
                                onChange={(e) => updateSplit(member.id, "percentage", parseFloat(e.target.value))}
                                className="w-20"
                              />
                            </div>
                          )}
                          
                          {splitMethod === "shares" && (
                            <div className="space-y-1">
                              <Label className="text-xs">Shares</Label>
                              <Input
                                type="number"
                                min="0"
                                step="1"
                                value={split.shares || 0}
                                onChange={(e) => {
                                  updateSplit(member.id, "shares", parseInt(e.target.value))
                                  recalculateShares()
                                }}
                                className="w-20"
                              />
                            </div>
                          )}
                          
                          {splitMethod === "exact" && (
                            <div className="space-y-1">
                              <Label className="text-xs">Amount</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={split.amount}
                                onChange={(e) => updateSplit(member.id, "amount", parseFloat(e.target.value))}
                                className="w-24"
                              />
                            </div>
                          )}
                          
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {currency} {split.amount.toFixed(2)}
                            </p>
                            {splitMethod === "percentage" && (
                              <p className="text-xs text-muted-foreground">
                                {split.percentage?.toFixed(1)}%
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Summary */}
          <Card className={`${isValidSplit() ? 'border-green-200' : 'border-red-200'}`}>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total</span>
                <div className="text-right">
                  <p className={`font-medium ${isValidSplit() ? 'text-green-600' : 'text-red-600'}`}>
                    {currency} {getCurrentTotal().toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    of {currency} {totalAmount.toFixed(2)}
                  </p>
                </div>
              </div>
              {!isValidSplit() && (
                <p className="text-sm text-red-600 mt-2">
                  Split amounts must total exactly {currency} {totalAmount.toFixed(2)}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!isValidSplit()}>
            Apply Split
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}