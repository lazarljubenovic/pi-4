# PageRank & HITs algorithm implementation

A project for Information Retrieval class.

## Running locally

Requires `nodejs` (tested with `7.3.0`):

```
$ git clone https://github.com/lazarljubenovic/pi-4
$ node ./pi-4/index.js
```

You can also pass it a filename for reading the graph in `json` format as a first argument. If none is given, defaults to `graph.json`.

```
$ cd pi-4
$ node index.js simple-graph.json
```

The second argument is the destination of the report. Defaults to printing in console.

```
$ cd pi-4
$ node index.js graph.json results.txt
```

## Development guide

Requires `nodejs` and `yarn`. Transpiled with `babel` to `index.js` in watch mode.

```
$ git clone https://github.com/lazarljubenovic/pi-4
$ cd pi-4
$ yarn
$ yarn dev
```

## Results of the experiment

TODO
