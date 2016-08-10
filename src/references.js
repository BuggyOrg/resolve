
import _ from 'lodash'
import {Node} from '@buggyorg/graphtools'

const prefix = (path, root) => (path) ? path + '.' : root

/**
 * Find all necessary components in a node. If the node is a reference, this reference is a necessary component.
 * If the node is a compound node look for the implementation and process the nodes recursively.
 * @param {Node} node The node for which we want to find all components
 * @returns {string|null} A component name or null if no components are required.
 */
export function requiredComponents (node, root) {
  if (Node.isReference(node)) {
    return {name: node.name, ref: node.ref, path: prefix(root, 'Nodes.') + node.name}
  } else if (Node.isCompound(node)) {
    return node.implementation.nodes.map(_.partial(requiredComponents, _, prefix(root, 'Components.') + node.name))
  }
}
