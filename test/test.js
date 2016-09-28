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
    var graph = Graph.flow(
      Graph.addNode({ref: 'test/atomic', name: 'a'})
    )()

    return library.then((client) => resolve(graph, client.component))
    .then((resGraph) => {
      expect(Graph.components(resGraph)).to.have.length(1)
    })
  })

  it('can resolve nodes with references to components in the graph', () => {
    var graph = Graph.flow(
      Graph.addNode({ref: 'graph_component', name: 'a'}),
      Graph.addComponent({componentId: 'graph_component', version: '0.1.0', ports: [{port: 'output', kind: 'output', type: 'string'}], atomic: true})
    )()

    return library.then((client) => resolve(graph, client.component))
    .then((resGraph) => {
      expect(Graph.nodes(resGraph)).to.have.length(1)
    })
  })

  it('can resolve compound nodes and their references', () => {
    var graph = Graph.flow(
      Graph.addNode({ref: 'test/compound', name: 'a'})
    )()

    return library.then((client) => resolve(graph, client.component))
    .then((resGraph) => {
      expect(Graph.nodes(resGraph)).to.have.length(1)
      expect(Graph.nodesDeep(resGraph)).to.have.length(2)
      expect(Graph.components(resGraph)).to.have.length(2)
    })
  })

  it('fails if the component could not be found', () => {
    var graph = Graph.flow(
      Graph.addNode({ref: 'non_existent', name: 'a'})
    )()

    return expect(library.then((client) => resolve(graph, client.component))).to.be.rejectedWith(/non_existent/)
  })
})
