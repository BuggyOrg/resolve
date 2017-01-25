
import curry from 'lodash/fp/curry'
import merge from 'lodash/fp/merge'
import omit from 'lodash/fp/omit'
import uniqBy from 'lodash/fp/uniqBy'
import * as Graph from '@buggyorg/graphtools'
import * as Client from './client'
require('promise-resolve-deep')(Promise)
const Node = Graph.Node
const Component = Graph.Component
const CompoundPath = Graph.CompoundPath

function requiredGraphComponents (graph) {
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
      var node = Graph.node(cmp.path, graph)
      if (Node.get('isRecursive', node)) {
        // handle recursive node like an atomic
        var newComp = Component.createNode(cleanReference(cmp), merge(cmp.component, {atomic: true, settings: node.settings, metaInformation: node.metaInformation}))
        newComp.nodes = []
        newComp.edges = []
        return Graph.replaceNode(cmp.id, newComp)
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
  graph.components = Graph.components(graph).concat(uniqBy((c) => c.ref, components)
      .filter((c) => !Graph.hasComponent(c.component, graph))
      .map((c) => c.component))
  return graph
})

export const resolveWith = curry((client, graph) => {
  if (Graph.nodes(graph).length === 0 && Graph.hasComponent('main', graph)) {
    const components = Graph.components(graph).filter((c) => c.componentId !== 'main')
    graph = Graph.component('main', graph)
    graph.components = (graph.components || []).concat(components)
  }
  var needed = requiredGraphComponents(graph)
  return Promise.resolveDeep(needed.map((ref) => merge(ref, {component: client(ref.ref)})))
  .then((newComponents) => {
    if (newComponents.length === 0) return graph // .disallowReferences()
    return Graph.namedFlow(
      'Storing Components in the Graph', storeComponent(newComponents),
      'Marking Recursions', markRecursions(newComponents),
      'Resolving References', resolveReferences(newComponents),
      'Recusively resolving graph components', resolveWith(client)
    )(graph)
  })
})
