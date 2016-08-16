/* global describe, it */

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import {resolve} from '../src/api'
import * as Graph from '@buggyorg/graphtools'
import * as Library from '@buggyorg/library-client'

chai.use(chaiAsPromised)
var expect = chai.expect

var library = Library.fromFile('./test/components.json')

describe('Resolving port graph nodes', () => {
  it('can resolve nodes with references to components in a library', () => {
    var graph = Graph.empty()
    .addNode({ref: 'test/atomic', id: 'a'})

    return library.then((client) => resolve(graph, client.component))
    .then((resGraph) => {
      expect(resGraph.components()).to.have.length(1)
    })
  })

  it('can resolve nodes with references to components in the graph', () => {
    var graph = Graph.empty()
    .addNode({ref: 'graph_component', id: 'a'})
    .addComponent({meta: 'graph_component', version: '0.1.0', ports: [{name: 'output', kind: 'output', type: 'string'}], atomic: true})

    return library.then((client) => resolve(graph, client.component))
    .then((resGraph) => {
      expect(resGraph.components()).to.have.length(1)
    })
  })

  it.only('can resolve compound nodes and their references', () => {
    var graph = Graph.empty()
    .addNode({ref: 'test/compound', id: 'a'})

    return library.then((client) => resolve(graph, client.component))
    .then((resGraph) => {
      expect(resGraph.nodes()).to.have.length(1)
      expect(resGraph.components()).to.have.length(2)
    })
  })

  it('fails if the component could not be found', () => {
    var graph = Graph.empty()
    .addNode({ref: 'non_existent', id: 'a'})

    return expect(library.then((client) => resolve(graph, client.component))).to.be.rejectedWith(/non_existent/)
  })
})
