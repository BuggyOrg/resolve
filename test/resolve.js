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
  return Promise.resolve(components[name])
}

describe('Elastic search meta information interface', () => {
  it('`resolve` should leave atomics untouched', () => {
    var atomicsGraph = readFixture('atomic.dot')
    return resolve(atomicsGraph, resolveFn)
    .then(resolved => {
      expect(resolved).to.be.an('object')
      expect(resolved.nodes()).to.have.length(1)
      expect(resolved.node('a').node.atomic).to.be.true
    })
  })
})
