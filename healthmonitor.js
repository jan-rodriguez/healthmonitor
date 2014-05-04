if (Meteor.isClient) {

  //Set up routes for different pages
  Router.map( function () {

    //Search page
    this.route ("search", {
      template : "search_page"
    });

    //Patient pages
    this.route("patients", {
      path : "/patient/:_id",
      template : "patient_page"
    });
  });

  Patients = new Meteor.Collection("patients");
  Alerts = new Meteor.Collection("alerts");

  //Runs whenever the DOM is ready
  Meteor.startup(function () {

    function propComparator(prop) {
      return function(a, b) {
        if(a[prop] > b[prop]) {
          return 1;
        } else {
          return -1;
        }
      }
    }

    //Set up autocomplete functionality of search when all users are found
    Meteor.subscribe ("all_patients", function () {

      var pat_list = [];

      Patients.find().forEach( function(e) {
        pat_list.push({
          val : e._id,
          label : e.first_name + " " + e.last_name
        });
      });

      //Sort names
      pat_list.sort(propComparator("label"));

      $('#search').autocomplete({
        source : pat_list,
        select : function (event, ui) {
          Router.go("/patient/" + ui.item.val);
          event.preventDefault();
        }
      });

      $('#search').keypress(function (e) {
        //If user presses enter
        if (e.keyCode === 13) {
          
          var name = $(this).val();

          //Run trough list if we find a match, go to the page
          if (name.length > 0){
            pat_list.forEach( function (elt) {
              if ( name.toLowerCase() === elt.label.toLowerCase() ){
                Router.go("/patient/" + elt.val);
                return false;
              }
            });
          }
        }
      });

      $('#go').click( function (evt) {

        var name = $('#search').val();

        //Run trough list if we find a match, go to the page
        if (name.length > 0){
          pat_list.forEach( function (elt) {
            if ( name.toLowerCase() === elt.label.toLowerCase() ){
              Router.go("/patient/" + elt.val);
              return false;
            }
          });
        }

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
