
import promiseAny from 'promise-any'
import _ from 'lodash'
import {component} from '@buggyorg/graphtools'

export function arrayClient (clientArray) {
  const safeClients = _.map(clientArray, makeSafe)
  return (componentId) => promiseAny(_.map(safeClients, (client) => client(componentId)))
  .catch((err) => {
    throw new Error(`Unable to find the component '${componentId}' in ${err.length} sources.`)
  })
}

function makeSafe (client) {
  return (component) => {
    return new Promise((resolve, reject) => {
      try {
        Promise.resolve(client(component)).then(resolve).catch(reject)
      } catch (err) {
        reject(err)
      }
    })
  }
}

export function normalizeClients (clients) {
  if (Array.isArray(clients)) {
    return clients
  } else {
    return [clients]
  }
}

export function baseClient (graph) {
  return (componentId) => component(componentId, graph)
}
