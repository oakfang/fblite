'use strict';

const path = require('path');
const _ = require('lodash');
const SynoGraph = require('synograph').SynoGraph;

function printPost(user, post, level) {
  if (!post.wallOwner || post.poster._id === user._id) {
    console.log(`${'\t'.repeat(level)}${level > 1 ? '+' : ''}${post.poster.name}`);
  } else {
    console.log(`${'\t'.repeat(level)}${post.poster.name} -> ${user.name}`);
  }
  console.log(`${'\t'.repeat(level + 1)}${post.text.replace('\n','\n' + '\t'.repeat(level + 1))}`);
  if (post.likers && post.likers.get().length)
    console.log(`${'\t'.repeat(level)}-- ${_.pluck(post.likers.get(), 'name').join(', ')} like this`);
  if (post.comments) {
    post.comments.get().forEach(post => printPost(null, post, level + 1));
  }
}

SynoGraph.load(path.join(__dirname, 'data')).then(g => {
  const models = require('./models')(g);

  const users = g.query(models.Person.find(user=>user.wallPosts && user.wallPosts.get().length));
  for (let user of users) {
    console.log(`Wall of ${user.name}`);
    console.log(`
      From: ${user.from.name}
      Lives in: ${user.livesIn.name}
    `);
    _.sortBy(user.wallPosts.get(), 'timestamp').forEach(post => {
      printPost(user, post, 1);
      console.log();
    })
  }

  g.close();
});
