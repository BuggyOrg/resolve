
import graphlib from 'graphlib'
import _ from 'lodash'
import * as compound from './compound'

var pathFromEdgeId = (edgeId) => edgeId.split(':').slice(0, -1).join(':')
var portFromEdgeId = (edgeId) => edgeId.split(':').slice(-1)[0]
var appendNodeName = (node, name) => _.merge({}, node, {name: name})

export default function resolveWith (graph, resolve) {
  var graphObj = graphlib.json.write(graph)

  return Promise.all(graphObj.nodes.map((node) => resolve(appendNodeName(node.value, node.v))))
  .then((nodes) => {
    var newNodes = _(nodes)
      .map((node, idx) => appendNodeName(node, graphObj.nodes[idx].v))
      .map(compound.flattenNode)
      .flatten()
      .map((node) => ({v: node.branchPath, value: node}))
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
        }
      }))
      .value()
    return graphlib.json.read({
      options: { multigraph: true, compound: true, directed: true },
      nodes: newNodes,
      edges: _.concat(graphObj.edges, newEdges)
    })
  })
}
