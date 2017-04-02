'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.asTitle = undefined;

require('babel-polyfill');

var _fs = require('fs');

var _mathjs = require('mathjs');

var math = _interopRequireWildcard(_mathjs);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

// arguments from command line
var args = process.argv.slice(2);
var _ref = [args[0] || 'graph.json', args[1]],
    INUPT = _ref[0],
    OUTPUT = _ref[1];

// for prettier printing

var prettifyMatrix = function prettifyMatrix(matrix) {
  return matrix.map(function (row) {
    return row.map(function (n) {
      return n.toFixed(4);
    }).join('  ');
  }).join('\n');
};
var prettifyVector = function prettifyVector(vector) {
  return vector.map(function (x) {
    return x.toFixed(6);
  }).join('\n');
};
var trim = function trim(string) {
  return string.replace(/\n\s*/g, '\n');
};
var repeat = function repeat(char, times) {
  return new Array(times).fill(char).join('');
};
var asTitle = exports.asTitle = function asTitle(title) {
  return trim('\n\n\u2554\u2550' + repeat('═', 76) + '\u2550\u2557\n                                          \u2551 ' + title.padEnd(76) + ' \u2551\n                                          \u255A\u2550' + repeat('═', 76) + '\u2550\u255D\n');
};

var ALPHA = .9; // probability of using teleport
var graph = JSON.parse((0, _fs.readFileSync)(INUPT, 'utf8'));
var getNodes = function getNodes(graph) {
  return Object.keys(graph);
}; // gets array of node names
var getLength = function getLength(graph) {
  return getNodes(graph).length;
};

// transforms json to a matrix with filled probabilities of navigation
var toMatrix = function toMatrix(graph) {
  var nodes = getNodes(graph);
  return nodes.map(function (node) {
    var probability = 1 / graph[node].length;
    return nodes.map(function (flag) {
      return graph[node].includes(flag) ? probability : 0;
    });
  });
};

var matrix = toMatrix(graph);

// const N = getNodes(graph).length
var totalProb = function totalProb(N, pl) {
  return ALPHA / N + (1 - ALPHA) * pl;
};
var transitionMatrix = function transitionMatrix(PL) {
  return PL.map(function (row) {
    return row.map(totalProb.bind(null, PL.length));
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
var getVectorByInitialPage = function getVectorByInitialPage(length, index) {
  var zeros = new Array(length).fill(0);
  return zeros.map(function (x, i) {
    return index == i ? 1 : 0;
  });
};
// for example (4) => [.25, .25, .25, .25]
var getEqualVector = function getEqualVector(length) {
  return new Array(length).fill(1 / length);
};
var rang = getRang(getEqualVector(getLength(graph)), transitionMatrix(matrix));

var toAdjacencyMatrix = function toAdjacencyMatrix(graph) {
  var nodes = getNodes(graph);
  return nodes.map(function (node) {
    return nodes.map(function (f) {
      return graph[node].includes(f) ? 1 : 0;
    });
  });
};
var normalize = function normalize(vector) {
  return vector.map(function (el) {
    return el / Math.hypot.apply(Math, _toConsumableArray(vector));
  });
};
var normalizedMul = function normalizedMul(a, b) {
  return normalize(math.multiply(a, b));
};
var vectorOnes = function vectorOnes(length) {
  return new Array(length).fill(1);
};
var HITs = function HITs(graph) {
  var A = toAdjacencyMatrix(graph);
  var At = math.transpose(A);
  var _ref2 = [vectorOnes(A.length), vectorOnes(At.length)],
      a = _ref2[0],
      h = _ref2[1];

  var aprev = void 0,
      hprev = void 0;
  var _ref3 = [math.multiply(A, At), math.multiply(At, A)],
      AAt = _ref3[0],
      AtA = _ref3[1];

  do {
    ;aprev = a;
    hprev = h;
    var _ref4 = [normalizedMul(AAt, aprev), normalizedMul(AtA, hprev)];
    a = _ref4[0];
    h = _ref4[1];
  } while (!hasConvergedVector(aprev, a) && !hasConvergedVector(hprev, h));
  return { a: a, h: h };
};

var _HITs = HITs(graph),
    a = _HITs.a,
    h = _HITs.h;

var report = [asTitle('transitionMatrix'), prettifyMatrix(transitionMatrix(matrix), getNodes(graph)), asTitle('Rank of pages'), prettifyVector(rang), asTitle('Vector a'), prettifyVector(a), asTitle('Vector h'), prettifyVector(h), ''].join('\n');

OUTPUT && (0, _fs.writeFileSync)(OUTPUT, report, 'utf-8') || console.log(report);
