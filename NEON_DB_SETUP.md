# 🚀 Neon Database Setup Guide for SnapTab

## Overview
This guide helps you set up your existing Vercel Neon PostgreSQL database to work with SnapTab, replacing the localStorage system.

## ✅ What You Already Have
Looking at your `.env.local` file, you already have:
- ✅ **Neon PostgreSQL Database** (from Vercel)
- ✅ **Database Connection URLs** (DATABASE_URL, POSTGRES_URL, etc.)
- ✅ **All Connection Parameters** (host, user, password, database)

## 🔧 Database Setup Steps

### Step 1: Test Your Database Connection
Run your development server and test the connection:

```bash
pnpm dev
```

Then visit: `http://localhost:3000/api/test-db`

You should see:
```json
{
  "success": true,
  "message": "✅ Database connection and initialization successful!",
  "connectionTest": {...},
  "timestamp": "2024-12-28T..."
}
```

### Step 2: Database Tables Created Automatically
The test endpoint automatically creates these tables:
- **trips** - Store trip information
- **expenses** - Store expense details with item-level data
- **Indexes** - For optimal performance

### Step 3: Verify Tables in Neon Dashboard
1. Go to your [Neon Console](https://console.neon.tech/)
2. Select your project
3. Go to **Tables** section
4. You should see `trips` and `expenses` tables

## 📊 Database Schema

### trips Table
```sql
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  members TEXT[] NOT NULL,
  total_expenses DECIMAL(10,2) DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### expenses Table
```sql
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  paid_by TEXT NOT NULL,
  split_with TEXT[] NOT NULL,
  category TEXT,
  summary TEXT,
  emoji TEXT,
  items JSONB,
  item_assignments JSONB,
  split_mode TEXT CHECK (split_mode IN ('even', 'items')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🚀 Next Steps

### Option 1: Continue with localStorage (Current)
Your app currently works with localStorage. You can keep using it as-is.

### Option 2: Migrate to Neon Database
To switch from localStorage to Neon database:

1. **Test the connection** (Step 1 above)
2. **Update your app** to use database functions instead of localStorage
3. **Migrate existing data** (optional)

## 📱 Using the Database

### Available Functions (from `lib/neon-db.ts`):
- `getTripsFromDB()` - Get all trips
- `getActiveTripFromDB()` - Get active trip
- `createTripInDB()` - Create new trip
- `getTripExpensesFromDB()` - Get expenses for a trip
- `addExpenseToTripInDB()` - Add expense to trip
- `getRecentExpensesFromDB()` - Get recent expenses
- `migrateLocalStorageToNeon()` - Migrate localStorage data

### Example Usage:
```typescript
import { getTripsFromDB, createTripInDB } from '@/lib/neon-db'

// Get all trips from database
const trips = await getTripsFromDB()

// Create a new trip
const newTrip = await createTripInDB({
  name: "Paris Adventure",
  members: ["You", "Sarah", "Mike"],
  totalExpenses: 0,
  currency: "EUR",
  startDate: "2024-01-15",
  endDate: "2024-01-20",
  isActive: true
})
```

## 🔧 Files Added

- `lib/neon-db.ts` - Database functions and utilities
- `app/api/test-db/route.ts` - Database connection test endpoint
- `NEON_DB_SETUP.md` - This setup guide

## 📦 Dependencies Added

- `@vercel/postgres` - Vercel PostgreSQL client

## 🌍 Environment Variables

Your `.env.local` already has everything needed:
```env
DATABASE_URL=postgres://...
POSTGRES_URL=postgres://...
POSTGRES_USER=neondb_owner
POSTGRES_HOST=ep-curly-sound-adle2w3h-pooler.c-2.us-east-1.aws.neon.tech
POSTGRES_PASSWORD=npg_8OwnUkQoM0TE
POSTGRES_DATABASE=neondb
```

## 🚨 Deployment to Vercel

Your environment variables are already set up for Vercel deployment since they came from Vercel's Neon integration.

## 🐛 Troubleshooting

### Issue: "Database connection failed"
- Check your Neon dashboard to ensure the database isn't paused
- Verify environment variables are correct
- Make sure you're using the pooled connection URL

### Issue: "Permission denied"
- Ensure your Neon user has proper permissions
- Check if Row Level Security is blocking queries

### Issue: "Table doesn't exist"
- Run the test endpoint to auto-create tables
- Check the Neon console for table creation logs

## 💡 Current Status

- ✅ **Neon Database**: Connected and ready
- ✅ **Environment Variables**: Already configured
- ✅ **Database Functions**: Created and available
- ✅ **Test Endpoint**: Available at `/api/test-db`
- ⏳ **App Integration**: Optional - can keep using localStorage or migrate

---

**Your database is ready to use! 🎉** 