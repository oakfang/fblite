'use strict';

const path = require('path');
const _ = require('lodash');
const SynoGraph = require('synograph').PersistentGraph;
const jsonQuery = require('sjql');
const app = require('express')();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

SynoGraph.start(require('./models'), path.join(__dirname, 'data')).then(g => {
  g.on('change', () => console.log('[GRAPH:CHANGE]'));
  g.on('persist-end', () => console.log('[GRAPH:PERSISTED]'));

  app.get('/', (req, res) => {
    let current = req.cookies.user;
    let currentUser = current ? g.Person(current) : null;
    const pages = g.query(g.Page.find());
    const users = g.query(g.Person.find());
    res.render('index', {users, pages, current, currentUser});
  });

  app.get('/users/:id', (req, res) => {
    let user = g.Person(req.params.id);
    let current = req.cookies.user;
    let currentUser = current ? g.Person(current) : null;
    res.render('user', {
      user,
      currentUser,
      sorter(p1, p2) {return p2.timestamp - p1.timestamp},
      suggestedFriends: current == req.cookies.user ?
      g.select('friends').of('friends').of(user).get()
      .filter(f => !f.friends.has(user) && f._id != user._id)
      : []
    });
  });

  app.get('/pages/:id', (req, res) => {
    let page = g.Page(req.params.id);
    let current = req.cookies.user;
    let currentUser = current ? g.Person(current) : null;
    res.render('page', {
      page,
      currentUser,
      sorter(p1, p2) {return p2.timestamp - p1.timestamp}
    });
  });

  app.get('/places/:id', (req, res) => {
    let page = g.Place(req.params.id);
    let current = req.cookies.user;
    let currentUser = current ? g.Person(current) : null;
    res.render('place', {
      page,
      currentUser,
      sorter(p1, p2) {return p2.timestamp - p1.timestamp}
    });
  });

  app.post('/users/:id/post', (req, res) => {
    let user = g.Person(req.params.id);
    let currentUser = g.Person(req.body.id);
    currentUser.post(g.Post, req.body.text, user);
    res.end();
  });

  app.post('/users/:id/add', (req, res) => {
    let user = g.Person(req.params.id);
    let currentUser = g.Person(req.body.id);
    currentUser.friends.add(user);
    res.end();
  });

  app.post('/posts/:id/toggleLike', (req, res) => {
    let post = g.Post(req.params.id);
    let currentUser = g.Person(req.body.id);
    if (!post.likers.has(currentUser)) post.likers.add(currentUser);
    else post.likers.remove(currentUser);
    res.end();
  });

  app.post('/posts/:id/comment', (req, res) => {
    let post = g.Post(req.params.id);
    let currentUser = g.Person(req.body.id);
    post.comment(g.Post, currentUser, req.body.text);
    res.end();
  });

  app.post('/query', (req, res) => {
    res.json({results: jsonQuery(g, req.body).map(e => e.toJS ? e.toJS() : e)});
  });

  app.get('/me', (req, res) => {
    res.render('login', {action: '/login'});
  });
  app.get('/page', (req, res) => {
    res.render('login', {action: '/pages'});
  });

  app.get('/logout', (req, res) => {
    res.clearCookie('user');
    res.redirect('/me');
  });

  app.post('/login', (req, res) => {
      const users = g.query(g.Person.find(p => p.name === req.body.name, 1));
      if (!users.length) return res.status(404).end();
      let user = users[0];
      res.cookie('user', user._id);
      res.redirect('/users/' + user._id);
  });

  app.post('/pages', (req, res) => {
    let err = g.atom(() => {
      let page = g.Page({name: req.body.name});
      let user = g.Person(req.cookies.user);
      page.owner = user;
      res.redirect('/pages/' + page._id);
    });
    if (err) throw err;
  });

  app.listen(4000, () => console.log('Ready'));
}).catch(console.error);