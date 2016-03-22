'use strict';

const path = require('path');
const SynoGraph = require('synograph').PersistentGraph;
SynoGraph.start(path.join(__dirname, 'data')).then(g => {
    const models = require('./models')(g);

    const countries = require('./countries.json').reduce((cs, c) => {
      cs[c.name.common.toLowerCase()] = models.Place({name: c.name.common});
      return cs;
    }, {});

    const people = require('./people.json').reduce((ps, p, i) => {
      ps[p.id] = models.Person({name: p.name, age: Math.random() * 30});
      switch (i % 3) {
        case 0:
        ps[p.id].from = countries.israel;
        ps[p.id].livesIn = countries.canada;
        break;
        case 1:
        ps[p.id].from = countries.france;
        ps[p.id].livesIn = countries.spain;
        break;
        case 2:
        ps[p.id].from = countries.australia;
        ps[p.id].livesIn = countries.canada;
        break;
      }
      return ps;
    }, {});

    let status = people.ajpiano.post(models.Post, 'Hell of a DAY!');
    status.likers.add(people.phiggins);
    status.comment(models.Post, people.phiggins, 'Awesome!').likers.add(people.ajpiano);
    status.likers.add(people.blowery);
    status.comment(models.Post, people.slightlylate, 'Fuck you, mate').comment(models.Post, people.phiggins, 'huh?');

    people.ajpiano.post(models.Post, 'What is up with you, man?', people.slightlylate).likers.add(people.jeresig);
    people.ajpiano.likes.add(countries.australia);

    people.slightlylate.likes.add(countries.france);

    people.ajpiano.friends.add(people.phiggins);
    people.ajpiano.friends.add(people.slightlylate);
    people.ajpiano.friends.add(people.jaubourg);
    people.ajpiano.friends.add(people.blowery);
    people.slightlylate.friends.add(people.jeresig);
    people.jaubourg.friends.add(people.phiggins);
}).catch(console.error);