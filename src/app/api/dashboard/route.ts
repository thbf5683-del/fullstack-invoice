import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Invoice from '@/models/Invoice'
import Expense from '@/models/Expense'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))

    // Monthly revenue vs cost for the year
    const monthlyInvoices = await Invoice.aggregate([
      {
        $match: {
          date: { $gte: new Date(`${year}-01-01`), $lt: new Date(`${year + 1}-01-01`) },
          status: { $ne: 'cancelled' },
        },
      },
      {
        $group: {
          _id: { month: { $month: '$date' }, type: '$type' },
          total: { $sum: '$total' },
          count: { $sum: 1 },
        },
      },
    ])

    const monthlyExpenses = await Expense.aggregate([
      { $match: { year } },
      {
        $group: {
          _id: { $month: { $dateFromParts: { year: '$year', month: '$month', day: 1 } } },
          total: { $sum: '$netSalary' },
          count: { $sum: 1 },
        },
      },
    ])

    // Build 12-month chart data
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      name: `T${i + 1}`,
      revenue: 0,    // đầu ra
      cost: 0,       // đầu vào
      labor: 0,      // nhân công
    }))

    monthlyInvoices.forEach((item) => {
      const m = months[item._id.month - 1]
      if (item._id.type === 'output') m.revenue += item.total
      if (item._id.type === 'input') m.cost += item.total
    })

    monthlyExpenses.forEach((item) => {
      const m = months[item._id - 1]
      if (m) m.labor += item.total
    })

    // Overall totals
    const [invoiceTotals] = await Invoice.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$total' },
          count: { $sum: 1 },
          paid: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$total', 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$total', 0] } },
        },
      },
      {
        $group: {
          _id: null,
          types: { $push: { type: '$_id', total: '$total', count: '$count', paid: '$paid', pending: '$pending' } },
        },
      },
    ]).exec().then(r => [r[0] || { types: [] }])

    const [laborTotal] = await Expense.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$netSalary' },
          paid: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$netSalary', 0] } },
          count: { $sum: 1 },
        },
      },
    ]).exec().then(r => [r[0] || {}])

    // Recent invoices
    const recentInvoices = await Invoice.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .lean()

    // Status breakdown
    const statusBreakdown = await Invoice.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$total' } } },
    ])

    const outputData = (invoiceTotals?.types || []).find((t: { type: string }) => t.type === 'output') || {}
    const inputData = (invoiceTotals?.types || []).find((t: { type: string }) => t.type === 'input') || {}
    const profit = (outputData.total || 0) - (inputData.total || 0) - (laborTotal?.total || 0)

    return NextResponse.json({
      summary: {
        totalRevenue: outputData.total || 0,
        totalCost: inputData.total || 0,
        totalLabor: laborTotal?.total || 0,
        profit,
        revenueCount: outputData.count || 0,
        costCount: inputData.count || 0,
        laborCount: laborTotal?.count || 0,
        pendingRevenue: outputData.pending || 0,
        pendingCost: inputData.pending || 0,
      },
      chartData: months,
      recentInvoices,
      statusBreakdown,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Dashboard error' }, { status: 500 })
  }
}
