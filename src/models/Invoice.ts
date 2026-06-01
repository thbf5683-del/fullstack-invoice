import mongoose, { Schema, Document } from 'mongoose'

export interface IInvoice extends Document {
  type: 'input' | 'output'
  invoiceNumber: string
  date: Date
  partner: string       // Nhà cung cấp (đầu vào) / Khách hàng (đầu ra)
  description: string
  items: Array<{
    name: string
    quantity: number
    unit: string
    unitPrice: number
    amount: number
  }>
  subtotal: number
  tax: number           // VAT %
  taxAmount: number
  total: number
  status: 'draft' | 'pending' | 'paid' | 'cancelled'
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const InvoiceItemSchema = new Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, default: 'cái' },
  unitPrice: { type: Number, required: true },
  amount: { type: Number, required: true },
})

const InvoiceSchema = new Schema<IInvoice>(
  {
    type: { type: String, enum: ['input', 'output'], required: true },
    invoiceNumber: { type: String, required: true, unique: true },
    date: { type: Date, required: true, default: Date.now },
    partner: { type: String, required: true },
    description: { type: String, default: '' },
    items: [InvoiceItemSchema],
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 10 },
    taxAmount: { type: Number, required: true },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ['draft', 'pending', 'paid', 'cancelled'],
      default: 'pending',
    },
    notes: { type: String },
  },
  { timestamps: true }
)

// Index for faster queries
InvoiceSchema.index({ type: 1, date: -1 })
InvoiceSchema.index({ status: 1 })

export default mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema)
