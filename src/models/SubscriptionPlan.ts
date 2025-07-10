import mongoose, { Document, Model, Schema } from 'mongoose'

export interface ISubscriptionPlan extends Document {
  name: string
  price: number
  features: string[]
  isActive: boolean
  createdAt: Date
  trialPeriodDays?: number // Number of days for free trial (e.g., 10 for Free plan)
}

const SubscriptionPlanSchema: Schema<ISubscriptionPlan> = new Schema({
  name: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
  features: { type: [String], default: [] },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  trialPeriodDays: { type: Number, default: 0 },
})

export const SubscriptionPlan: Model<ISubscriptionPlan> =
  mongoose.models.SubscriptionPlan ||
  mongoose.model<ISubscriptionPlan>('SubscriptionPlan', SubscriptionPlanSchema)
