#!/usr/bin/env node

import * as cliExt from 'cli-ext'
import {resolve} from './api'
import {connect} from '@buggyorg/library-client'

connect(process.env.BUGGY_LIBRARY_HOST)
.then((client) => cliExt.input(process.argv[2])
  .then((graphStr) => {
    var graph
    try {
      graph = JSON.parse(graphStr)
    } catch (err) {
      console.error('[Resolve] Cannot parse input JSON.')
    }
    return resolve(graph, client.component)
  })
)
.then((res) => console.log(JSON.stringify(res, null, 2)))
.catch((err) => console.error(err.stack || err))
