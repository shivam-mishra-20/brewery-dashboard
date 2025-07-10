import mongoose, { Document, Model, Schema } from 'mongoose'
import { ISubscriptionPlan } from './SubscriptionPlan'

export interface IUser extends Document {
  email: string
  password: string
  name: string
  subscriptionPlan?: ISubscriptionPlan['_id']
  trialStart?: Date // Date when free trial started
}

const UserSchema: Schema<IUser> = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  subscriptionPlan: {
    type: Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
    default: null,
  },
  trialStart: { type: Date, default: null },
})

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
