# 🗄️ SnapTab Database Layout

## Overview
This document defines the database schema for SnapTab's simplified, username-based system with 3-digit trip codes and real-time bill syncing.

## 🎯 Core Principles

### Simple Authentication
- **No passwords** - users identified by unique usernames only
- **No email required** - just pick a username and start using
- **Profile photos** stored in Vercel Blob (optional)

### Trip Code System
- **3-digit trip codes** (100-999) for easy sharing
- **Anyone with code can join** the trip instantly
- **Real-time syncing** of all expenses across trip members

### Item-Level Bill Splitting
- **Receipt scanning** extracts individual items
- **Users pick items** they consumed from each bill
- **Flexible assignments** - items can be shared or individual
- **Live updates** when anyone edits item assignments

## 📊 Database Schema

### 1. users
Simple user tracking without authentication complexity.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_username ON users(username);
```

**Fields:**
- `id` - Internal UUID for relationships
- `username` - Unique identifier (3-50 chars, alphanumeric + underscore)
- `display_name` - Friendly name shown in UI
- `avatar_url` - Optional profile photo from Vercel Blob
- `created_at` - When user first created account
- `updated_at` - Last profile update

### 2. trips
Trip management with 3-digit codes for easy sharing.

```sql
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_code INTEGER UNIQUE NOT NULL CHECK (trip_code >= 100 AND trip_code <= 999),
  name VARCHAR(100) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  created_by UUID NOT NULL REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_trips_code ON trips(trip_code);
CREATE INDEX idx_trips_created_by ON trips(created_by);
CREATE INDEX idx_trips_active ON trips(is_active);
```

**Fields:**
- `id` - Internal UUID for relationships
- `trip_code` - 3-digit number (100-999) for sharing
- `name` - Trip name (e.g., "Tokyo Adventure")
- `currency` - Base currency for the trip
- `created_by` - User who created the trip
- `is_active` - Whether trip is still active
- `created_at` - Trip creation time
- `updated_at` - Last modification

### 3. trip_members
Tracks who belongs to which trips.

```sql
CREATE TABLE trip_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  
  UNIQUE(trip_id, user_id)
);

-- Indexes
CREATE INDEX idx_trip_members_trip ON trip_members(trip_id);
CREATE INDEX idx_trip_members_user ON trip_members(user_id);
CREATE INDEX idx_trip_members_active ON trip_members(is_active);
```

**Fields:**
- `id` - Internal UUID
- `trip_id` - Which trip they're in
- `user_id` - Which user
- `joined_at` - When they joined the trip
- `is_active` - Whether they're still part of the trip

### 4. expenses
Bills and receipts uploaded to trips.

```sql
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  merchant_name VARCHAR(200),
  total_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  receipt_image_url TEXT,
  expense_date DATE NOT NULL,
  paid_by UUID NOT NULL REFERENCES users(id),
  category VARCHAR(50),
  summary VARCHAR(100),
  emoji VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_expenses_trip ON expenses(trip_id);
CREATE INDEX idx_expenses_paid_by ON expenses(paid_by);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_created_at ON expenses(created_at);
```

**Fields:**
- `id` - Internal UUID
- `trip_id` - Which trip this expense belongs to
- `name` - Expense description
- `merchant_name` - Where it was purchased (from AI scan)
- `total_amount` - Total bill amount
- `currency` - Currency of the expense
- `receipt_image_url` - Vercel Blob URL for receipt photo
- `expense_date` - When the expense occurred
- `paid_by` - User who paid for this expense
- `category` - Expense category (food, lodging, etc.)
- `summary` - AI-generated short summary
- `emoji` - Category emoji
- `created_at` - When expense was added
- `updated_at` - Last modification

### 5. expense_items
Individual items extracted from receipt scans.

```sql
CREATE TABLE expense_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  item_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_expense_items_expense ON expense_items(expense_id);
CREATE INDEX idx_expense_items_order ON expense_items(expense_id, item_order);
```

**Fields:**
- `id` - Internal UUID
- `expense_id` - Which expense this item belongs to
- `name` - Item name (e.g., "Burger", "Large Fries")
- `price` - Individual item price
- `quantity` - How many of this item
- `item_order` - Display order in the receipt
- `created_at` - When item was created

### 6. item_assignments
Tracks which user got which items from each expense.

```sql
CREATE TABLE item_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_item_id UUID NOT NULL REFERENCES expense_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(expense_item_id, user_id)
);

-- Indexes
CREATE INDEX idx_item_assignments_item ON item_assignments(expense_item_id);
CREATE INDEX idx_item_assignments_user ON item_assignments(user_id);
```

**Fields:**
- `id` - Internal UUID
- `expense_item_id` - Which item was assigned
- `user_id` - Which user got this item
- `assigned_at` - When the assignment was made

## 🔄 User Flow Examples

### Scenario 1: Creating a Trip
```sql
-- User creates trip with code 138
INSERT INTO trips (trip_code, name, currency, created_by) 
VALUES (138, 'Tokyo Adventure', 'USD', 'user-uuid');

-- Creator automatically becomes member
INSERT INTO trip_members (trip_id, user_id) 
VALUES ('trip-uuid', 'user-uuid');
```

### Scenario 2: Joining a Trip
```sql
-- User joins using trip code 138
SELECT id FROM trips WHERE trip_code = 138;

INSERT INTO trip_members (trip_id, user_id) 
VALUES ('trip-uuid', 'new-user-uuid');
```

### Scenario 3: Adding a Bill
```sql
-- Add expense
INSERT INTO expenses (trip_id, name, merchant_name, total_amount, currency, paid_by, category, summary, emoji) 
VALUES ('trip-uuid', 'Lunch at Burger Shack', 'BURGER SHACK', 39.60, 'USD', 'user-uuid', 'food', 'Burgers', '🍔');

-- Add items from receipt scan
INSERT INTO expense_items (expense_id, name, price, quantity, item_order) VALUES
('expense-uuid', 'Burger', 5.00, 4, 1),
('expense-uuid', 'Fries', 2.50, 2, 2),
('expense-uuid', 'Onion Rings', 3.00, 1, 3),
('expense-uuid', 'Soda', 1.50, 3, 4),
('expense-uuid', 'Milkshake', 4.00, 1, 5);
```

### Scenario 4: User Picks Items
```sql
-- User assigns items to themselves
INSERT INTO item_assignments (expense_item_id, user_id) VALUES
('burger-item-1-uuid', 'user1-uuid'),
('burger-item-2-uuid', 'user1-uuid'),
('fries-item-1-uuid', 'user1-uuid'),
('soda-item-1-uuid', 'user1-uuid');
```

## 🔍 Common Queries

### Get All Trip Members
```sql
SELECT u.username, u.display_name, u.avatar_url, tm.joined_at
FROM trip_members tm
JOIN users u ON tm.user_id = u.id
WHERE tm.trip_id = ? AND tm.is_active = true
ORDER BY tm.joined_at;
```

### Get Trip Expenses with Items
```sql
SELECT 
  e.*,
  u.username as paid_by_username,
  u.display_name as paid_by_name,
  json_agg(
    json_build_object(
      'id', ei.id,
      'name', ei.name,
      'price', ei.price,
      'quantity', ei.quantity,
      'assignments', ei_assignments.users
    ) ORDER BY ei.item_order
  ) as items
FROM expenses e
JOIN users u ON e.paid_by = u.id
LEFT JOIN expense_items ei ON e.id = ei.expense_id
LEFT JOIN (
  SELECT 
    ei.id as item_id,
    json_agg(json_build_object('user_id', u.id, 'username', u.username)) as users
  FROM expense_items ei
  LEFT JOIN item_assignments ia ON ei.id = ia.expense_item_id
  LEFT JOIN users u ON ia.user_id = u.id
  GROUP BY ei.id
) ei_assignments ON ei.id = ei_assignments.item_id
WHERE e.trip_id = ?
GROUP BY e.id, u.username, u.display_name
ORDER BY e.created_at DESC;
```

### Calculate User Balance in Trip
```sql
WITH user_expenses AS (
  -- Money spent by user
  SELECT SUM(total_amount) as paid
  FROM expenses 
  WHERE trip_id = ? AND paid_by = ?
),
user_obligations AS (
  -- Money owed by user (from item assignments)
  SELECT SUM(ei.price * ei.quantity) as owes
  FROM item_assignments ia
  JOIN expense_items ei ON ia.expense_item_id = ei.id
  JOIN expenses e ON ei.expense_id = e.id
  WHERE e.trip_id = ? AND ia.user_id = ?
)
SELECT 
  COALESCE(ue.paid, 0) - COALESCE(uo.owes, 0) as balance
FROM user_expenses ue
FULL OUTER JOIN user_obligations uo ON true;
```

### Get Unassigned Items for an Expense
```sql
SELECT ei.*
FROM expense_items ei
LEFT JOIN item_assignments ia ON ei.id = ia.expense_item_id
WHERE ei.expense_id = ? AND ia.id IS NULL
ORDER BY ei.item_order;
```

## 🛡️ Security Considerations

### Trip Code Generation
- Generate random 3-digit codes (100-999)
- Check for collisions before inserting
- Consider code expiration for inactive trips

### Username Validation
- 3-50 characters, alphanumeric + underscore only
- Case-insensitive uniqueness
- Prevent reserved words (admin, api, etc.)

### Data Access Control
- Users can only see trips they're members of
- Users can only edit expenses in their trips
- All operations require valid trip membership

## 🚀 Performance Optimizations

### Indexes
- All foreign keys have indexes
- Trip code lookup is highly optimized
- User operations are efficient

### Caching Strategy
- Cache trip membership for active users
- Cache recent expenses per trip
- Invalidate cache on expense/assignment changes

### Real-time Updates
- Use database triggers or webhooks
- Push notifications for expense changes
- WebSocket connections for live updates

## 📱 API Endpoints Needed

### User Management
- `POST /api/users` - Create username
- `GET /api/users/[username]` - Get user profile
- `PUT /api/users/[username]` - Update profile

### Trip Management
- `POST /api/trips` - Create trip (returns trip code)
- `GET /api/trips/[code]` - Get trip info
- `POST /api/trips/[code]/join` - Join trip with code
- `GET /api/trips/[code]/members` - Get trip members

### Expense Management
- `GET /api/trips/[code]/expenses` - Get all expenses
- `POST /api/trips/[code]/expenses` - Add new expense
- `GET /api/expenses/[id]` - Get expense details
- `PUT /api/expenses/[id]` - Update expense
- `DELETE /api/expenses/[id]` - Delete expense

### Item Assignment
- `GET /api/expenses/[id]/items` - Get expense items
- `POST /api/expenses/[id]/items/[itemId]/assign` - Assign item to user
- `DELETE /api/expenses/[id]/items/[itemId]/assign` - Unassign item

### Balance & Settlement
- `GET /api/trips/[code]/balances` - Get all user balances
- `GET /api/trips/[code]/settlement` - Calculate optimal settlements

---

This database layout supports the simplified, real-time collaborative expense sharing system you described! 🎉 