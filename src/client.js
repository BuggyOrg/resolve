
import promiseAny from 'promise-any'
import _ from 'lodash'

export function arrayClient (clientArray) {
  const safeClients = _.map(clientArray, makeSafe)
  return (meta) => promiseAny(_.map(safeClients, (client) => client(meta)))
  .catch((err) => {
    throw new Error(`Unable to find the component '${meta}' in ${err.length} sources.`)
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
  return graph.component
}
