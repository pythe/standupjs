var UI = require('ui');
var ajax = require('ajax');
var Settings = require('settings');

var myStories = {};

Settings.config({
  url: 'https://home.comcast.net/~j_turley/standup.html'  
});

var Standup = {
  main: function() {
    var main = new UI.card({
      title: "Standup",
      subtitle: "For Pivotal Tracker",
      body: "Loading..."
    });
    
    main.show();
    
    this.attributes.noun = Settings.option('noun');
    this.attributes.nounId = Settings.option('nounId');
    this.attributes.apiKey = Settings.option('apiKey');
    this.attributes.initals = Settings.option('initials');
    
  },
  attributes: {
    noun: '',
    nounId: -1,
    apiKey: '',
    initials: ''
  },
  iconForStorytype: function(type) {
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
    var items = stories.map(function(s){
    return {
      title: s.name,
      subtitle: s.current_state,
      icon: this.iconForStoryType(s.story_type)
    };
  });
  
  return {
    items: items
  };
  },
  fetch: function() {
    ajax(
      {
        url: 'https://www.pivotaltracker.com/services/v5/' + this.attributes.noun + '/' + this.attributes.nounId + '/search?query=mywork:' + this.attributes.initials,
        type: 'json'
      },
      function(data){
        myStories = JSON.parse(data).stories.stories;
        
        var menuItems = this.buildMenu(myStories);
        var menu = new UI.menu(menuItems);
        // hook up click listeners later
        menu.show();
      }
    );
  }
};

Standup.main();
