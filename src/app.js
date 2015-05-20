var UI = require('ui');
var ajax = require('ajax');
var Settings = require('settings');

var myStories = {};

Settings.config({
  url: 'https://standup-config.cfapps.io/login'
});

function groupBy(array, func) {
  var grouped = {},
    i;
  for (i=0; i < array.length; i++) {
    var element = array[i];
    var value = func(element);
    if (!(value in grouped))
      grouped[value] = [];
  
    grouped[value].push(element);
  }
  
  return grouped;
}

function objectMap(obj, func) {
  return Object.keys(obj).map(function(key) {
    return func(key, obj[key]);
  });
}

var Standup = {
  main: function() {
    this.attributes.projectId = Settings.option('project_id');
    this.attributes.apiKey = Settings.option('api_token');
    this.attributes.initials = Settings.option('initials');
    
    var main = new UI.Card({
      title: "Standup",
      subtitle: "for Pivotal Tracker",
      body: "proj: " + this.attributes.projectId + "\napi: " + this.attributes.apiKey + "\nin: " + this.attributes.initials,
      scrollable: true //delete me
    });
    
    main.show();
    
    this.fetch();
  },
  attributes: {
  },
  iconForStoryType: function(type) {
    switch(type) {
      case "feature":
        return "images/feature.png";
      case "bug":
        return "images/bug.png";
      case "chore":
        return "images/chore.png";
      case "release":
        return "images/release.png";
      default:
        return "images/questionMark.png";
    }
  },
  buildMenu: function(stories) {
    console.log(6);
    stories.forEach(function(s) {
      s.title = s.name;
      s.subtitle = s.story_type;
    });
    
    var grouped = groupBy(stories, function(story) {
      return story.current_state;
    });

    var sections = objectMap(grouped, function(key, stories) {
      return {
        title: key,
        items: stories
      };
    });

    console.log("sections!");
    console.log(JSON.stringify(sections));
    return {
      sections: sections 
    };
  },
  fetch: function() {
    var self = this,
        url = 'https://www.pivotaltracker.com/services/v5/projects/' + this.attributes.projectId + '/search?query=mywork:' + this.attributes.initials;
    console.log("requesting", url);
    ajax(
      {
        url: url,
        type: 'json',
        headers: {
          "X-TrackerToken": self.attributes.apiKey
        }
      },
      function(data, status, request) {
        console.log(JSON.stringify(data));
        console.log(1);
        myStories = data.stories.stories;
        console.log(2);
        
        var menuItems = self.buildMenu.call(self, myStories);
        var menu = new UI.Menu(menuItems);
        menu.on('select', function(e) {
          var card = new UI.Card({
            body: e.item.name
          });
          card.show();
        });
        menu.show();
      },
      function(data, status, request) {
        console.log("Fetch failed for some reason ", status);
        console.log(JSON.stringify(data));
      }
    );
  }
};

Standup.main();
