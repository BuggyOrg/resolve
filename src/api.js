
import curry from 'lodash/fp/curry'
import merge from 'lodash/fp/merge'
import omit from 'lodash/fp/omit'
import * as Graph from '@buggyorg/graphtools'
import * as Client from './client'
require('promise-resolve-deep')(Promise)
const Node = Graph.Node
const Component = Graph.Component
const CompoundPath = Graph.CompoundPath

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
} */

const resolveReferences = curry((components, graph) => {
  return Graph.flow(
    components.map((cmp) => {
      if (Node.get('isRecursive', Graph.node(cmp.path, graph))) {
        // handle recursive node like an atomic
        return Graph.replaceNode(cmp.id, Component.createNode(cleanReference(cmp), merge(cmp.component, {atomic: true})))
      } else {
        return Graph.replaceNode(cmp.id, Component.createNode(cleanReference(cmp), cmp.component))
      }
    })
  )(graph)
})

function recursiveRoot (componentID, path, graph) {
  return CompoundPath.parent(path).filter((id) => {
    return Node.component(Graph.node(id, graph)) === componentID
  }
  ).map((id) => Graph.node(id, graph))[0]
}

const markRecursions = curry((components, graph) => {
  return Graph.flow(
    components.map((cmp) => {
      var recRoot = recursiveRoot(cmp.component.componentId, cmp.path, graph)
      if (recRoot) {
        return Graph.flow([
          Graph.set({isRecursive: true}, cmp),
          Graph.set({recursiveRoot: true, isRecursive: true}, recRoot),
          // add edges between recursion node and recursive root.
          Graph.addEdge({from: cmp, to: recRoot, layer: 'recursion'}),
          Graph.addEdge({from: recRoot, to: cmp, layer: 'recursion'})
        ])
      }
      return (graph) => graph
    })
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
      markRecursions(newComponents),
      resolveReferences(newComponents),
      resolveWith(client)
    )(graph)
  })
})
