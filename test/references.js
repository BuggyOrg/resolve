/* global describe, it */

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import {requiredComponents} from '../src/references'

chai.use(chaiAsPromised)
var expect = chai.expect

describe('References', () => {
  it('finds references correctly', () => {
    expect(requiredComponents({ref: 'meta/id', id: 'node_id'}, '')).to.eql({id: 'node_id', ref: 'meta/id'})
    expect(requiredComponents({id: 'node_id'}, '')).to.be.undefined
  })

  it('processes implementations of compounds', () => {
    expect(requiredComponents({id: 'cmp', implementation: {
      nodes: [{ref: 'meta/id', id: 'node_id'}, {ref: 'meta/id', id: 'node_id2'}]
    }})).to.eql([
      {id: 'node_id', ref: 'meta/id', type: 'compound', compound: 'cmp'},
      {id: 'node_id2', ref: 'meta/id', type: 'compound', compound: 'cmp'}
    ])
  })
})
