/* global describe, it */

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinonChai from 'sinon-chai'
import sinon from 'sinon'
import resolve from '../src/api'
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
    return Promise.resolve(components[name])
  } else {
    return Promise.reject('Component "' + name + '" undefined')
  }
}

describe('Resolving port graph nodes', () => {
  it('`resolve` should only add component information to atomics', () => {
    var atomicsGraph = readFixture('atomic.dot')
    return resolve(atomicsGraph, resolveFn)
    .then(resolved => {
      expect(resolved).to.be.an('object')
      expect(resolved.nodes()).to.have.length(1)
      expect(resolved.node('a').component.atomic).to.be.true
    })
  })

  it('`resolve` fails if a component is not defined', () => {
    var nonExistentGraph = readFixture('nonExistent.dot')
    return expect(resolve(nonExistentGraph, resolveFn)).to.be.rejected
  })

  it('`flattenComponents` flattening an atomic returns only the atomic', () => {
    var atomicNode = {v: 'test', value: {meta: 'test/test', atomic: true}}
    var atomic = compound.flattenCompound(atomicNode)
    expect(atomic).to.be.an('array')
    expect(atomic).to.have.length(1)
    expect(atomic[0]).to.deep.equal(atomicNode)
  })

  it('`flattenComponents` flattens a compound node into its parts and the parent node', () => {
    var compoundNode = {
      v: 'test', value: {
        id: 'test/test', implementation: {
          nodes: [components['test/atomic']],
          edges: []
        }
      }
    }
    var comp = compound.flattenCompound(compoundNode)
    expect(comp).to.have.length(2)
    expect(_.filter(comp, (node) => node.value.id === 'test/test')).to.have.length(1)
    expect(_.filter(comp, (node) => node.value.id === 'test/atomic')).to.have.length(1)
  })

/*  it('`flattenComponents` flattens deep', () => {
    var compoundNode = {
      v: 'test', value: {
        id: 'test/test', implementation: {
          nodes: [test/compound'],
          edges: []
        }
      }
    }
    var comp = compound.flattenCompound(compoundNode)
    expect(comp).to.have.length(3)
    expect(_.filter(comp, (node) => node.value.id === 'test/test')).to.have.length(1)
    expect(_.filter(comp, (node) => node.value.id === 'test/atomic')).to.have.length(1)
    expect(_.filter(comp, (node) => node.value.id === 'test/compound')).to.have.length(1)
  })*/

  it('`queryCompound` resolves each inner node', () => {
    var compoundNode = {
      v: 'test', value: {
        id: 'test/test', implementation: {
          nodes: ['test/atomic'],
          edges: []
        }
      }
    }
    return compound.queryCompound(compoundNode, resolveFn)
    .then(comp => {
      expect(comp).to.deep.equal({
        v: 'test', value: {
          id: 'test/test', implementation: {
            nodes: [components['test/atomic']],
            edges: []
          }
        }
      })
    })
  })

  it('`queryCompound` resolves deeply', () => {
    var compoundNode = {
      v: 'test', value: {
        id: 'test/test', implementation: {
          nodes: ['test/compound'],
          edges: []
        }
      }
    }
    var resSpy = sinon.spy(resolveFn)
    return compound.queryCompound(compoundNode, resSpy)
      .then(() => {
        expect(resSpy).to.have.been.calledWith('test/compound')
        expect(resSpy).to.have.been.calledWith('test/atomic')
      })
  })
})
