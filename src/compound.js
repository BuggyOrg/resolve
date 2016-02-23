
import cuid from 'cuid'
import _ from 'lodash'

/**
 * queries all information on compound nodes.
 */
export function queryCompound (node, resolveFn) {
  return node
}

/**
 * gets a compound node and returns an array of atomics + compound nodes
 * @param {any} node The node to process
 * @return {Array} An array containing all the atomics of the compound node.
 */
export function flattenCompound (node) {
  if (node.value.atomic) {
    return [node]
  } else {
    var impls = _.map(node.value.implementation.nodes, (node) => ({ v: node.id + ':' + cuid(), value: node }))
    return [node].concat(impls)
  }
}

