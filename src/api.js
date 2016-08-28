
import {Component, Compound} from '@buggyorg/graphtools'
import _ from 'lodash'
import * as Client from './client'
import {requiredComponents, requiredComponentsByPath} from './references'
require('promise-resolve-deep')(Promise)

function requiredGraphComponents (graph) {
  const req = _.partial(requiredComponents, _)
  return _.compact(_.flatten(graph.nodesDeep().map(req)))
}

function requiredGraphComponentsPath (graph) {
  const req = _.partial(requiredComponentsByPath, graph, _)
  return _.compact(_.flatten(graph.nodePathsDeep().map(req).concat(
    graph.componentsPaths().map(req))))
}

function cleanReference (ref, id) {
  var clean = _.omit(ref, ['component', 'ref'])
  if (id) {
    _.merge({}, clean, {id})
  }
  return clean
}

function replaceCompoundImplementation (graph, compoundId, nodeId, newNode) {
  var cmp = graph.node(compoundId)
  var newCompound = Compound.replaceImplementation(cmp, nodeId, newNode)
  return graph.replaceNode(cmp, newCompound)
}

function resolveReferences (graph, components) {
  return components.reduce((curGraph, cmp) => {
    if (Compound.isCompound(cmp.component)) {
      return replaceCompoundImplementation(curGraph, cmp.compound, cmp.id, Component.createNode(
        cleanReference(cmp), cmp.component))
    } else {
      return curGraph.replaceNode(Component.createNode(cleanReference(cmp), cmp.component))
    }
  }, graph)
}

export function resolve (graph, externalClients, root = '') {
  var client = Client.arrayClient(
    Client.normalizeClients(externalClients).concat(Client.baseClient(graph)))
  return resolveWith(graph, client)
}

function extendWithComponents (graph, components) {
  graph.Components = graph.Components.concat(components
      .filter((c) => !graph.hasComponent(c.component))
      .map((c) => c.component))
  return graph
}

export function resolveWith (graph, client) {
  var needed = requiredGraphComponents(graph)
  return Promise.resolveDeep(needed.map((ref) => _.merge({}, ref, {component: client(ref.ref)})))
  .then((newComponents) => {
    if (newComponents.length === 0) return graph.disallowReferences()
    graph = extendWithComponents(graph, newComponents)
    graph = resolveReferences(graph, newComponents)
    return resolveWith(graph, client)
  })
}
