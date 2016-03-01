/* global describe, it */

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinonChai from 'sinon-chai'
import sinon from 'sinon'
import resolveWith from '../src/api'
import * as compound from '../src/compound'
import graphlib from 'graphlib'
import gdot from 'graphlib-dot'
import fs from 'fs'
import {extname} from 'path'
import 'babel-register'
import * as components from './components.json'
import _ from 'lodash'

chai.use(chaiAsPromised)
chai.use(sinonChai)
var expect = chai.expect

var readFixture = (file) => {
  if (extname(file) === '.dot') {
    return gdot.read(fs.readFileSync('test/fixtures/' + file, 'utf8'))
  } else {
    return graphlib.json.read(JSON.parse(fs.readFileSync('test/fixtures/' + file)))
  }
}

const resolveFn = (name, version) => {
  if (name in components) {
    return Promise.resolve(_.cloneDeep(components[name]))
  } else {
    return Promise.reject('Component "' + name + '" undefined')
  }
}

describe('Resolving port graph nodes', () => {
  var resolve = _.partial(compound.queryNode, _, resolveFn)

  it('`resolveWith` should only add component information to atomics', () => {
    var atomicsGraph = readFixture('atomic.dot')
    return resolveWith(atomicsGraph, resolve)
    .then((resolved) => {
      expect(resolved).to.be.an('object')
      expect(resolved.nodes()).to.have.length(1)
      expect(resolved.node('a').atomic).to.be.true
    })
  })

  it('`resolveWith` fails if a component is not defined', () => {
    var nonExistentGraph = readFixture('nonExistent.dot')
    return expect(resolveWith(nonExistentGraph, resolve)).to.be.rejected
  })

  it('`resolveWith` can process compound nodes', () => {
    var cmpd = readFixture('compound.dot')
    return resolveWith(cmpd, resolve)
    .then((resolved) => {
      expect(resolved.nodes()).to.have.length(3)
    })
  })

  it('`resolveWith` can process compound nodes with edges', () => {
    var cmpd = readFixture('compoundEdges.dot')
    return resolveWith(cmpd, resolve)
    .then((resolved) => {
      expect(resolved.nodes()).to.have.length(2)
      expect(resolved.edges()).to.have.length(3)
    })
  })
})

describe('Processing compound nodes', () => {
  it('`flattenNode` flattening an atomic returns only the atomic', () => {
    var atomicNode = {id: 'test/test', atomic: true}
    var atomic = compound.flattenNode(atomicNode)
    expect(atomic).to.be.an('array')
    expect(atomic).to.have.length(1)
    expect(atomic[0]).to.deep.equal(atomicNode)
  })

  it('`flattenNode` flattens a compound node into its parts and the parent node', () => {
    var compoundNode = {
      id: 'test/test', implementation: {
        nodes: [_.cloneDeep(components['test/atomic'])],
        edges: []
      }
    }
    var comp = compound.flattenNode(compoundNode)
    expect(comp).to.have.length(2)
    expect(_.filter(comp, (node) => node.id === 'test/test')).to.have.length(1)
    expect(_.filter(comp, (node) => node.id === 'test/atomic')).to.have.length(1)
  })

  it('`flattenNode` flattens deep', () => {
    var cmpd = _.cloneDeep(components['test/compound'])
    var atm = _.cloneDeep(components['test/atomic'])
    cmpd.implementation.nodes[0] = atm
    var compoundNode = {
      id: 'test/test', implementation: {
        nodes: [cmpd],
        edges: []
      }
    }
    var comp = compound.flattenNode(compoundNode)
    expect(comp).to.have.length(3)
    expect(_.filter(comp, (node) => node.id === 'test/test')).to.have.length(1)
    expect(_.filter(comp, (node) => node.id === 'test/atomic')).to.have.length(1)
    expect(_.filter(comp, (node) => node.id === 'test/compound')).to.have.length(1)
  })

  it('`flattenEdges` returns the edges of a compound node', () => {
    var cmpd = _.cloneDeep(components['test/edge'])
    cmpd.path = []
    cmpd.branch = cmpd.id
    var edges = compound.flattenEdges(cmpd)
    expect(edges).to.have.length(1)
    expect(edges[0]).to.deep.equal({from: 'test/edge:in', to: 'test/edge:out'})
  })

  it('`flattenEdges` returns all edges of compound implementations', () => {
    var cmpd = _.cloneDeep(components['test/edges'])
    var cmpd2 = _.cloneDeep(components['test/edge'])
    cmpd2.name = 'e'
    cmpd2.path = [{branchName: cmpd2.id, path: [cmpd.id]}]
    cmpd.implementation.nodes = [cmpd2]
    var edges = compound.flattenEdges(cmpd)
    console.log(edges)
    expect(edges).to.have.length(3)
  })

  it('`queryNode` resolves each inner node', () => {
    var node = {meta: 'test/atomic', version: '0.1.0'}
    return compound.queryNode(node, resolveFn)
    .then(comp => {
      expect(_.omit(comp, 'uniqueId')).to.deep.equal(_.merge(components['test/atomic'], {branch: []}))
    })
  })

  it('`queryNode` resolves deeply', () => {
    var node = {meta: 'test/compound', version: '0.1.0'}
    var resSpy = sinon.spy(resolveFn)
    return compound.queryNode(node, resSpy)
      .then(() => {
        expect(resSpy).to.have.been.calledWith('test/compound', '0.1.0')
        expect(resSpy).to.have.been.calledWith('test/atomic', '0.1.0')
      })
  })

  it('`queryNode` resolves recursive nodes only once', () => {
    var node = {meta: 'test/recursive', version: '0.1.0'}
    var resSpy = sinon.spy(resolveFn)
    return compound.queryNode(node, resSpy)
      .then(() => {
        expect(resSpy).to.have.been.calledWith('test/recursive', '0.1.0')
        expect(resSpy).to.have.been.calledOnce
      })
  })

  it('`queryNode` contains the resolve branch in every node', () => {
    var node = {meta: 'test/compound', version: '0.1.0'}
    return compound.queryNode(node, resolveFn)
      .then(compound.flattenNode)
      .then((nodeArr) => {
        expect(_.filter(nodeArr, (node) => node.id === 'test/compound')[0]).to.have.property('branch')
        expect(_.filter(nodeArr, (node) => node.id === 'test/atomic')[0]).to.have.property('branch')
        expect(_.filter(nodeArr, (node) => node.id === 'test/atomic')[0].branch).to.have.length(1)
      })
  })

  it('`queryNode` should reject non existing components', () => {
    var node = {meta: 'nonExisting', version: '0.1.2'}
    return expect(compound.queryNode(node, resolveFn)).to.be.rejected
  })
})

