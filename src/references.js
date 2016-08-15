
import _ from 'lodash'
import {Node} from '@buggyorg/graphtools'

/**
 * Find all necessary components in a node. If the node is a reference, this reference is a necessary component.
 * If the node is a compound node look for the implementation and process the nodes recursively.
 * @param {Node} node The node for which we want to find all components
 * @returns {Reference|array|undefined}
 *  - If the node is a reference it will return the reference.
 *  - If the node is a compound node. It will return an array of all the references defined in the implementation.
 *    Those references contain two additional fields,
 *
 *     `type: 'compound'` and `compound: <compound-id>`.
 *
 *   These fields identify the compound in which the reference is used.
 *  - If the node is already a valid node it will return undefined.
 */
export function requiredComponents (node) {
  if (Node.isReference(node)) {
    return node
  } else if (Node.isCompound(node)) {
    console.log(node.implementation.nodes)
    console.log(node.implementation.nodes.map(requiredComponents))
    return _.compact(node.implementation.nodes.map(requiredComponents)).map((ref) => _.merge({type: 'compound', compound: node.id}, ref))
  }
  console.log('not resolved', node)
}
