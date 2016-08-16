
import {Component, Compound} from '@buggyorg/graphtools'
import _ from 'lodash'
import * as Client from './client'
import {requiredComponents} from './references'
require('promise-resolve-deep')(Promise)

function requiredGraphComponents (graph) {
  const req = _.partial(requiredComponents, _)
  return _.compact(_.flatten(graph.nodes().map(req).concat(
    graph.components().map(req))))
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
    if (cmp.type === 'compound') {
      return replaceCompoundImplementation(curGraph, cmp.compound, cmp.id, Component.createNode(
        cleanReference(cmp, cmp.compound + ':' + cmp.id), cmp.component))
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

export function resolveWith (graph, client) {
  console.log(graph.toJSON())
  var needed = requiredGraphComponents(graph)
  console.log('newComps', needed)
  return Promise.resolveDeep(needed.map((ref) => _.merge(ref, {component: client(ref.ref)})))
  .then((newComponents) => {
    if (newComponents.length === 0) return graph.disallowReferences()
    graph.Components = graph.Components.concat(newComponents
      .filter((c) => !graph.hasComponent(c.component))
      .map((c) => c.component))
    return resolveWith(resolveReferences(graph, newComponents), client)
  })
}
