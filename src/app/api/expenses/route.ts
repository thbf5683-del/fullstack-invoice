import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Expense from '@/models/Expense'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const department = searchParams.get('department')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const query: Record<string, unknown> = {}
    if (month) query.month = parseInt(month)
    if (year) query.year = parseInt(year)
    if (department) query.department = department

    const total = await Expense.countDocuments(query)
    const expenses = await Expense.find(query)
      .sort({ year: -1, month: -1, employeeName: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    // Summary stats
    const summary = await Expense.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalBase: { $sum: '$baseSalary' },
          totalOvertime: { $sum: '$overtime' },
          totalBonus: { $sum: '$bonus' },
          totalDeductions: { $sum: '$deductions' },
          totalNet: { $sum: '$netSalary' },
          count: { $sum: 1 },
        },
      },
    ])

    return NextResponse.json({
      data: expenses,
      summary: summary[0] || {},
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const body = await request.json()

    // Auto-calculate net salary
    const netSalary = (body.baseSalary || 0) + (body.overtime || 0) + (body.bonus || 0) - (body.deductions || 0)
    const expense = await Expense.create({ ...body, netSalary })

    return NextResponse.json({ data: expense }, { status: 201 })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create expense'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
