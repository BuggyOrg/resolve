
import {Component} from '@buggyorg/graphtools'
import _ from 'lodash'
import * as Client from './client'
import {requiredComponents} from './references'
require('promise-resolve-deep')(Promise)

function requiredGraphComponents (graph, root) {
  const req = _.partial(requiredComponents, _, root)
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

function resolveReferences (graph, components) {
  return components.reduce((curGraph, cmp) => {
    if (cmp.type === 'compound') {
      return curGraph.replaceCompoundImplementation(cmp.compound, cmp.id, Component.createNode(
        cleanReference(cmp, cmp.compound + ':' + cmp.id), cmp.component))
    } else {
      return curGraph.replaceNode(Component.createNode(cleanReference(cmp), cmp.component))
    }
  }, graph)
}

export function resolve (graph, externalClients, root = '') {
  var client = Client.arrayClient(
    Client.normalizeClients(externalClients).concat(Client.baseClient(graph)))
  var needed = requiredGraphComponents(graph, root)
  console.log('needed', needed)
  return Promise.resolveDeep(needed.map((ref) => _.merge(ref, {component: client(ref.ref)})))
  .then((newComponents) => {
    console.log('newComp', newComponents)
    if (newComponents.length === 0) return graph.disallowReferences()
    graph.Components = graph.Components.concat(newComponents
      .filter((c) => !graph.hasComponent(c.component))
      .map((c) => c.component))
    return resolve(resolveReferences(graph, newComponents), client)
  })
}
