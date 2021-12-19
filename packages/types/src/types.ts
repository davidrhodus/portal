// DB-specific types
export interface IFreeTierApplicationAccount {
  address: string
  publicKey: string
  privateKey: string
  passPhrase: string
}

export interface IGatewayAAT {
  version: string
  clientPublicKey: string
  applicationPublicKey: string
  applicationSignature: string
}

export interface INetworkData {
  nodesStaked: number
  appsStaked: number
  poktStaked: string
  createdAt: Date
}

export interface IPreStakedApp {
  chain: string
  status: string
  createdAt: Date | number
  fundingTxHash?: string
  stakingTxHash?: string
  freeTierApplicationAccount: IFreeTierApplicationAccount
  gatewayAAT: IGatewayAAT
}

export interface IUser {
  provider?: string
  email: string
  username: string
  password: string
  lastLogin: string
  validated: boolean
  v2: boolean
  comparePassword: (plainPassword: string, userPassword: string) => boolean
  encryptPassword: (password: string) => string
  generateVerificationToken: () => string
  validateEmail: (email: string) => string
  validatePassword: (password: string) => string
}

// Application types
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

export interface IApplication {
  chain: string
  name: string
  user: unknown
  freeTier: boolean
  status: string
  lastChangedStatusAt: Date | number
  freeTierApplicationAccount: IFreeTierApplicationAccount
  gatewayAAT: IGatewayAAT
  gatewaySettings: IGatewaySettings
  notificationSettings: INotificationSettings
  createdAt?: Date | number
  updatedAt?: Date | number
  encryptPrivateKey: (privateKey: string) => string
  decryptPrivateKey: (privateKey: string) => string
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

// Load balancer types
export interface ILoadBalancer {
  user: unknown
  name: string
  requestTimeOut: string
  applicationIDs: string[]
  notificationSettings: INotificationSettings
  createdAt: Date | number
  updatedAt?: Date | number
  chain: string
}


// Network types
export interface IChain {
  _id: string
  appCount: number
  description: string
  hash: string
  name: string
  network?: string
  networkID: string
  requestTimeOut?: number
  nodeCount: number
  ticker: string
}

