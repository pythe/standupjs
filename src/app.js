var UI = require('ui');
var ajax = require('ajax');
var Settings = require('settings');

var myStories = {};
var url;

if (Settings.option('api_token')) {
  url = 'https://standup-config.cfapps.io/login?api_token=' + Settings.option('api_token');
} else {
  url = 'https://standup-config.cfapps.io/login';
}

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

function capitalize(str) {
  return str[0].toUpperCase() + str.substr(1);
}

var Standup = {
  main: function() {
    this.attributes.projectId = Settings.option('project_id');
    this.attributes.apiKey = Settings.option('api_token');
    this.attributes.initials = Settings.option('initials');
    
    this.loadingCard = new UI.Card({
      title: "Standup",
      subtitle: "for Pivotal Tracker",
      body: "proj: " + this.attributes.projectId + "\napi: " + this.attributes.apiKey + "\nin: " + this.attributes.initials,
      scrollable: true //delete me
    });
    
    this.loadingCard.show();
    
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
    stories.forEach(function(s) {
      s.title = s.name;
      s.subtitle = capitalize(s.story_type);
    });
    
    var grouped = groupBy(stories, function(story) {
      return capitalize(story.current_state);
    });

    var sections = objectMap(grouped, function(key, stories) {
      return {
        title: key,
        items: stories
      };
    });

    return {
      sections: sections 
    };
  },
  fetch: function() {
    var self = this,
        url = 'https://www.pivotaltracker.com/services/v5/projects/' + this.attributes.projectId + '/search?query=mywork:' + this.attributes.initials;
    ajax(
      {
        url: url,
        type: 'json',
        headers: {
          "X-TrackerToken": self.attributes.apiKey
        }
      },
      function(data, status, request) {
        myStories = data.stories.stories;
        
        var menuItems = self.buildMenu.call(self, myStories);
        var menu = new UI.Menu(menuItems);
        menu.on('select', function(e) {
          var card = new UI.Card({
            body: e.item.name
          });
          self.activeCard = card;
          card.show();
        });
        self.menu = menu;
        menu.show();
        self.loadingCard.hide();
      },
      function(data, status, request) {
        console.log("Fetch failed for some reason ", status);
        console.log(JSON.stringify(data));
      }
    );
  },
  
  reset: function() {
    if (this.menu) {
      this.menu.hide();
      this.menu = undefined;
    }
    if (this.activeCard) {
      this.activeCard.hide();
      this.activeCard = undefined;
    }
    if (this.loadingCard) {
      this.loadingCard.hide();
      this.loadingCard = undefined;
    }
  }
};

Settings.config(
  {url: url},
  function() {},
  function(e) {
    console.log("configuration changed:");
    console.log(JSON.stringify(e));
    if (e.options.clear) {
      Settings.option('project_id', undefined);
      Settings.option('api_token', undefined);
      Settings.option('initials', undefined);
    }
    Standup.reset();
    Standup.main();
  });

Standup.main();
