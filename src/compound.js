
import cuid from 'cuid'
import _ from 'lodash'

/**
 * queries all information on compound nodes.
 */
export function queryCompound (node, resolveFn) {
  var nodes = _(node.value.implementation.nodes).chain()
    .map(resolveFn)
  return Promise.all(nodes)
    .then((nodes) => {
      var queriedNodes = nodes
      var newNode = _.cloneDeep(node)
      _.set(newNode, 'value.implementation.nodes', queriedNodes)
      return newNode
    })
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
    var impls = _(node.value.implementation.nodes)
      .map((node) => ({ v: node.id + ':' + cuid(), value: node }))
      .map(flattenCompound)
      .flatten()
      .value()
    return [node].concat(impls)
  }
}

