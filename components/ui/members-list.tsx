import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Users, Edit3, Plus } from 'lucide-react'

interface Member {
  id: string
  username: string
  display_name?: string
  avatar_url?: string
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
  className = "" 
}: MembersListProps) {
  const visibleMembers = members.slice(0, maxVisible)
  const hiddenCount = members.length - maxVisible

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Member Avatars */}
      {visibleMembers.map((member, index) => (
        <div key={member.id} className="relative">
          <Avatar className="h-8 w-8 border-2 border-background shadow-sm">
            <AvatarImage 
              src={member.avatar_url} 
              alt={member.display_name || member.username}
            />
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {getInitials(member.display_name || member.username)}
            </AvatarFallback>
          </Avatar>
        </div>
      ))}

      {/* Hidden Members Count */}
      {hiddenCount > 0 && (
        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted/50 border-2 border-background shadow-sm">
          <span className="text-xs font-medium text-muted-foreground">
            +{hiddenCount}
          </span>
        </div>
      )}

      {/* Add Member Button */}
      {showAddButton && onAddClick && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddClick}
          className="h-8 w-8 p-0 rounded-full bg-muted/50 border-2 border-background hover:bg-muted/70"
        >
          <Plus className="h-4 w-4 text-muted-foreground" />
        </Button>
      )}

      {/* Edit Button */}
      {onEditClick && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onEditClick}
          className="h-6 w-6 p-0 rounded-full bg-muted/50 hover:bg-muted/70"
        >
          <Edit3 className="h-3 w-3 text-muted-foreground" />
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
}

export function MembersModal({ 
  members, 
  isOpen, 
  onClose, 
  onAddMember,
  onRemoveMember,
  canEdit = false 
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

          <div className="space-y-3">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage 
                      src={member.avatar_url} 
                      alt={member.display_name || member.username}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(member.display_name || member.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {member.display_name || member.username}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      @{member.username}
                    </p>
                  </div>
                </div>
                {canEdit && onRemoveMember && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveMember(member.id)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>

          {canEdit && onAddMember && (
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={onAddMember}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 