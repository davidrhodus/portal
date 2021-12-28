import { Application as ExpressApplication } from 'express'
import Index from './controllers/DefaultController'
import Network from './controllers/NetworkController'
import LoadBalancer from './controllers/LoadBalancerController'

export function configureRoutes(expressApp: ExpressApplication): void {
  expressApp.use('/', Index)

  expressApp.use('/api/lb', LoadBalancer)

  expressApp.use('/api/network', Network)
}
