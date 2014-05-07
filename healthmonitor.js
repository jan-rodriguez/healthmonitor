
if (Meteor.isClient) {

  Patients = new Meteor.Collection("patients");
  Medications = new Meteor.Collection("medications");
  Doctors = new Meteor.Collection("doctors");
  Alerts = new Meteor.Collection("alerts");

  Router.map(function () {
    this.route('root', {
      path: '/',
      template: 'root'
    });

    this.route('signup', {
      path: '/signup',
      template: 'signup'
    });

    this.route('home', {
      path: '/home',
      template: 'home'
    });

    //Search page
    this.route ("search", {
      path: '/search',
      template : "search_page"
    });

    //Patient pages
    this.route("patients", {
      path : "/patient/:_id",
      template : "patient_page",
      waitOn : function () {  // wait for the subscription to be ready; see below
        return Meteor.subscribe('all_patients');
      },
      data : function () {
        var returnVal = Patients.findOne(this.params._id);
        console.log(returnVal);
        return Patients.findOne(this.params._id);
      }
    });
  });

  //Runs whenever the DOM is ready
  Meteor.startup(function () {
  //   Router.onBeforeAction(function(pause) {
  //     console.log("user is " + Meteor.user());
  //     if (!Meteor.user()) {
  //       pause();
  //       Router.go('root');
  //     }
  //   }, {except: ['root', 'signup']});
    Router.onBeforeAction(function(pause) {
      if (Meteor.user()) {
        pause();
        Router.go('root');
      }
    }, {only: 'signup'});

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
    'click .close' : function (e) {
      //Make alerts do not show whenever they are dismissed and refreshed
      Alerts.update (this._id, {show : 0});
      e.preventDefault();
    }
  });

  currentUser = Meteor.user();


  //Compare current path
  UI.registerHelper("currentPage", function(localPath) {
    return Router.current(true).path === localPath;
  });

  //Process Log in request. 
  Template.login.events({
    'submit #login-form' : function(e, t) {
      e.preventDefault();

      var email = t.find('#login-email').value;
      var password = t.find('#login-password').value;
      $('#login-error').html('');

      Meteor.loginWithPassword(email, password, function(err) {
        if (err) {
          $('#login-error').html('<div class="alert alert-warning error">Your username or password was incorrect</div>');
          $('#login-password').val('');
        } else {
          console.log("going home");
          Router.go('home');
        }
      });
      return false; 
    }
  });

  //Process Sign up request. 
  Template.signup.events({
    'submit #signup-form' : function(e, t) {
      e.preventDefault();

      var email = t.find('#signup-email').value;
      var password = t.find('#signup-password').value;
      var confirm_password = t.find('#signup-confirm-password').value;
      $('#signup-error').html('');

      if (password != confirm_password) {
        $('#signup-error').html('<div class="alert alert-warning error">Your password did not match</div>');
        $('#signup-password').val('');
        $('#signup-confirm-password').val('');
        return false;
      } 

      Accounts.createUser({email: email, password : password}, function(err){
        if (err) {
          var email_val = $('#signup-email').val();
          $('#signup-error').html('<div class="alert alert-warning error">' + email_val + ' is already in use</div>');
          $('#signup-email').val('');
          $('#signup-password').val('');
          $('#signup-confirm-password').val('');
        } else {
          Router.go('home');
        }
      });
      return false;
    }
  });

  //Process Logout request. 
  Template.navbar.events({
    'click #logout' : function(e, t) {
      e.preventDefault();

      Meteor.logout( function() {
        Router.go('root');
      });
    }
  });

  Template.medications.current_medications = function (pat_id) {
    return Medications.find({patient_id: pat_id, end_date: null});
  };

  Template.medications.current_patient = function () {
    return Router.current(true).path;
  };

  //not working
  Template.medication.doctor_name = function () {
    console.log(Doctors.find({join_id: this.doctor_id}));
  };

  Template.medication.events({
    'click .discontinue' : function(e, t) {
      Medications.update(this._id, {end_date : new Date()});
    },
    'click .edit' : function(e, t) {
  //implement edit
  }
  });

  Template.medication.rendered = function () {
    $('.popover-markup>.trigger').popover({
      html: true,
      title: function () {
        return $(this).parent().find('.head').html();
      },
      content: function () {
        return $(this).parent().find('.content').html();
      }
    }).on('click', function(e) {
      $('.popover').on('click', function(e) {
        e.stopPropagation(); 
      });

      $('.popover').on('click', '#addmed', function(e) {
        // $('#benadryl').removeClass('hide');
        $('#prescribe').popover('hide');
          e.stopPropagation(); 
        });

        e.stopPropagation();
      });

    $(document).on('click', function() {
      $('#prescribe').popover('hide');
    });
  };

}

if (Meteor.isServer) {
  Meteor.startup(function () {
    Patients = new Meteor.Collection("patients");
    Medications = new Meteor.Collection("medications");
    Doctors = new Meteor.Collection("doctors");
    Alerts = new Meteor.Collection("alerts");

  // code to run on server at startup
  Meteor.publish("all_patients", function(){
    return Patients.find();
  });

  Meteor.publish("all_doctors", function() {
    return Doctors.find();
  });

  // Meteor.publish("all_medications", function() {
  //   return Medications.find();
  // });
  //Patients.remove({});
  if (Patients.find().count() === 0) {
    Patients.insert({
      join_id: 1,
      first_name : "John",
      last_name : "Doe"
    });
    Patients.insert({
      join_id: 2,
      first_name : "John",
      last_name : "Adams"
    });
    Patients.insert({
      join_id: 3,
      first_name : "Ben",
      last_name : "Bitdiddle"
    });
    Patients.insert({
      join_id: 4,
      first_name : "Gabriel",
      last_name : "Frattallone"
    });
    Patients.insert({
      join_id: 5,
      first_name : "Jan",
      last_name : "Rodriguez"
    });
    Patients.insert({
      join_id: 6,
      first_name : "Harry",
      last_name : "Sanabria"
    });
    Patients.insert({
      join_id: 7,
      first_name : "Joe",
      last_name : "Johnson"
    });
    Patients.insert({
      join_id: 8,
      first_name : "Bob",
      last_name : "Bobbert"
    });
  }

  //Alerts.remove({});
  if (Alerts.find().count() === 0){
    Alerts.insert({
      message : "A wild Gabo appeared",
      show : 1,
      patient_id : 5
    });
    Alerts.insert({
      message : "Don't look at the sun",
      show : 1,
      patient_id : 1
    });
  }

  //Medications.remove({});
  if (Medications.find().count() === 0) {
    Medications.insert({
      patient_id : 1,
      doctor_id : 2,
      name : "Tylenol",
      dose : 50,
      dose_unit : "mg",
      frequency : 24,
      frequency_unit : "hours",
      comment : "",
      reason : "headache",
      start_date : new Date(2014, 1, 25, 0, 0, 0, 0),
      end_date : null
    });
    Medications.insert({
      patient_id : 1,
      doctor_id : 1,
      name : "Advil",
      dose : 150,
      dose_unit : "mg",
      frequency : 2,
      frequency_unit : "days",
      comment : "",
      reason : "high blood pressure",
      start_date : new Date(2014, 3, 20, 0, 0, 0, 0),
      end_date : null
    });
    Medications.insert({
      patient_id : 1,
      doctor_id : 1,
      name : "Pepto Bismol",
      dose : 150,
      dose_unit : "ml",
      frequency : 8,
      frequency_unit : "hours",
      comment : "",
      reason : "indigestion",
      start_date : new Date(2013, 1, 15, 0, 0, 0, 0),
      end_date : new Date(2013, 5, 5, 0, 0, 0, 0)
    });
    Medications.insert({
      patient_id : 2,
      doctor_id : 2,
      name : "Advil",
      dose : 150,
      dose_unit : "mg",
      frequency : 2,
      frequency_unit : "days",
      comment : "",
      reason : "high blood pressure",
      start_date : new Date(2014, 3, 20, 0, 0, 0, 0),
      end_date : null
    });
    Medications.insert({
      patient_id : 3,
      doctor_id : 2,
      name : "Pepto Bismol",
      dose : 150,
      dose_unit : "ml",
      frequency : 8,
      frequency_unit : "hours",
      comment : "",
      reason : "indigestion",
      start_date : new Date(2013, 1, 15, 0, 0, 0, 0),
      end_date : new Date(2013, 5, 5, 0, 0, 0, 0)
    });
  }

  if (Doctors.find().count() === 0) {
    Doctors.insert({
      join_id: 1,
      first_name : "Yes",
      last_name : "No"
    });
    Doctors.insert({
      join_id: 2,
      first_name : "Jorge",
      last_name : "Rosario"
    });
  }

  });
}
