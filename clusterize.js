'use strict';

const path = require('path');
const SynoGraph = require('synograph').SynoGraph;

SynoGraph.load(path.join(__dirname, 'data')).then(g => {
  g.clusterize(path.join(__dirname, 'fbcluster'))
  .then(() => console.log('Clusterized'))
  .catch(console.error.bind(console));
});
