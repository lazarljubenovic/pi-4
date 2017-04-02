import 'babel-polyfill'
import {readFileSync as read, writeFileSync as write} from 'fs'
import * as math from 'mathjs'

// arguments from command line
const args = process.argv.slice(2)
const [INUPT, OUTPUT] = [args[0] || 'graph.json', args[1]]

// for prettier printing
const prettifyMatrix = matrix =>
  matrix.map(row => row.map(n => n.toFixed(4)).join('  ')).join('\n')
const prettifyVector = vector => vector.map(x => x.toFixed(6)).join('\n')
const trim = string => string.replace(/\n\s*/g, '\n')
const repeat = (char, times) => new Array(times).fill(char).join('')
export const asTitle = title => trim(`\n\n╔═${repeat('═', 76) }═╗
                                          ║ ${title.padEnd(76)} ║
                                          ╚═${repeat('═', 76) }═╝\n`)

const ALPHA = .9 // probability of using teleport
const graph = JSON.parse(read(INUPT, 'utf8'))
const getNodes = graph => Object.keys(graph)  // gets array of node names
const getLength = graph => getNodes(graph).length

// transforms json to a matrix with filled probabilities of navigation
const toMatrix = graph => {
  const nodes = getNodes(graph)
  return nodes.map(node => {
    const probability = 1 / graph[node].length
    return nodes.map(flag => graph[node].includes(flag) ? probability : 0)
  })
}

const matrix = toMatrix(graph)

// const N = getNodes(graph).length
const totalProb = (N, pl) => (ALPHA / N) + (1 - ALPHA) * pl
const transitionMatrix = PL => PL.map(row => row.map(totalProb.bind(null, PL.length)))

// test if two floats can be considered as equal based on eps value
const isEqual = (eps, a, b) => Math.abs(a - b) < eps
const hasConverged = isEqual.bind(this, 0.001) // eps =  0.001

// check if all values in two vectors have converged
const hasConvergedVector = (a, b) => a.every((item, i) => hasConverged(item, b[i]))

// iterate until vectors have convereged by the given formula
const getRang = (initial, P) => {
  let prev = P.map(_ => 0)
  let curr = initial
  while (!hasConvergedVector(prev, curr)) {
    prev = curr
    curr = math.multiply(prev, P)
  }
  return curr
}

// for example (4, 0) => [1, 0, 0, 0]
const getVectorByInitialPage = (length, index) => {
  let zeros = new Array(length).fill(0)
  return zeros.map((x, i) => index == i ? 1 : 0)
}
// for example (4) => [.25, .25, .25, .25]
const getEqualVector = length => new Array(length).fill(1 / length)
const rang = getRang(getEqualVector(getLength(graph)), transitionMatrix(matrix))

const toAdjacencyMatrix = graph => {
  const nodes = getNodes(graph)
  return nodes.map(node => nodes.map(f => graph[node].includes(f) ? 1 : 0))
}
const normalize = vector => vector.map(el => el / Math.hypot(...vector))
const normalizedMul = (a, b) => normalize(math.multiply(a, b))
const vectorOnes = length => new Array(length).fill(1)
const HITs = graph => {
  const A = toAdjacencyMatrix(graph)
  const At = math.transpose(A)
  let [a, h] = [vectorOnes(A.length), vectorOnes(At.length)]
  let aprev, hprev
  let [AAt, AtA] = [math.multiply(A, At), math.multiply(At, A)]
  do {
    ;[aprev, hprev] = [a, h]
    ;[a, h] = [normalizedMul(AAt, aprev), normalizedMul(AtA, hprev)]
  } while (!hasConvergedVector(aprev, a) && !hasConvergedVector(hprev, h))
  return {a, h}
}
const {a, h} = HITs(graph)

const report = [ asTitle('transitionMatrix'),
  prettifyMatrix(transitionMatrix(matrix), getNodes(graph)),
  asTitle('Rank of pages'), prettifyVector(rang),
  asTitle('Vector a'), prettifyVector(a),
  asTitle('Vector h'), prettifyVector(h), ''
].join('\n')

OUTPUT && write(OUTPUT, report, 'utf-8') || console.log(report)
