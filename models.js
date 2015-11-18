'use strict';

const Model = require('synograph').SynoModel;

const mixins = {
  Likers(properties) {
    properties.connections.push({name: 'likers', type: 'Person', collection: true, reverse: 'likes'});
  },
  HasWall(properties) {
    properties.connections.push({name: 'wallPosts', type: 'Post', reverse: 'wallOwner', collection: true});
  }
};

module.exports = function (g) {
  const Person = Model(g, 'Person', {
    mixins: [mixins.HasWall],
    properties: 'name age'.split(' '),
    connections: [
      {name: 'friends', type: 'Person', collection: true, mutual: true},
      {name: 'visited', type: 'Place', collection: true, reverse: 'visitors'},
      {name: 'posted', type: 'Post', reverse: 'poster', collection: true},
      {name: 'likes', type: null, reverse: 'likers', collection: true},
      {name: 'ownedPages', type: 'Page', reverse: 'owner', collection: true},
      {name: 'from', type: 'Place', reverse: 'natives'},
      {name: 'livesIn', type: 'Place', reverse: 'dwellers'}
    ],
    dynamicProperties: {
      post() {
        return (text, wall) => {
          let post = Post({text, timestamp: Date.now(), isComment: false});
          post.poster = this;
          post.wallOwner = wall || this;
          return post;
        }
      }
    }
  });

  const Place = Model(g, 'Place', {
    mixins: [mixins.Likers, mixins.HasWall],
    properties: 'name'.split(' '),
    connections: [
      {name: 'visitors', type: 'Person', collection: true, reverse: 'visited'},
      {name: 'natives', type: 'Person', collection: true, reverse: 'from'},
      {name: 'dwellers', type: 'Person', collection: true, reverse: 'livesIn'}
    ]
  });

  const Post = Model(g, 'Post', {
    mixins: [mixins.Likers],
    properties: 'text timestamp isComment'.split(' '),
    connections: [
      {name: 'poster', type: 'Person', reverse: 'posted'},
      {name: 'wallOwner', type: null, reverse: 'wallPosts'},
      {name: 'comments', type: 'Post', collection: true}
    ],
    dynamicProperties: {
      comment() {
        return (posterModel, text) => {
          let post = Post({text, timestamp: Date.now(), isComment: true});
          post.poster = posterModel;
          this.comments.add(post);
          return post;
        }
      }
    }
  });

  const Page = Model(g, 'Page', {
    mixins: [mixins.Likers, mixins.HasWall],
    properties: 'name'.split(' '),
    connections: [
      {name: 'owner', type: 'Person', reverse: 'ownedPages'}
    ]
  });

  return {Person, Place, Post, Page};
};
