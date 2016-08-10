
import {Component} from '@buggyorg/graphtools'
import _ from 'lodash'
import {requiredComponents} from './references'
require('promise-resolve-deep')(Promise)

function requiredGraphComponents (graph, root) {
  const req = _.partial(requiredComponents, _, root)
  return graph.nodes().map(req).concat(
    graph.components().map(req))
}

function knownComponents (graph) {
  return graph.components().map(Component.id)
}

function resolveReferences (graph, components) {
  return components.reduce((curGraph, cmp) => {
    console.log('setting', cmp.path)
    return _.set(curGraph, cmp.path, cmp.component)
  }, graph)
}

export function resolve (graph, client, root = '') {
  var cmps = knownComponents(graph)
  var needed = requiredGraphComponents(graph, root)
  var resolves = _.difference(needed, cmps)
  return Promise.resolveDeep(resolves.map((ref) => ({name: ref.name, path: ref.path, component: client.component(ref.ref)})))
  .then((newComponents) => {
    console.log(newComponents)
    if (newComponents.length === 0) return graph.disallowReferences()
    return resolveReferences(graph, newComponents)
//    return resolve(resolveReferences(graph, newComponents), client)
//    return graph.disallowReferences()
  })
}
