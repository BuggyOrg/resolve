
import curry from 'lodash/fp/curry'
import merge from 'lodash/fp/merge'
import omit from 'lodash/fp/omit'
import * as Graph from '@buggyorg/graphtools'
import * as Client from './client'
// import {requiredComponentsByPath} from './references'
require('promise-resolve-deep')(Promise)
const Node = Graph.Node
const Component = Graph.Component

/*
function requiredGraphComponents (graph) {
  const req = _.partial(requiredComponents, _)
  return _.compact(_.flatten(graph.nodesDeep().map(req)))
}
*/

function requiredGraphComponents (graph) {
  // const req = _.partial(requiredComponentsByPath, graph, _)
  return Graph.nodesDeepBy(Node.isReference, graph)
}

function cleanReference (ref, id) {
  var clean = omit(['component', 'ref'], ref)
  if (id) {
    return merge(clean, {id})
  }
  return clean
}

/*
function replaceCompoundImplementation (graph, compoundId, nodeId, newNode) {
  var cmp = graph.node(compoundId)
  var newCompound = Compound.replaceImplementation(cmp, nodeId, newNode)
  return graph.replaceNode(cmp, newCompound)
}*/

const resolveReferences = curry((components, graph) => {
  return Graph.flow(
    components.map((cmp) =>
      Graph.replaceNode(cmp.path, Component.createNode(cleanReference(cmp), cmp.component)))
  )(graph)
})

export function resolve (graph, externalClients) {
  var client = Client.arrayClient(
    Client.normalizeClients(externalClients).concat(Client.baseClient(graph)))
  return resolveWith(client, graph)
}

/**
 * Store the component in the graph component list.
 */
const storeComponent = curry((components, graph) => {
  graph.components = Graph.components(graph).concat(components
      .filter((c) => !Graph.hasComponent(c.component, graph))
      .map((c) => c.component))
  return graph
})

export const resolveWith = curry((client, graph) => {
  var needed = requiredGraphComponents(graph)
  return Promise.resolveDeep(needed.map((ref) => merge(ref, {component: client(ref.ref)})))
  .then((newComponents) => {
    if (newComponents.length === 0) return graph // .disallowReferences()
    return Graph.flow(
      storeComponent(newComponents),
      resolveReferences(newComponents),
      resolveWith(client)
    )(graph)
  })
})
