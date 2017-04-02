'use strict';

var _fs = require('fs');

var _mathjs = require('mathjs');

var math = _interopRequireWildcard(_mathjs);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

// arguments from command line
var args = process.argv.slice(2);
var INUPT = args[0] || 'graph.json'; // read json from here
var OUTPUT = args[1]; // write here (if falsey, console.log)

// returns a table-like pretty string for a given matrix of numbers
var prettify = function prettify(matrix) {
  return matrix.map(function (row, i) {
    return row.map(function (n) {
      return n.toFixed(4);
    }).join('  ');
  }).join('\n');
};

var ALPHA = .9; // probability of using teleport
var graph = JSON.parse((0, _fs.readFileSync)(INUPT, 'utf8'));
var getNodes = function getNodes(graph) {
  return Object.keys(graph);
}; // gets array of node names

// transforms json strcture to a matrix with filed probabilities of navigation
// for example, for   A -> B, C    B -> A    C -> A   the result is:
// [ [ 0.0, 0.5, 0.5 ]     // from A to A, B, C
//   [ 1.0, 0.0, 0.0 ]     // from B to A, B, C
//   [ 1.0, 0.0, 0.0 ] ]   // from C to A, B, C
var toMatrix = function toMatrix(graph) {
  var nodes = getNodes(graph);
  return nodes.map(function (node) {
    var numberOfNeighbors = graph[node].length;
    var probability = 1 / numberOfNeighbors;
    return nodes.map(function (flag) {
      return graph[node].includes(flag) ? probability : 0;
    });
  });
};

var matrix = toMatrix(graph);

var N = getNodes(graph).length;
var totalProbability = function totalProbability(pl) {
  return ALPHA / N + (1 - ALPHA) * pl;
};
var transitionMatrix = function transitionMatrix(PL) {
  return PL.map(function (row) {
    return row.map(totalProbability);
  });
};

// test if two floats can be considered as equal based on eps value
var isEqual = function isEqual(eps, a, b) {
  return Math.abs(a - b) < eps;
};
var hasConverged = isEqual.bind(undefined, 0.001); // eps =  0.001

// check if all values in two vectors have converged
var hasConvergedVector = function hasConvergedVector(a, b) {
  return a.every(function (item, i) {
    return hasConverged(item, b[i]);
  });
};

// iterate until vectors have convereged by the given formula
var getRang = function getRang(initial, P) {
  var prev = P.map(function (_) {
    return 0;
  });
  var curr = initial;
  while (!hasConvergedVector(prev, curr)) {
    prev = curr;
    curr = math.multiply(prev, P);
  }
  return curr;
};

// for example (4, 0) => [1, 0, 0, 0]
// or          (3, 1) => [0, 1, 0]
var getVectorByInitialPage = function getVectorByInitialPage(length, index) {
  var zeros = new Array(length).fill(0);
  return zeros.map(function (x, i) {
    return index == i ? 1 : 0;
  });
};
// for example (4) => [.25, .25, .25, .25]
// or          (2) => [.5, .5]
var getEqualVector = function getEqualVector(length) {
  return new Array(length).fill(1 / length);
};
var rang = getRang(getEqualVector(N), transitionMatrix(matrix));

// write an awesome report
var report = 'REPORT\n\n=== Transition matrix P ===\n' + prettify(transitionMatrix(matrix), getNodes(graph)) + '\n\n=== Rank of pages ===\n' + rang.map(function (x) {
  return x.toFixed(6);
}).join('\n') + '\n';

// write to fil or console depending on process args given to program
if (OUTPUT) {
  (0, _fs.writeFileSync)(OUTPUT, 'utf-8');
} else {
  console.log(report);
}
