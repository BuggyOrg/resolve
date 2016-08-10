/* global describe, it */

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinonChai from 'sinon-chai'
import sinon from 'sinon'
import {resolve} from '../src/api'
import * as components from './components.json'
import * as Graph from '@buggyorg/graphtools'
import * as Library from '@buggyorg/library-client'
import _ from 'lodash'

chai.use(chaiAsPromised)
chai.use(sinonChai)
var expect = chai.expect

var library = Library.fromFile('./test/components.json')
library.then((client) => client.components())
.then((cmps) => console.log(cmps))

describe('Resolving port graph nodes', () => {
  it('can resolve nodes with references to components', () => {
    var graph = Graph.empty()
    .addNode({ref: 'test/atomic', name: 'a'})

    return library.then((client) => resolve(graph, client))
    .then((resGraph) => {
      console.log(resGraph)
      expect(resGraph.allComponents()).to.have.length(1)
    })
  })
})
