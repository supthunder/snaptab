# SnapTab Development Todos

## In Progress
- (No active development tasks)

## Latest Milestone ✅
- **passkey3 Branch Merged to Main** (2025-01-12) - Successfully merged all recent features including stacked avatars, member removal, trip code display, and expense-based active status logic

## Pending Features
- 🧮 **Settlement System Implementation**: Create settlement page showing who owes money to whom with optimal payment transactions to minimize the number of transfers needed
- 💳 **Settlement UI Components**: Build settlement interface showing individual balances, suggested payments, and "Mark as Paid" functionality 
- 📊 **Payment Tracking**: Track which settlement payments have been completed and update balances accordingly
- 💸 **Receipt Payment Calculator**: Calculate final amount user needs to pay and show exactly who to pay it to - provide clear actionable payment instructions from receipt/expense data
- 📝 **Manual Trip Completion**: Add manual trip completion feature - allow users to mark trips as 'done/completed' manually
- 📊 **Trip Analytics**: Add basic analytics/insights for completed trips
- 🔗 **Trip Sharing**: Easy trip code sharing via links or QR codes
- 📱 **Push Notifications**: Notify members when expenses are added or trip is updated
- 💰 **Settlement Optimization**: Suggest optimal payment flows to minimize transactions
- 📄 **Export Functionality**: Export trip expenses to PDF/CSV

## Completed
- ✅ **Animated Balance Card Expansion**: Implemented smooth fluid expansion of "Your balance to pay" card with:
  - **Fluid Animation**: 300ms CSS transitions with height/opacity changes
  - **Settlement Details**: Shows exactly who you owe money to with amounts and descriptions
  - **Payment Tracking**: Interactive checkboxes to mark individual payments as completed
  - **Visual States**: Color-coded unpaid (red) vs paid (green) items with staggered animations
  - **Real-time Updates**: Immediate visual feedback when marking payments complete
  - **Professional UX**: Chevron indicators, loading states, and smooth expand/collapse
- ✅ **Expense Deletion**: Implemented complete expense deletion with database integration, API endpoint, and frontend functionality  
- ✅ **Balance Calculation Fix**: Fixed home page balance to use actual database split data instead of simplified member division
- ✅ **Receipt Image Storage & Display**: Added complete receipt image storage in Vercel Blob with display in expense details
- ✅ **Username-Based Display**: Switched entire app to use usernames instead of display names for uniqueness and consistency
- ✅ **Database Split Mode Fix**: Fixed expense details to properly show splits from database - handles both even splits and item-level assignments correctly
- ✅ **Visual Item Assignment Display**: Enhanced expense details to show item assignments grouped by person with visual pill badges, matching add-expense page
- ✅ **User Display Names Fix**: Fixed expense details showing UUIDs instead of user display names in "Paid by" and "Split between" sections
- ✅ **Database Duplicate Cleanup**: Fixed React key duplication errors by removing duplicate trip members and improving React key handling
- ✅ **Database Amount Type Fix**: Fixed TypeError when viewing expense details - properly convert string amounts and item prices to numbers
- ✅ **Clean Profile UI**: Replaced large "Create New Trip" button with compact + icon next to header
- ✅ **Smart Profile Caching**: Intelligent caching to prevent excessive API calls on profile tab
- ✅ **Pull-to-Refresh for PWA**: Native mobile app gesture with animated feedback for page refresh
- ✅ **Random Solid Color Avatars**: Beautiful consistent colors for users without profile pictures
- ✅ **Trip Active Status Logic**: Update trip active logic - trips only become active when first expense is added
- ✅ **Member Removal Safety**: Implement expense-based member removal restrictions - only allow removal when trip has 0 expenses
- ✅ **Member Removal with Database Integration**: Remove members from trips with database updates
- ✅ **Stacked Avatar Display**: Beautiful overlapping member avatars
- ✅ **3-Column Balance Layout**: Clean trip summary card design
- ✅ **Onboarding Flow**: Complete animated onboarding experience
- ✅ **Database Integration**: Full Neon PostgreSQL database system
- ✅ **Receipt Scanning**: AI-powered receipt processing with OpenAI
- ✅ **Item-Level Splitting**: Split expenses by individual receipt items

## Future Considerations
- 🎨 **Dynamic Open Graph Invites**: Generate dynamic invite images with trip ID prominently displayed and background matching trip theme (e.g., "Caribbean Trip" gets tropical background, "NYC Weekend" gets city skyline) for beautiful trip sharing on social media
- 🌍 **Multi-Currency Support**: Handle expenses in different currencies with conversion
- 🔐 **Enhanced Security**: Add trip passwords or invite-only access
- 📸 **Receipt Gallery**: View all receipt images for a trip
- 📅 **Trip Templates**: Save and reuse trip configurations
- 🏷️ **Custom Categories**: User-defined expense categories
- 📈 **Expense Trends**: Track spending patterns over time 