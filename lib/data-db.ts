import { prisma } from "./db"
import { getServerSession } from "next-auth"
import { authOptions } from "./auth"

export interface CreateTripData {
  name: string
  baseCurrency: string
  startDate?: Date
  endDate?: Date
}

export interface CreateExpenseData {
  description: string
  amount: number
  currency: string
  date: Date
  tripId: string
  receiptImageUrl?: string
  splitWithUserIds: string[]
}

// Get current user session
export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user
}

// Create a new trip
export async function createTrip(data: CreateTripData) {
  const user = await getCurrentUser()
  if (!user?.id) throw new Error("Unauthorized")

  const trip = await prisma.trip.create({
    data: {
      name: data.name,
      baseCurrency: data.baseCurrency,
      startDate: data.startDate,
      endDate: data.endDate,
      isActive: true,
      members: {
        create: {
          userId: user.id,
          role: "admin",
        },
      },
    },
    include: {
      members: {
        include: {
          user: true,
        },
      },
      expenses: {
        include: {
          paidBy: true,
          splits: true,
        },
      },
    },
  })

  return trip
}

// Get user's trips
export async function getUserTrips() {
  const user = await getCurrentUser()
  if (!user?.id) throw new Error("Unauthorized")

  const trips = await prisma.trip.findMany({
    where: {
      members: {
        some: {
          userId: user.id,
        },
      },
    },
    include: {
      members: {
        include: {
          user: true,
        },
      },
      expenses: {
        include: {
          paidBy: true,
          splits: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  })

  return trips
}

// Get active trip for user
export async function getActiveTrip() {
  const user = await getCurrentUser()
  if (!user?.id) throw new Error("Unauthorized")

  const trip = await prisma.trip.findFirst({
    where: {
      isActive: true,
      members: {
        some: {
          userId: user.id,
        },
      },
    },
    include: {
      members: {
        include: {
          user: true,
        },
      },
      expenses: {
        include: {
          paidBy: true,
          splits: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  })

  return trip
}

// Set active trip
export async function setActiveTrip(tripId: string) {
  const user = await getCurrentUser()
  if (!user?.id) throw new Error("Unauthorized")

  // First, set all user's trips to inactive
  await prisma.trip.updateMany({
    where: {
      members: {
        some: {
          userId: user.id,
        },
      },
    },
    data: {
      isActive: false,
    },
  })

  // Then set the selected trip as active
  const trip = await prisma.trip.update({
    where: {
      id: tripId,
    },
    data: {
      isActive: true,
    },
  })

  return trip
}

// Create expense
export async function createExpense(data: CreateExpenseData) {
  const user = await getCurrentUser()
  if (!user?.id) throw new Error("Unauthorized")

  // Verify user is a member of the trip
  const tripMember = await prisma.tripMember.findFirst({
    where: {
      tripId: data.tripId,
      userId: user.id,
    },
  })

  if (!tripMember) {
    throw new Error("You are not a member of this trip")
  }

  // Calculate split amount
  const splitAmount = data.amount / data.splitWithUserIds.length

  const expense = await prisma.expense.create({
    data: {
      description: data.description,
      amount: data.amount,
      currency: data.currency,
      date: data.date,
      tripId: data.tripId,
      paidById: user.id,
      receiptImageUrl: data.receiptImageUrl,
      splits: {
        create: data.splitWithUserIds.map((userId) => ({
          userId,
          amountOwed: splitAmount,
        })),
      },
    },
    include: {
      paidBy: true,
      splits: true,
    },
  })

  return expense
}

// Get trip expenses
export async function getTripExpenses(tripId: string) {
  const user = await getCurrentUser()
  if (!user?.id) throw new Error("Unauthorized")

  // Verify user is a member of the trip
  const tripMember = await prisma.tripMember.findFirst({
    where: {
      tripId,
      userId: user.id,
    },
  })

  if (!tripMember) {
    throw new Error("You are not a member of this trip")
  }

  const expenses = await prisma.expense.findMany({
    where: {
      tripId,
    },
    include: {
      paidBy: true,
      splits: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return expenses
}

// Calculate user balance for a trip
export async function getUserTripBalance(tripId: string) {
  const user = await getCurrentUser()
  if (!user?.id) throw new Error("Unauthorized")

  const expenses = await getTripExpenses(tripId)
  let balance = 0

  expenses.forEach((expense) => {
    // If user paid for this expense, add to balance
    if (expense.paidById === user.id) {
      balance += expense.amount
    }

    // If user owes money for this expense, subtract from balance
    const userSplit = expense.splits.find((split) => split.userId === user.id)
    if (userSplit) {
      balance -= userSplit.amountOwed
    }
  })

  return balance
}

// Add member to trip
export async function addTripMember(tripId: string, email: string) {
  const user = await getCurrentUser()
  if (!user?.id) throw new Error("Unauthorized")

  // Check if current user is admin of the trip
  const adminMember = await prisma.tripMember.findFirst({
    where: {
      tripId,
      userId: user.id,
      role: "admin",
    },
  })

  if (!adminMember) {
    throw new Error("Only trip admins can add members")
  }

  // Find user by email
  const userToAdd = await prisma.user.findUnique({
    where: { email },
  })

  if (!userToAdd) {
    throw new Error("User not found")
  }

  // Check if user is already a member
  const existingMember = await prisma.tripMember.findUnique({
    where: {
      tripId_userId: {
        tripId,
        userId: userToAdd.id,
      },
    },
  })

  if (existingMember) {
    throw new Error("User is already a member of this trip")
  }

  // Add user to trip
  const tripMember = await prisma.tripMember.create({
    data: {
      tripId,
      userId: userToAdd.id,
      role: "member",
    },
    include: {
      user: true,
    },
  })

  return tripMember
}