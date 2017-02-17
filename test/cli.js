/* eslint-env mocha */
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import {exec} from 'child_process'

chai.use(chaiAsPromised)
var expect = chai.expect

const runProgram = (program, args, data) => {
  return new Promise((resolve, reject) => {
    var cli = exec(program + ' ' + args,
      (error, stdout, stderr) => {
        if (error) {
          reject({ error, stderr })
        } else {
          resolve({ stdout })
        }
      }
    )
    if (data) {
      if (typeof data !== 'string') {
        data = JSON.stringify(data)
      }
      cli.stdin.write(data)
      cli.stdin.end()
    }
  })
}

const runCLI = (args, data) => {
  return runProgram('node lib/cli ', args, data)
}

describe('Resolve CLI', () => {
  it('returns a non-zero exit code on errors', async () => {
    try {
      await runCLI('', 'this is not json')
      expect.fail()
    } catch ({ error }) {
      expect(error).not.to.be.undefined
      expect(error.code).not.to.equal(0)
    }
  }).timeout(5000)
})
