#!/usr/bin/env node
/* global __dirname, process */

import program from 'commander'
import fs from 'fs'
import graphlib from 'graphlib'
import connect from '@buggyorg/component-library'
import getStdin from 'get-stdin'
import chalk from 'chalk'
import resolve from './api'
import _ from 'lodash'

var server = ''
var defaultElastic = ' Defaults to BUGGY_COMPONENT_LIBRARY_HOST'

const log = function (...args) {
  if (!program.silent) {
    console.log.call(console.log, ...args)
  }
}

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
  .version(JSON.parse(fs.readFileSync(__dirname + '/../package.json'))['version'])
  .option('-h, --host <host>', 'The library elastic server to connect to.' + defaultElastic, String, server)
  .option('-n, --nice', 'Pretty print all JSON output')
  .option('-f, --file', '(Optional) The graphfile to resolve')
  .arguments('[graphfile]')
  .parse(process.argv)

stdinOrFile(program.file)
  .then((contents) => {
    console.log(contents)
    return graphlib.json.read(contents)
  })
  .then((graph) => {
    var client = connect(program.host)
    return resolve(graph, client.get)
  })
  .then((resGraph) => {
    printJSON(graphlib.json.write(resGraph))
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
