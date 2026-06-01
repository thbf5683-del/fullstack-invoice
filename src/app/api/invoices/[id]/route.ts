import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Invoice from '@/models/Invoice'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const invoice = await Invoice.findById(params.id).lean()
    if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: invoice })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const body = await request.json()

    if (body.items) {
      body.subtotal = body.items.reduce((sum: number, item: { amount: number }) => sum + item.amount, 0)
      body.taxAmount = (body.subtotal * (body.tax || 10)) / 100
      body.total = body.subtotal + body.taxAmount
    }

    const invoice = await Invoice.findByIdAndUpdate(params.id, body, { new: true }).lean()
    if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: invoice })
  } catch {
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    await Invoice.findByIdAndDelete(params.id)
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch {
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 })
  }
}
