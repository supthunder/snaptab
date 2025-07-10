# SnapTab

<div align="center">
  <img src="logo.png" alt="SnapTab Logo" width="300"/>
</div>

**The fastest way to track and split group travel expenses**

SnapTab is a mobile-first Progressive Web App (PWA) that eliminates the friction of managing group expenses during travel. Simply snap a photo of any receipt, and our AI-powered scanner instantly extracts the details, splits the cost among your group, and keeps a running tally. No more spreadsheets, no more awkward conversations about money.

## 🚀 Key Features

### 📸 AI-Powered Receipt Scanner
- **Snap & Parse**: Take a photo of any receipt and let AI extract the total, merchant, and date
- **Smart Auto-Fill**: Expense forms are automatically populated with extracted data
- **Manual Fallback**: Easy manual entry for cash expenses or when receipts aren't available

### 👥 Effortless Group Management
- **Simple Invites**: Share a link to add friends to your trip
- **Auto-Split**: Expenses are automatically split equally among all group members
- **Flexible Splitting**: Customize who pays for what with easy checkboxes

### 💰 Real-Time Expense Tracking
- **Live Dashboard**: See your current balance at a glance
- **Expense Feed**: Chronological view of all trip expenses
- **Smart Settlements**: Calculates the minimum transactions needed to settle all debts

### 📱 Progressive Web App
- **Install on Home Screen**: Works like a native app
- **Offline Access**: View cached data even without internet
- **Cross-Platform**: Works on iOS, Android, and desktop

## 🛠 Technical Stack

### Frontend & Framework
- **Next.js 14** (App Router) - Modern React framework with Server Components
- **Tailwind CSS** - Utility-first CSS for rapid, responsive development
- **PWA Support** - Installable web app with offline capabilities

### Backend & Database
- **Vercel** - Seamless deployment and serverless functions
- **Vercel Postgres** - Serverless PostgreSQL database
- **Prisma** - Type-safe database ORM
- **NextAuth.js (v5)** - Authentication with Google, Apple, and email support

### AI & Storage
- **OpenAI GPT-4 Vision API** - Advanced receipt image analysis
- **Vercel Blob** - Secure image storage for receipts
- **Server Actions** - Secure backend logic without separate API endpoints

## 🎯 Core User Journey

### 1. Trip Setup (Pre-Travel)
1. **Sign Up**: Quick registration with Google, Apple, or email
2. **Create Trip**: Add trip name and select base currency
3. **Invite Friends**: Share a unique link for easy group joining

### 2. Expense Tracking (During Travel)
1. **Snap Receipt**: Use the camera to capture any receipt
2. **AI Processing**: Advanced AI extracts total, merchant, and date
3. **Review & Confirm**: Verify details and adjust split if needed
4. **Save**: Expense is added to the group feed instantly

### 3. Live Tracking
- **Balance Overview**: Clear status showing what you owe or are owed
- **Expense Feed**: Complete history of all group expenses
- **Real-Time Updates**: Everyone sees new expenses immediately

### 4. Settlement (Post-Travel)
- **Smart Calculations**: Optimized debt resolution with minimum transactions
- **Clear Breakdown**: See exactly who owes whom and how much
- **Settlement Tracking**: Mark debts as paid to clear balances

## 🗃 Data Models

```prisma
model User {
  id           String        @id @default(cuid())
  name         String?
  email        String        @unique
  image        String?
  trips        TripMember[]
  expensesPaid Expense[]
}

model Trip {
  id           String        @id @default(cuid())
  name         String
  baseCurrency String        @default("USD")
  createdAt    DateTime      @default(now())
  members      TripMember[]
  expenses     Expense[]
}

model TripMember {
  id     String @id @default(cuid())
  trip   Trip   @relation(fields: [tripId], references: [id])
  tripId String
  user   User   @relation(fields: [userId], references: [id])
  userId String
}

model Expense {
  id              String         @id @default(cuid())
  trip            Trip           @relation(fields: [tripId], references: [id])
  tripId          String
  description     String
  amount          Float
  currency        String
  receiptImageUrl String?
  date            DateTime       @default(now())
  paidBy          User           @relation(fields: [paidById], references: [id])
  paidById        String
  splits          ExpenseSplit[]
}

model ExpenseSplit {
  id         String  @id @default(cuid())
  expense    Expense @relation(fields: [expenseId], references: [id])
  expenseId  String
  userId     String
  amountOwed Float
}
```

## 🔄 AI Processing Flow

### Receipt Analysis Process
1. **Image Upload**: Receipt photo is securely uploaded to Vercel Blob
2. **AI Analysis**: OpenAI GPT-4 Vision processes the image with a specialized prompt
3. **Data Extraction**: AI returns structured JSON with:
   - Total amount
   - Currency (ISO 4217 code)
   - Merchant name
   - Transaction date
4. **Auto-Fill**: Expense form is populated with extracted data
5. **User Confirmation**: Review and edit before saving

### AI Prompt Engineering
```
You are an expert financial assistant API. Analyze the provided receipt image.
Your task is to extract the following information and return it ONLY as a valid JSON object.

The required JSON keys are:
- "total": The grand total amount as a number (e.g., 125.50)
- "currency": The ISO 4217 currency code as a string (e.g., "USD", "JPY", "EUR")
- "merchantName": The name of the merchant/store as a string
- "transactionDate": The date of the transaction in ISO 8601 format (YYYY-MM-DD)

If you cannot determine a value, use `null`.
```

## 🎯 MVP Features

### Must-Have (Launch)
- ✅ Email/Google authentication
- ✅ Trip creation with currency selection
- ✅ Member invitations via shareable links
- ✅ AI-powered receipt scanning
- ✅ Manual expense entry fallback
- ✅ Expense feed and balance tracking
- ✅ Settlement calculations
- ✅ Full PWA functionality

### Should-Have (Post-MVP)
- 🔄 Expense editing and deletion
- 🔄 Push notifications for new expenses
- 🔄 Advanced split options (percentage, shares, exact amounts)
- 🔄 User profiles and settings

### Could-Have (Future)
- 🔮 Multi-currency support with conversion
- 🔮 In-app payment integration
- 🔮 PDF/CSV export
- 🔮 Trip budgeting features
- 🔮 Freemium model with Pro subscription

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and pnpm
- Vercel account
- OpenAI API key
- PostgreSQL database (Vercel Postgres recommended)

### Environment Variables
```bash
# Database
POSTGRES_PRISMA_URL=
POSTGRES_URL_NON_POOLING=

# Authentication
NEXTAUTH_URL=
NEXTAUTH_SECRET=

# OpenAI
OPENAI_API_KEY=

# Blob Storage
BLOB_READ_WRITE_TOKEN=
```

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/snaptab.git
cd snaptab

# Install dependencies
pnpm install

# Set up database
pnpm prisma migrate dev

# Start development server
pnpm dev
```

## 📱 PWA Features

- **Installable**: Add to home screen on mobile devices
- **Offline Ready**: Cached data available without internet
- **Fast Loading**: Optimized for mobile performance
- **Push Notifications**: Stay updated on group expenses

## 🔒 Security & Privacy

- **Secure Authentication**: Industry-standard OAuth and credential handling
- **Data Encryption**: All sensitive data encrypted in transit and at rest
- **Privacy First**: Minimal data collection, no tracking
- **Receipt Security**: Images stored securely with access controls

## 📊 Performance Optimization

- **Server Components**: Fast initial page loads
- **Image Optimization**: Automatic image compression and optimization
- **Caching Strategy**: Smart caching for offline functionality
- **Serverless Architecture**: Scales automatically with usage

## 🤝 Contributing

We welcome contributions! Please read our contributing guidelines and code of conduct before submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- OpenAI for the powerful vision API
- Vercel for the excellent hosting platform
- Next.js team for the amazing framework
- Prisma for the type-safe database toolkit

---

**SnapTab** - Making group expenses simple, one snap at a time. 📸💰 