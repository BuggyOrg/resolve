
import graphlib from 'graphlib'
import co from 'co'
import _ from 'lodash'

export default function resolve (graph, resolve) {
  var graphObj = graphlib.json.write(graph)

  return co(function * () {
    return yield graphObj.nodes.map((node) => {
      return resolve(node.value.meta)
    })
  }).then((nodes) => {
    return graphlib.json.read({
      options: graphObj.options,
      nodes: _.map(graphObj.nodes, (node, idx) => _.merge({}, node, {value: {component: nodes[idx]}})),
      edges: graphObj.edges
    })
  })
}
