'use strict';

const path = require('path');
const _ = require('lodash');
const SynoGraph = require('synograph').SynoGraph;
const app = require('express')();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

SynoGraph.load(path.join(__dirname, 'data'), '*.ctr').then(g => {
  const models = require('./models')(g);
  g.on('change', () => console.log('[GRAPH:CHANGE]'));
  g.on('persist-end', () => console.log('[GRAPH:PERSISTED]'));

  app.get('/', (req, res) => {
    let current = req.cookies.user;
    let currentUser = current ? models.Person(current) : null;
    Promise.all([
      g.query(models.Person.find()),
      g.query(models.Page.find())
    ]).then(results => {
      res.render('index', {users: results[0], pages: results[1], current, currentUser})
    });
  });

  app.get('/users/:id', (req, res) => {
    let user = models.Person(req.params.id);
    let current = req.cookies.user;
    let currentUser = current ? models.Person(current) : null;
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
    let page = models.Page(req.params.id);
    let current = req.cookies.user;
    let currentUser = current ? models.Person(current) : null;
    res.render('page', {
      page,
      currentUser,
      sorter(p1, p2) {return p2.timestamp - p1.timestamp}
    });
  });

  app.post('/users/:id/post', (req, res) => {
    let user = models.Person(req.params.id);
    let currentUser = models.Person(req.body.id);
    currentUser.post(models.Post, req.body.text, user);
    res.end();
  });

  app.post('/users/:id/add', (req, res) => {
    let user = models.Person(req.params.id);
    let currentUser = models.Person(req.body.id);
    currentUser.friends.add(user);
    res.end();
  });

  app.post('/posts/:id/toggleLike', (req, res) => {
    let post = models.Post(req.params.id);
    let currentUser = models.Person(req.body.id);
    if (!post.likers.has(currentUser)) post.likers.add(currentUser);
    else post.likers.remove(currentUser);
    res.end();
  });

  app.post('/posts/:id/comment', (req, res) => {
    let post = models.Post(req.params.id);
    let currentUser = models.Person(req.body.id);
    post.comment(models.Post, currentUser, req.body.text);
    res.end();
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
    g.query(models.Person.find({key: 'name', op: '===', value: req.body.name}))
    .then(users => {
      if (!users.length) res.status(404).end();
      let user = users[0];
      res.cookie('user', user._id);
      res.redirect('/users/' + user._id);
    });
  });

  app.post('/pages', (req, res) => {
    let err = g.atom(() => {
      let page = models.Page({name: req.body.name});
      let user = models.Person(req.cookies.user);
      page.owner = user;
      res.redirect('/pages/' + page._id);
    });
    if (err) throw err;
  });

  app.listen(3000, () => console.log('Ready'));
});
