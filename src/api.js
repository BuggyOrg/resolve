
import graphlib from 'graphlib'
import _ from 'lodash'
import * as compound from './compound'

export default function resolveWith (graph, resolve) {
  var graphObj = graphlib.json.write(graph)

  return Promise.all(graphObj.nodes.map((node) => resolve(node.value)))
  .then((nodes) => {
    var newNodes = _(nodes)
        .map((node, idx) => _.merge({}, node, {name: graphObj.nodes[idx].v}))
        .map(compound.flattenNode)
        .flatten()
        .map((node) => ({v: node.name || node.uniqueId, value: node}))
        .value()
    return graphlib.json.read({
      options: { multigraph: true, compound: true, directed: true },
      nodes: newNodes,
      edges: graphObj.edges
    })
  })
}
