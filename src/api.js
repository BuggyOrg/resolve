
// import GraphAPI from '@buggyorg/graphtools'
import _ from 'lodash'

export function resolve (graph, client) {
  var cmps = graph.componentIds()
  var needed = graph.references().map((r) => r.ref)
  var resolves = _.difference(needed, cmps)
  return Promise.all(resolves.map((ref) => client.component(ref)))
  .then((newComponents) => {
    graph = newComponents.reduce((gr, cmp) => gr.addComponent(cmp), graph)
    console.log(graph.allComponents())
    return graph.disallowReferences()
  })
}
