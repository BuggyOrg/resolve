
import _ from 'lodash'
import {Node, Compound} from '@buggyorg/graphtools'

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
 * @throws {Error} If the given node is malformatted.
 */
export function requiredComponents (node) {
  if (Node.isReference(node)) {
    console.log('req is ref', node)
    return node
  } else if (Compound.isCompound(node)) {
    console.log('req is compound', node)
    return _.compact(node.implementation.nodes.map(requiredComponents)).map((ref) => _.merge({type: 'compound', compound: node.id}, ref))
  } else if (!Node.isValid(node)) {
    throw new Error('Cannot resolve invalid node: ' + JSON.stringify(node))
  }
}
