import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Invoice from '@/models/Invoice'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')       // 'input' | 'output'
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''

    const query: Record<string, unknown> = {}
    if (type) query.type = type
    if (status) query.status = status
    if (search) {
      query.$or = [
        { partner: { $regex: search, $options: 'i' } },
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ]
    }

    const total = await Invoice.countDocuments(query)
    const invoices = await Invoice.find(query)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    return NextResponse.json({
      data: invoices,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const body = await request.json()

    // Auto-calculate totals
    const subtotal = body.items?.reduce((sum: number, item: { amount: number }) => sum + item.amount, 0) || 0
    const taxAmount = (subtotal * (body.tax || 10)) / 100
    const total = subtotal + taxAmount

    const invoice = await Invoice.create({
      ...body,
      subtotal,
      taxAmount,
      total,
    })

    return NextResponse.json({ data: invoice }, { status: 201 })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create invoice'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
