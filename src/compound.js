
import _ from 'lodash'

export function appendBranch (path, branch) {
  return path.concat([branch])
}

export function pathToString (path, itemToId) {
  return (path.length === 0)
    ? ''
    : path.map(itemToId).join(':')
}

/**
 * queries all information on compound nodes.
 */
export function queryNode (node, resolveFn, resolvePath = []) {
  var branchIdx = _.findIndex(resolvePath, (n) => n.meta === node.meta)
  if (branchIdx !== -1) {
    return Promise.resolve(resolvePath[branchIdx])
  }
  return resolveFn(node.meta, node.version)
  .then((resNode) => {
    var branchName = (node.name) ? node.name : resNode.id
    var nodeIdentifier = {meta: resNode.id, branch: branchName, version: resNode.version, uniqueId: resNode.uniqueId, path: resolvePath}
    var newPath = appendBranch(resolvePath, nodeIdentifier)
    // var branchPath = pathToString(newPath, (b) => b.branch)

    resNode.path = resolvePath
    resNode.branch = branchName
    if (resNode.atomic) {
      return resNode
    } else {
      var queryNextNode = _.partial(queryNode, _, resolveFn, newPath)
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

export function flattenEdges (node) {
  if (node.atomic) {
    return []
  } else {
    var subEdges = _(node.implementation.nodes)
      .map(flattenEdges)
      .flatten()
      .value()
    var edges = _(node.implementation.edges)
      .map((e) => {
        var e2 = _.cloneDeep(e)
        var pathId = pathToString(node.path, (b) => b.branch)
        if (node.path.length !== 0) {
          pathId += ':'
        }
        var nodeId = node.branch
        e2.from = pathId + nodeId + ':' + e2.from
        e2.to = pathId + nodeId + ':' + e2.to
        return e2
      })
      .value()
    return edges.concat(subEdges)
  }
}
