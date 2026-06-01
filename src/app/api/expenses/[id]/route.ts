import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Expense from '@/models/Expense'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const body = await request.json()
    body.netSalary = (body.baseSalary || 0) + (body.overtime || 0) + (body.bonus || 0) - (body.deductions || 0)
    const expense = await Expense.findByIdAndUpdate(params.id, body, { new: true }).lean()
    if (!expense) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: expense })
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    await Expense.findByIdAndDelete(params.id)
    return NextResponse.json({ message: 'Deleted' })
  } catch {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
