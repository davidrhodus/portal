import { Schema, model, Model, Document, Types } from 'mongoose'
import { Encryptor, Decryptor } from 'strong-cryptor'
import isEmail from 'validator/lib/isEmail'
import { IFreeTierApplicationAccount, IGatewayAAT } from './types'
import env from '../environment'

const CRYPTO_KEY = env('DATABASE_ENCRYPTION_KEY') as string

const encryptor = new Encryptor({ key: CRYPTO_KEY })
const decryptor = new Decryptor({ key: CRYPTO_KEY })

export interface IGatewaySettings {
  secretKey: string
  secretKeyRequired: boolean
  whitelistOrigins: string[]
  whitelistUserAgents: string[]
}

export interface INotificationSettings {
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

export interface IApplication extends Document {
  chain: string
  createdAt?: Date | number
  decryptPrivateKey: (privateKey: string) => string
  dummy: true
  encryptPrivateKey: (privateKey: string) => string
  freeTier: boolean
  freeTierApplicationAccount: IFreeTierApplicationAccount
  gatewayAAT: IGatewayAAT
  gatewaySettings: IGatewaySettings
  lastChangedStatusAt: Date | number
  maxRelays?: number
  name: string
  notificationSettings: INotificationSettings
  status: string
  updatedAt?: Date | number
  user: Types.ObjectId
  validateMetadata: ({
    name,
    owner,
    user,
    contactEmail,
  }: {
    name: string
    owner: string
    user: string
    contactEmail: string
  }) => string
}

const applicationSchema = new Schema<IApplication>(
  {
    chain: String,
    name: String,
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    freeTier: Boolean,
    status: String,
    lastChangedStatusAt: Date,
    maxRelays: Number,
    freeTierApplicationAccount: {
      address: String,
      publicKey: String,
      privateKey: String,
      passPhrase: String,
    },
    gatewayAAT: {
      version: String,
      clientPublicKey: String,
      applicationPublicKey: String,
      applicationSignature: String,
    },
    gatewaySettings: {
      secretKey: String,
      secretKeyRequired: Boolean,
      whitelistOrigins: [],
      whitelistUserAgents: [],
    },
    notificationSettings: {
      signedUp: Boolean,
      quarter: Boolean,
      quarterLastSent: Date,
      half: Boolean,
      halfLastSent: Date,
      threeQuarters: Boolean,
      threeQuartersLastSent: Date,
      full: Boolean,
      fullLastSent: Date,
    },
    createdAt: {
      type: Date,
      default: new Date(Date.now()),
    },
    updatedAt: {
      type: Date,
      default: new Date(Date.now()),
    },
  },
  { collection: 'Applications' }
)

applicationSchema.statics.validateMetadata = function validateMetadata({
  name,
  owner,
  user,
  contactEmail,
}) {
  if (!name || !owner || !user || !contactEmail) {
    return false
  }
  return isEmail(contactEmail)
}
applicationSchema.statics.encryptPrivateKey = function encryptPrivateKey(
  privateKey
) {
  const encryptedPrivateKey = encryptor.encrypt(privateKey)

  return encryptedPrivateKey
}
applicationSchema.statics.decryptPrivateKey = function decryptPrivateKey(
  privateKey
) {
  const encryptedPrivateKey = decryptor.decrypt(privateKey)

  return encryptedPrivateKey
}

const ApplicationModel: Model<IApplication> = model(
  'Application',
  applicationSchema
)

export default ApplicationModel
