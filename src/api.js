
import {Component, Node} from '@buggyorg/graphtools'
import _ from 'lodash'
import * as Client from './client'
// import {requiredComponentsByPath} from './references'
require('promise-resolve-deep')(Promise)

/*
function requiredGraphComponents (graph) {
  const req = _.partial(requiredComponents, _)
  return _.compact(_.flatten(graph.nodesDeep().map(req)))
}
*/

function requiredGraphComponentsPath (graph) {
  // const req = _.partial(requiredComponentsByPath, graph, _)
  return graph.nodesDeep().filter(Node.isReference)
}

function cleanReference (ref, id) {
  var clean = _.omit(ref, ['component', 'ref'])
  if (id) {
    _.merge({}, clean, {id})
  }
  return clean
}

/*
function replaceCompoundImplementation (graph, compoundId, nodeId, newNode) {
  var cmp = graph.node(compoundId)
  var newCompound = Compound.replaceImplementation(cmp, nodeId, newNode)
  return graph.replaceNode(cmp, newCompound)
}*/

function resolveReferences (graph, components) {
  return components.reduce((curGraph, cmp) =>
    curGraph.replaceNode(cmp.path, Component.createNode(cleanReference(cmp), cmp.component))
  , graph)
}

export function resolve (graph, externalClients, root = '') {
  var client = Client.arrayClient(
    Client.normalizeClients(externalClients).concat(Client.baseClient(graph)))
  return resolveWith(graph, client)
}

/**
 * Store the component in the graph component list.
 */
function storeComponent (graph, components) {
  graph.Components = graph.Components.concat(components
      .filter((c) => !graph.hasComponent(c.component))
      .map((c) => c.component))
  return graph
}

export function resolveWith (graph, client) {
  var needed = requiredGraphComponentsPath(graph)
  return Promise.resolveDeep(needed.map((ref) => _.merge({}, ref, {component: client(ref.ref)})))
  .then((newComponents) => {
    if (newComponents.length === 0) return graph.disallowReferences()
    graph = storeComponent(graph, newComponents)
    graph = resolveReferences(graph, newComponents)
    return resolveWith(graph, client)
  })
}
