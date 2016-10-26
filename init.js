var rp = require('request-promise');
var cheerio = require('cheerio');

var talks;

function scrapeTalks(){
  const url = 'http://nordicapis.com/events/2016-platform-summit/';
  rp(url).then( (html)=>{
    var $ = cheerio.load(html);
    talks = $('.schedliveinfo').parent().map((i,el)=>{
      return {
        'title':       $(el).find('.schedliveinfo h3').text(),
        'location':    $(el).find('.schedliveinfo .loc').text(),
        'time':        $(el).find('.schedlivetime').text().replace(/\n/g, "").trim(),
        'speakerURLs': $(el).find('.schedlivespeaker a').attr('href'),
      };
    });
    console.log('Loaded ' + talks.length + ' talks');
  })
  .catch((err) => {console.log(err)});
}

function scrapeSpeaker(url){
  const talkerURL = 'http://nordicapis.com/' + url;
  return rp(talkerURL).then((html) => {
    console.log("fetched speaker"+ url)
    var $ = cheerio.load(html);
    return {
      'name':        $('.basicinfo h1').text().trim(),
      'role':        $('.basicinfo h4').text().trim(),
      'company':     $('.basicinfo h5').text().trim(),
      'handle':      $('.fa-twitter-outline + a').text().trim(),
      'description': $('.speakerdesc').text().replace(/\n/g, "").trim(),
    };
  })
  .catch((err) => {console.log(err) });
}

scrapeTalks();

var { graphql, buildSchema } = require('graphql');

var typeDefs = `
  type Query{
    me: Speaker
    speaker(id: String): Speaker
    talks: [Talk]
  }

  type Speaker {
    name: String
    role: String
    company: String
    handle: String
    description: String
    url: String
  }

  type Talk {
    title: String
    location: String
    time: String
    speakers: [Speaker]
  }
`;

const resolvers = {
  Query:{
    me: ()=>(scrapeSpeaker('speakers/joakim-lundborg')),
    speaker: (id)=>(scrapeSpeaker(id)),
    talks: () => { return talks },
  },
  Talk:{
    speakers: (talk)=>{
      return [scrapeSpeaker(talk.speakerURLs)]
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
