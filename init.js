var request = require('request');
var cheerio = require('cheerio');

var speakers;
var talks;

function scrapeSpeakers(){
  const url = 'http://nordicapis.com/events/2016-platform-summit/';
  console.time('scrapeSpeakers');
  request.get(url, function(error, response, html){
    if (error){
      console.log(error);
      return;
    }
    var $ = cheerio.load(html);
    speakers = $('.speakerlink').parent().map(function(i, el){
      return {
        'name':    $(el).find('h4').text().trim(),
        'role':    $(el).find('h5').text().trim(),
        'company': $(el).find('h5 + p').text().trim(),
        'handle':  $(el).find('p > a').text().trim(),
        'url':    $(el).find('.speakerlink').attr('href').replace("http://nordicapis.com", ""),
      };
    });
    talks = $('.schedliveinfo').parent().map((i,el)=>{
      return {
        'title': $(el).find('.schedliveinfo h3').text(),
        'location': $(el).find('.schedliveinfo .loc').text(),
        'time':$(el).find('.schedlivetime').text(),
        'speakerURLs': $(el).find('.schedlivespeaker a').attr('href'),
      };
    });
    console.log('Loaded ' + speakers.length + ' speakers');
    console.log('Loaded ' + talks.length + ' talks');
    console.timeEnd('scrapeSpeakers');
  });
}
scrapeSpeakers();

var { graphql, buildSchema } = require('graphql');

var typeDefs = `
  type Query{
    me: Speaker
    allSpeakers: [Speaker]
    speakersByName(name: String): [ Speaker ]
    talks: [Talk]
  }

  type Speaker {
    name: String
    role: String
    company: String
    handle: String
    url: String
  }

  type Talk {
    title: String
    location: String
    time: String
    speakers: [Speaker]
  }
`;

var {filter, includes}= require('lodash');

const resolvers = {
  Query:{
    me: ()=>{
      return speakers[3];
    },
    allSpeakers: ()=> {return speakers},
    speakersByName: (args)=>{

    },
    talks: () => {
      return talks;
    },
  },
  Talk:{
    speakers: (talk)=>{
      return speakers.filter((i,speaker)=>{
        return includes(talk.speakerURLs, speaker.url )
      })
    }
  }
}

var { makeExecutableSchema } = require('graphql-tools');
var schema = makeExecutableSchema({
  typeDefs: typeDefs,
  resolvers,
});
  
const express = require('express');
const graphqlHTTP = require('express-graphql');

const app = express();

app.use('/graphql', graphqlHTTP({
  schema: schema ,
  graphiql: true,
}));

app.listen(4000);
console.log('Starting server on port 4000');
