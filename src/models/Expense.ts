import mongoose, { Schema, Document } from 'mongoose'

export interface IExpense extends Document {
  month: number         // 1-12
  year: number
  employeeName: string
  position: string
  baseSalary: number
  overtime: number
  bonus: number
  deductions: number
  netSalary: number
  department: string
  status: 'pending' | 'paid'
  payDate?: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const ExpenseSchema = new Schema<IExpense>(
  {
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    employeeName: { type: String, required: true },
    position: { type: String, required: true },
    department: { type: String, default: 'Chung' },
    baseSalary: { type: Number, required: true },
    overtime: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    netSalary: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
    payDate: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
)

ExpenseSchema.index({ year: 1, month: 1 })
ExpenseSchema.index({ employeeName: 1 })

export default mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema)
