
import _ from 'lodash'

/**
 * queries all information on compound nodes.
 */
export function queryCompound (node, resolveFn) {
  var nodes = _(node.implementation.nodes)
    .map((node) => resolveFn(node.meta, node.version))
    .value()
  return Promise.all(nodes)
    .then((nodes) => {
      var atomics = _.filter(nodes, (node) => node.atomic)
      var queriedNodes = _(nodes)
        .filter((node) => !node.atomic)
        .map(_.partial(queryCompound, _, resolveFn))
        .value()

      return Promise.all(queriedNodes)
        .then((qNodes) => {
          var newNode = _.cloneDeep(node)
          _.set(newNode, 'implementation.nodes', queriedNodes.concat(atomics))
          return newNode
        })
    })
}

/**
 * gets a compound node and returns an array of atomics + compound nodes
 * @param {any} node The node to process
 * @return {Array} An array containing all the atomics of the compound node.
 */
export function flattenCompound (node) {
  if (node.atomic) {
    return [node]
  } else {
    var impls = _(node.implementation.nodes)
      .map(flattenCompound)
      .flatten()
      .value()
    return [node].concat(impls)
  }
}

