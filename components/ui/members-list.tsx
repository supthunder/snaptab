"use client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Edit3, Plus } from "lucide-react"

interface Member {
  id: string
  username: string
  display_name?: string
  avatar_url?: string
  created_at?: string
}

interface MembersListProps {
  members: Member[]
  maxVisible?: number
  showAddButton?: boolean
  onAddClick?: () => void
  onEditClick?: () => void
  className?: string
}

export function MembersList({
  members,
  maxVisible = 4,
  showAddButton = false,
  onAddClick,
  onEditClick,
  className = "",
}: MembersListProps) {
  const visibleMembers = members.slice(0, maxVisible)
  const hiddenCount = members.length - maxVisible

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  // Generate consistent color for user based on their ID/username
  const getUserColor = (userId: string, username: string) => {
    const colors = [
      { bg: "bg-red-500", text: "text-white" },
      { bg: "bg-blue-500", text: "text-white" },
      { bg: "bg-green-500", text: "text-white" },
      { bg: "bg-purple-500", text: "text-white" },
      { bg: "bg-pink-500", text: "text-white" },
      { bg: "bg-indigo-500", text: "text-white" },
      { bg: "bg-orange-500", text: "text-white" },
      { bg: "bg-teal-500", text: "text-white" },
      { bg: "bg-cyan-500", text: "text-white" },
      { bg: "bg-emerald-500", text: "text-white" },
      { bg: "bg-violet-500", text: "text-white" },
      { bg: "bg-rose-500", text: "text-white" },
    ]

    // Simple hash function to get consistent color
    const hashString = (str: string) => {
      let hash = 0
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to 32-bit integer
      }
      return Math.abs(hash)
    }

    const hash = hashString(userId + username)
    const colorIndex = hash % colors.length
    return colors[colorIndex]
  }

  return (
    <div className={`inline-flex items-center bg-card rounded-full p-1 shadow-sm border border-border ${className}`}>
      {/* Member Avatars - Stacked with better overlap */}
      <div className="flex items-center">
        {visibleMembers.map((member, index) => {
          const userColor = getUserColor(member.id, member.username)
          return (
            <div
              key={member.id}
              className="relative"
              style={{
                marginLeft: index > 0 ? "-12px" : "0",
                zIndex: visibleMembers.length - index,
              }}
            >
              <Avatar className="h-10 w-10 border-2 border-background shadow-sm ring-1 ring-border">
                <AvatarImage
                  src={member.avatar_url}
                  alt={member.username}
                  className="object-cover"
                />
                <AvatarFallback 
                  className={`text-sm font-medium ${
                    member.avatar_url 
                      ? "bg-primary/10 text-primary" 
                      : `${userColor.bg} ${userColor.text}`
                  }`}
                >
                  {getInitials(member.username)}
                </AvatarFallback>
              </Avatar>
            </div>
          )
        })}

        {/* Hidden Members Count */}
        {hiddenCount > 0 && (
          <div
            className="flex items-center justify-center h-10 w-10 rounded-full bg-muted border-2 border-background shadow-sm ring-1 ring-border"
            style={{
              marginLeft: visibleMembers.length > 0 ? "-12px" : "0",
              zIndex: 0,
            }}
          >
            <span className="text-sm font-semibold text-muted-foreground">+{hiddenCount}</span>
          </div>
        )}
      </div>

      {/* Edit Button */}
      {onEditClick && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onEditClick}
          className="h-10 w-10 p-0 rounded-full bg-muted/50 hover:bg-muted/70 border-2 border-background shadow-sm ring-1 ring-border ml-2"
        >
          <Edit3 className="h-4 w-4 text-muted-foreground" />
        </Button>
      )}

      {/* Add Member Button */}
      {showAddButton && onAddClick && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddClick}
          className="h-10 w-10 p-0 rounded-full bg-muted/50 hover:bg-muted/70 border-2 border-background shadow-sm ring-1 ring-border ml-2"
        >
          <Plus className="h-4 w-4 text-muted-foreground" />
        </Button>
      )}
    </div>
  )
}

// Expanded Members Modal Component
interface MembersModalProps {
  members: Member[]
  isOpen: boolean
  onClose: () => void
  onAddMember?: () => void
  onRemoveMember?: (memberId: string) => void
  canEdit?: boolean
  hasExpenses?: boolean
  expenseCount?: number
}

export function MembersModal({ 
  members, 
  isOpen, 
  onClose, 
  onAddMember,
  onRemoveMember,
  canEdit = false,
  hasExpenses = false,
  expenseCount = 0
}: MembersModalProps) {
  if (!isOpen) return null

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Generate consistent color for user based on their ID/username
  const getUserColor = (userId: string, username: string) => {
    const colors = [
      { bg: "bg-red-500", text: "text-white" },
      { bg: "bg-blue-500", text: "text-white" },
      { bg: "bg-green-500", text: "text-white" },
      { bg: "bg-purple-500", text: "text-white" },
      { bg: "bg-pink-500", text: "text-white" },
      { bg: "bg-indigo-500", text: "text-white" },
      { bg: "bg-orange-500", text: "text-white" },
      { bg: "bg-teal-500", text: "text-white" },
      { bg: "bg-cyan-500", text: "text-white" },
      { bg: "bg-emerald-500", text: "text-white" },
      { bg: "bg-violet-500", text: "text-white" },
      { bg: "bg-rose-500", text: "text-white" },
    ]

    // Simple hash function to get consistent color
    const hashString = (str: string) => {
      let hash = 0
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to 32-bit integer
      }
      return Math.abs(hash)
    }

    const hash = hashString(userId + username)
    const colorIndex = hash % colors.length
    return colors[colorIndex]
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Trip Members</h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>

          {hasExpenses && (
            <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium mb-1">
                Cannot remove members
              </p>
              <p className="text-xs text-yellow-600/80 dark:text-yellow-400/80">
                This trip has {expenseCount} expense{expenseCount > 1 ? 's' : ''}. Members involved in expense splitting cannot be removed.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {members.map((member) => {
              const userColor = getUserColor(member.id, member.username)
              return (
                <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={member.avatar_url}
                        alt={member.username}
                      />
                      <AvatarFallback 
                        className={`font-medium ${
                          member.avatar_url 
                            ? "bg-primary/10 text-primary" 
                            : `${userColor.bg} ${userColor.text}`
                        }`}
                      >
                        {getInitials(member.username)}
                      </AvatarFallback>
                    </Avatar>
                  <div>
                    <p className="font-medium">{member.username}</p>
                    <p className="text-sm text-muted-foreground">Member since {new Date(member.created_at || Date.now()).toLocaleDateString()}</p>
                  </div>
                </div>
                {canEdit && onRemoveMember && member.username !== localStorage.getItem('snapTab_username') && !hasExpenses && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveMember(member.id)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    Remove
                  </Button>
                )}
                {canEdit && onRemoveMember && member.username !== localStorage.getItem('snapTab_username') && hasExpenses && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled
                    className="text-muted-foreground cursor-not-allowed"
                  >
                    Remove
                  </Button>
                )}
                {member.username === localStorage.getItem('snapTab_username') && (
                  <span className="text-xs text-muted-foreground px-3 py-2">You</span>
                )}
              </div>
                )
            })}
          </div>

          {canEdit && onAddMember && (
            <Button variant="outline" className="w-full mt-4 bg-transparent" onClick={onAddMember}>
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 