
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
export function queryNode (node, resolveFn, resolved = {}, resolvePath = []) {
  var resPromise = null
  if (node.id) {
    var exComp = {externalComponent: false}
    if (resolved[node.id] && resolved[node.id].externalComponent) {
      exComp = {externalComponent: resolved[node.id].externalComponent}
    }
    resPromise = Promise.resolve(_.merge({}, node, exComp))
  } else if (resolved[node.meta] && resolved[node.meta].externalComponent) {
    // Caution: no resolve over meta-id. If the node contains parameters it is important to not lose them
    // or use params of another node.
    resPromise = Promise.resolve(_.cloneDeep(resolved[node.meta]))
  } else {
    resPromise = resolveFn(node.meta, node.version)
  }
  return resPromise
  .then((resNode) => {
    if (_.has(resolved, resNode.id) && resolved[resNode.id].externalComponent) {
      resNode.externalComponent = true
      resolved[node.meta] = resNode
    } else {
      resolved[(node.name) ? node.name : node.meta] = resNode
    }
    var branchName = (node.name) ? node.name : resNode.id
    var nodeIdentifier = {meta: resNode.id, branch: branchName, version: resNode.version, uniqueId: resNode.uniqueId, path: resolvePath}
    var newPath = appendBranch(resolvePath, nodeIdentifier)
    var branchPath = pathToString(newPath, (b) => b.branch)

    resNode.path = _.map(resolvePath, (p) => _.omit(p, 'path'))
    resNode.params = node.params
    resNode.typeHint = node.typeHint
    if (resolvePath.length !== 0) {
      resNode.parent = pathToString(resolvePath, (b) => b.branch)
    }
    resNode.branchPath = branchPath
    resNode.branch = branchName
    if (node.values) {
      resNode.values = node.values
    }
    var branchIdx = _.findIndex(resolvePath, (n) => n.meta === node.meta && n.branch === node.name)
    if (branchIdx !== -1) {
      resNode.recursive = true
    }
    var isRecursive = _.find(resolvePath, (n) => n.meta === node.meta)
    var queryNextNode = _.partial(queryNode, _, resolveFn, resolved, newPath)
    if (isRecursive) {
      resNode.recursesTo = isRecursive
      resNode.recursive = true
      delete resNode.path
    }
    if (resNode.atomic || resNode.recursive) {
      if (resNode.id === 'functional/lambda') {
        var lambda = node.data
        lambda.id = resNode.branch + '_impl'
        lambda.externalComponent = true
        resolved[lambda.id] = lambda
        return queryNextNode(lambda)
        .then((lambdaImpl) => {
          resNode.params = resNode.params || {}
          resNode.params.implementation = lambdaImpl.branchPath
          resNode.isLambda = true
          resNode.data = lambdaImpl
          return resNode
        })
      }
      return resNode
    } else {
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
  if (node.atomic || node.recursive) {
    if (node.isLambda && node.data) {
      return [node].concat(flattenNode(node.data))
    }
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
  if (node.atomic || node.recursive) {
    if (node.isLambda && node.data) {
      return flattenEdges(node.data)
    }
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
