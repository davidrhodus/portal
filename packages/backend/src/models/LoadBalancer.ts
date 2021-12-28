import { Schema, model, Model, Document, Types } from 'mongoose'

interface INotificationSettings {
  signedUp: boolean
  quarter: boolean
  quarterLastSent?: Date | number
  half: boolean
  halfLastSent?: Date | number
  threeQuarters: boolean
  threeQuartersLastSent?: Date | number
  full: boolean
  fullLastSent?: Date | number
  createdAt?: Date | number
}

export interface ILoadBalancer extends Document {
  user: string | Types.ObjectId
  name: string
  requestTimeOut: string
  applicationIDs: string[]
  notificationSettings: INotificationSettings
  createdAt: Date | number
  updatedAt?: Date | number
  chain: string
}

const LoadBalancerSchema = new Schema<ILoadBalancer>(
  {
    user: String,
    name: String,
    requestTimeOut: String,
    applicationIDs: [],
    createdAt: {
      type: Date,
      default: new Date(Date.now()),
    },
    updatedAt: {
      type: Date,
    },
  },
  { collection: 'LoadBalancers' }
)

const LoadBalancerModel: Model<ILoadBalancer> = model(
  'LoadBalancers',
  LoadBalancerSchema
)

export default LoadBalancerModel
