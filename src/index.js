import {readFileSync as read, writeFileSync as write} from 'fs'
import * as math from 'mathjs'

// arguments from command line
const args = process.argv.slice(2)
const INUPT = args[0] || 'graph.json' // read json from here
const OUTPUT = args[1]                // write here (if falsey, console.log)

// returns a table-like pretty string for a given matrix of numbers
const prettify = (matrix) =>
  matrix.map((row, i) => row.map(n => n.toFixed(4)).join('  ')).join('\n')

const ALPHA = .9 // probability of using teleport
const graph = JSON.parse(read(INUPT, 'utf8'))
const getNodes = graph => Object.keys(graph)  // gets array of node names

// transforms json strcture to a matrix with filed probabilities of navigation
// for example, for   A -> B, C    B -> A    C -> A   the result is:
// [ [ 0.0, 0.5, 0.5 ]     // from A to A, B, C
//   [ 1.0, 0.0, 0.0 ]     // from B to A, B, C
//   [ 1.0, 0.0, 0.0 ] ]   // from C to A, B, C
const toMatrix = graph => {
  const nodes = getNodes(graph)
  return nodes.map(node => {
    const numberOfNeighbors = graph[node].length
    const probability = 1 / numberOfNeighbors
    return nodes.map(flag => graph[node].includes(flag) ? probability : 0)
  })
}

const matrix = toMatrix(graph)

const N = getNodes(graph).length
const totalProbability = pl => (ALPHA / N) + (1 - ALPHA) * pl
const transitionMatrix = PL => PL.map(row => row.map(totalProbability))

// test if two floats can be considered as equal based on eps value
const isEqual = (eps, a, b) => Math.abs(a - b) < eps
const hasConverged = isEqual.bind(this, 0.001) // eps =  0.001

// check if all values in two vectors have converged
const hasConvergedVector = (a, b) =>
  a.every((item, i) => hasConverged(item, b[i]))

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
// or          (3, 1) => [0, 1, 0]
const getVectorByInitialPage = (length, index) => {
  let zeros = new Array(length).fill(0)
  return zeros.map((x, i) => index == i ? 1 : 0)
}
// for example (4) => [.25, .25, .25, .25]
// or          (2) => [.5, .5]
const getEqualVector = length => new Array(length).fill(1 / length)
const rang = getRang(getEqualVector(N), transitionMatrix(matrix))

// write an awesome report
const report = `REPORT

=== Transition matrix P ===
${prettify(transitionMatrix(matrix), getNodes(graph))}

=== Rank of pages ===
${rang.map(x => x.toFixed(6)).join('\n')}
`

// write to fil or console depending on process args given to program
if (OUTPUT) {
  write(OUTPUT, 'utf-8')
} else {
  console.log(report)
}
