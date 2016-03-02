#!/usr/bin/env node
/* global __dirname, process */

import program from 'commander'
import fs from 'fs'
import graphlib from 'graphlib'
import connect from '@buggyorg/component-library'
import getStdin from 'get-stdin'
import resolve from './api'
import path from 'path'
import * as compound from './compound'
import _ from 'lodash'

var server = ''
var defaultElastic = ' Defaults to BUGGY_COMPONENT_LIBRARY_HOST'

if (process.env.BUGGY_COMPONENT_LIBRARY_HOST) {
  server = process.env.BUGGY_COMPONENT_LIBRARY_HOST
  defaultElastic += '=' + server
} else {
  server = 'http://localhost:9200'
  defaultElastic += ' or if not set to http://localhost:9200'
}

function printJSON (json) {
  if (program.nice) {
    console.log(JSON.stringify(json, null, 2))
  } else {
    console.log(JSON.stringify(json))
  }
}

function stdinOrFile (graphfile) {
  if (!process.stdin.isTTY) {
    return getStdin()
  } else {
    return new Promise((resolve, reject) => {
      fs.readFile(graphfile, 'utf8', (err, contents) => {
        if (err) {
          reject(err)
        } else {
          resolve(contents)
        }
      })
    })
  }
}

program
  .version(JSON.parse(fs.readFileSync(path.join(__dirname, '/../package.json')))['version'])
  .option('-h, --host <host>', 'The library elastic server to connect to.' + defaultElastic, String, server)
  .option('-n, --nice', 'Pretty print all JSON output')
  .option('-f, --file', '(Optional) The graphfile to resolve')
  .arguments('[graphfile]')
  .parse(process.argv)

stdinOrFile(program.file)
  .then((contents) => {
    return graphlib.json.read(JSON.parse(contents))
  })
  .then((graph) => {
    var client = connect(program.host)
    var resolveFn = _.partial(compound.queryNode, _, client.get)
    return resolve(graph, resolveFn)
  })
  .then((resGraph) => {
    printJSON(graphlib.json.write(resGraph))
  })
  .catch((err) => {
    console.error(err.message)
    console.error(err.stack)
    process.exit(1)
  })
