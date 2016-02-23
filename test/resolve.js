/* global describe, it */

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import resolve from '../src/api'
import graphlib from 'graphlib'
import gdot from 'graphlib-dot'
import fs from 'fs'
import {extname} from 'path'
import 'babel-register'
import * as components from './components.json'

chai.use(chaiAsPromised)
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

  it('`resolve` queries compound node data and flattens the inner implementation', () => {
    
  })
})
