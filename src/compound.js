
import _ from 'lodash'
import cuid from 'cuid'

/**
 * queries all information on compound nodes.
 */
export function queryNode (node, resolveFn, resolveBranch = []) {
  var branchIdx = _.findIndex(resolveBranch, (n) => n.meta === node.meta)
  if (branchIdx !== -1) {
    return Promise.resolve(resolveBranch[branchIdx])
  }
  return resolveFn(node.meta, node.version)
  .then((resNode) => {
    resNode.branch = resolveBranch
    resNode.uniqueId = cuid()
    if (resNode.atomic) {
      return resNode
    } else {
      var nodeIdentifier = {meta: resNode.id, version: resNode.version, uniqueId: resNode.uniqueId}
      var queryNextNode = _.partial(queryNode, _, resolveFn, resolveBranch.concat([nodeIdentifier]))
      return Promise.all(_.map(resNode.implementation.nodes, queryNextNode))
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

export function extractEdges (node) {
}
