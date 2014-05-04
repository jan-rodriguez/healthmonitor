if (Meteor.isClient) {
  Patients = new Meteor.Collection("patients");
  Alerts = new Meteor.Collection("alerts");

  //Runs whenever the DOM is ready... NOT
  Meteor.startup(function () {

    //Set up autocomplete functionality of search when all users are found
    Meteor.subscribe ("all_patients", function () {

      var pat_list = [];

      Patients.find().forEach( function(e) {
        pat_list.push(e.first_name + " " + e.last_name);
      });

      $('#search').autocomplete({
        source: pat_list.sort()
      });

    });

  });

  Template.alerts.alert_list = function () {
    return Alerts.find({show : 1});
  };

  Template.alerts.events({
    'click .close' : function () {
      //Make alerts do not show whenever they are dismissed and refreshed
      Alerts.update (this._id, {show : 0});
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
    Patients = new Meteor.Collection("patients");
    Alerts = new Meteor.Collection("alerts");

    Meteor.publish("all_patients", function(){
      return Patients.find();
    });

    //Insert patient data if nothing has been previously added
    if (Patients.find().count() === 0) {
      Patients.insert({
        first_name : "John",
        last_name : "Doe"
      });
      Patients.insert({
        first_name : "John",
        last_name : "Adams"
      });
      Patients.insert({
        first_name : "Ben",
        last_name : "Bitdiddle"
      });
      Patients.insert({
        first_name : "Gabriel",
        last_name : "Frattallone"
      });
      Patients.insert({
        first_name : "Jan",
        last_name : "Rodriguez"
      });
      Patients.insert({
        first_name : "Harry",
        last_name : "Sanabria"
      });
      Patients.insert({
        first_name : "Joe",
        last_name : "Johnson"
      });
      Patients.insert({
        first_name : "Bob",
        last_name : "Bobbert"
      });
    }
    //Alerts.remove({});
    if (Alerts.find().count() === 0){
      Alerts.insert({
        message : "A wild Gabo appeared",
        show : 1
      });
      Alerts.insert({
        message : "Don't look at the sun",
        show : 1
      });
    }

  });
}
