
import _ from 'lodash'

/**
 * queries all information on compound nodes.
 */
export function queryNode (node, resolveFn) {
  return resolveFn(node.meta, node.version)
  .then((resNode) => {
    if (resNode.atomic) {
      return resNode
    } else {
      return Promise.all(_.map(resNode.implementation.nodes, _.partial(queryNode, _, resolveFn)))
      .then((implNodes) => {
        resNode.implementation.nodes = implNodes
        return resNode
      })
    }
  })
}

/**
 * gets a compound node and returns an array of atomics + compound nodes
 * @param {any} node The node to process
 * @return {Array} An array containing all the atomics of the compound node.
 */
export function flattenNode (node) {
  if (node.atomic) {
    return [node]
  } else {
    var impls = _(node.implementation.nodes)
      .map(flattenNode)
      .flatten()
      .value()
    return [node].concat(impls)
  }
}

