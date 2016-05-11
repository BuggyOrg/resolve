
import graphlib from 'graphlib'
import _ from 'lodash'
import * as compound from './compound'

var pathFromEdgeId = (edgeId) => edgeId.split(':').slice(0, -1).join(':')
var portFromEdgeId = (edgeId) => edgeId.split(':').slice(-1)[0]
var appendNodeName = (node, name) => _.merge({}, node, {name: name})

export function resolve (graph, resolver) {
  return resolveWith(graph, _.partial(compound.queryNode, _, resolver, _))
}

export function resolveWith (graph, resolve) {
  var graphObj = graphlib.json.write(graph)

  var resolved = _(graphObj.nodes)
    .reject((n) => _.has(n.value, 'meta'))
    .map((n) => [n.value.name, n])
    .fromPairs()
    .value()

  console.error(_.keys(resolved))

  return Promise.all(graphObj.nodes.map((node) => {
    return resolve(appendNodeName(node.value, node.v), resolved).catch((err) => {
      throw new Error(`Cannot resolve ${node.v} with id ${node.value.id || node.value.meta} in version ${node.value.version}\n${err}`)
    })
  }))
  .then((nodes) => {
    var newNodes = _(nodes)
      .map((node, idx) => appendNodeName(node, graphObj.nodes[idx].v))
      .map(compound.flattenNode)
      .flatten()
      .map((node) => ({v: node.branchPath, value: node, parent: node.parent || undefined}))
      .map((node) => _.merge(node, {value: {recursive: node.value.recursive || node.value.recursesTo !== undefined}}))
      .value()
    var newEdges = _(nodes)
      .map((node, idx) => appendNodeName(node, graphObj.nodes[idx].v))
      .map(compound.flattenEdges)
      .flatten()
      .map((edge) => ({
        v: pathFromEdgeId(edge.from),
        w: pathFromEdgeId(edge.to),
        value: {
          outPort: portFromEdgeId(edge.from),
          inPort: portFromEdgeId(edge.to)
        },
        name: edge.from + '→' + edge.to
      }))
      .value()
    return graphlib.json.read({
      options: { multigraph: true, compound: true, directed: true },
      nodes: newNodes,
      edges: _.concat(graphObj.edges, newEdges)
    })
  })
}
