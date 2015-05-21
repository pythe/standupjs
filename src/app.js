var UI = require('ui'),
    ajax = require('ajax'),
    Settings = require('settings'),
    Promise = require('./es6-promise').Promise,
    Vector2 = require('vector2');

var url;

if (Settings.option('api_token')) {
  url = 'https://standup-config.cfapps.io/login?api_token=' + Settings.option('api_token');
} else {
  url = 'https://standup-config.cfapps.io/login';
}

function request(options) {
  return new Promise(function(resolve, reject) {
    ajax(options, resolve, reject);
  });
}

function flatten(arrayOfArrays) {
  return arrayOfArrays.reduce(function(acc, val) {
    return acc.concat(val);
  }, []);
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

function capitalize(str) {
  return str[0].toUpperCase() + str.substr(1);
}

var Standup = {
  main: function() {
    this.attributes.projectIds = Settings.option('project_ids');
    this.attributes.apiKey = Settings.option('api_token');
    this.attributes.initials = Settings.option('initials');
    var configMessage = this.attributes.projectIds ? '' : 'Please open settings';
    this.loadingCard = new UI.Card({
      title: "Standup",
      banner: "images/hand-placed.png",
      body: configMessage
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
    
    var sectionOrder = ["Started", "Finished", "Delivered", "Accepted"],
        sections = [];
    
    sectionOrder.forEach(function(sectionName){
      if (grouped[sectionName]) {
        var stories = grouped[sectionName];
        sections.push({title: sectionName, items: stories}); 
      }
    });
    
    
    
    return {
      sections: sections 
    };
  },
  fetch: function() {
    var self = this, initials = this.attributes.initials;
    var promises = this.attributes.projectIds.map(function(projectId) {
      var url = 'https://www.pivotaltracker.com/services/v5/projects/' + projectId + '/search?query=mywork:' + initials;
      console.log("url ", url);
      return request({
        url: url,
        type: 'json',
        headers: {
          "X-TrackerToken": self.attributes.apiKey
        }
      });
    });
    Promise.all(promises).then(function(resolutions) {
      var myStories = flatten(resolutions.map(function(data) {
        return data.stories.stories;
      }));
      self.loadingCard.hide();
      if (myStories.length === 0) {
        self.activeCard = new UI.Card({
          title: 'No Stories',
          subtitle: 'Get to work!'
        });
        self.activeCard.show();
        
        return;
      }

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
    }).catch(function(error) {
      console.log("error! ", error);
      console.log(JSON.stringify(error));
    });
    Promise.all(promises).catch(function() {
      console.log("Fetch failed for some reason");
    });
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
      Settings.option('project_ids', undefined);
      Settings.option('api_token', undefined);
      Settings.option('initials', undefined);
    }
    Standup.reset();
    Standup.main();
  });

Standup.main();
