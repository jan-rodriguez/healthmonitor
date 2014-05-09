
if (Meteor.isClient) {

  currentUser = Meteor.user();

  Patients = new Meteor.Collection("patients");
  Medications = new Meteor.Collection("medications");
  Alerts = new Meteor.Collection("alerts");
  Blood_P = new Meteor.Collection("blood_pressure");
  Weight = new Meteor.Collection("weight");
  Heart_R = new Meteor.Collection("heart_rate");

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
        if (name.length > 0) {
          pat_list.forEach( function (elt) {
            if ( name.toLowerCase() === elt.label.toLowerCase() ) {
              Router.go("/patient/" + elt.val);
              return false;
            }
          });
        }
      });
    });
  });

  //Show alerts that have not been previously dismissed
  Template.alerts.alert_list = function () {
    return Alerts.find({show : 1});
  };

  //Functionality for dismissing alerts
  Template.alerts.events({
    'click .close' : function (e) {
      //Make alerts do not show whenever they are dismissed and refreshed
      Alerts.update (this._id, {show : 0});
      e.preventDefault();
    }
  });

  //Compare given path to current path
  UI.registerHelper("currentPage", function(localPath) {
    return Router.current(true).path === localPath;
  });

  //Process Log in request
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
          Router.go('home');
        }
      });
      return false; 
    }
  });

  //Process Sign up request
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

  //Process Logout request
  Template.navbar.events({
    'click #logout' : function(e, t) {
      e.preventDefault();

      Meteor.logout( function() {
        Router.go('root');
      });
    }
  });

  //Everything to do with graphs
  var selected_metric = 'mmHg';

  //Get selected time scale
  function getTimeSelection() {
    return $("#timeselect").val();
  }
  
  //Get health information for given patient and dates
  var getPatientData = function (patient, metric, minDate) {
    if (metric === 'mmHg') {
      //get blood pressure data
      var systolic_data = [];
      var diastolic_data = [];

      Blood_P.find({patient_id: patient.join_id}, {sort: {date: 1}}).forEach( function (e) {
        if (e.date > minDate) {
          systolic_data.push([e.date, e.systolic]);
          diastolic_data.push([e.date, e.diastolic]);
        }
      });

      return [{name: 'Systolic', data: systolic_data, color: 'blue'}, {name: 'Diastolic', data: diastolic_data, color: 'red'}];
    }
    else if (metric === 'bpm') {
      //get heart rate data
      var heart_rate_data = [];

      Heart_R.find({patient_id: patient.join_id}, {sort: {date: 1}}).forEach( function (e) {
        if (e.date > minDate) {
          heart_rate_data.push([e.date, e.heart_rate]);
        }
      });

      return [{name: 'bpm', data: heart_rate_data}];
    }
    else if (metric === 'lbs') {
      //get weight data
      var weight_data = [];

      Weight.find({patient_id: patient.join_id}, {sort: {date: 1}}).forEach( function (e) {
        if (e.date > minDate) {
          weight_data.push([e.date, e.weight]);
        }
      });

      return [{name: 'lbs', data: weight_data}];
    }
  }

  //Get medicine information for given patient and dates
  var getMedicineData = function (patient, min_date) {
    var data = [];

    Medications.find({patient_id: patient.join_id}, {sort: {start_date: 1}}).forEach( function (e) {
      data.push({low: e.start_date, y: e.end_date || Date.UTC(2014, 4, 1), color: 'blue', name: e.name});
    });

    return data.filter( function(element) {
      return element.y >= min_date;
    });
  };

  //Generate graphs for given patient
  var generate_graphs = function (patient) {
    var xaxis = getTimeSelection();
    var yaxis = selected_metric;
    var series;
    var new_date = new Date(2014, 4);

    switch(xaxis) {
      case '1 year':
      new_date.setFullYear(new_date.getFullYear()-1);
      break;
      case '6 months':
      new_date.setFullYear(new_date.getFullYear(), new_date.getMonth()-6);
      break;
      case '1 month':
      new_date.setFullYear(new_date.getFullYear(), new_date.getMonth()-1);
      break;
      case '1 week':
      new_date = new Date(new_date.getTime() - (1000*60*60*24*7));
      break;
    }

    var minDate = Date.UTC(new_date.getUTCFullYear(),
     new_date.getUTCMonth(), 
     new_date.getUTCDate(),
     new_date.getUTCHours(),
     new_date.getUTCMinutes(),
     new_date.getUTCSeconds());

    var series = getPatientData(patient, yaxis, minDate);
    var day_offset = 1000*60*60*24;

    if (xaxis === '1 week') {
      day_offset = 1000*60*60*5;
    }

    $(function () {
      $('#graph-container').highcharts({
        title: {
          text: '',
          x: -20 //center
        },
        xAxis: {
          type: 'datetime',
          min: minDate-day_offset
        },
        yAxis: {
          allowDecimals: false,
          title: {
            text: yaxis
          },
          plotLines: [{
            value: 0,
            width: 1,
            color: '#808080'
          }]
        },
        tooltip: {
          enabled: false
        },
        plotOptions: {
            series: {
                marker: {
                    radius: 1
                }
            }
        },
        legend: {
          layout: 'vertical',
          align: 'right',
          verticalAlign: 'middle',
          borderWidth: 0
        },
        series: series
      });
    });

    var today = Date.UTC(2014, 4);
    var medicine_data = getMedicineData(patient, minDate);
    var medicines = medicine_data.map(function(element) {return element.name;});
    var medicines_width = 592;
    if (yaxis === 'bpm') {
      medicines_width = 618;
    }
    else if (yaxis === 'lbs') {
      medicines_width = 627;
    }
    $('#graphs-wrapper').height(450+25*medicine_data.length);
    $('#space-container1').html(new Array(5+medicine_data.length).join("<br>"));

    var chart = new Highcharts.Chart({

      chart: {
        renderTo: 'medicines-container',
        type: 'bar',
        height: 40+25*medicine_data.length,
        width: medicines_width
      },

      plotOptions: {
        bar: {
          pointWidth: 20,
          dataLabels: {
            enabled: true,
            inside: true,
            borderRadius: 1,
            borderColor: 'black',
            formatter: function () {
              return this.x
            },
            style: {
              color: 'black',
              fontWeight: 'bold',
              fontSize: 'larger',
              textShadow: '-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white'
            }
          }
        }
      },

      title: {
        text: null  
      },

      legend: {
        enabled: false
      },

      xAxis: {
        categories: medicines,
        labels: {
          enabled: false
        },
        tickLength: 0,
        lineWidth: 0,
        offset: 64
      },

      yAxis: {
        type: 'datetime',
        min: minDate,
        max: today,
        endOnTick: false,
        labels: {
          staggerLines: 1,
          overflow: 'justify'
        },
        title: {
          enabled: false
        }
      },

      tooltip: {
        formatter: function() {
          var point = this.point;
          return '<b>'+ point.category +'</b><br/>'+
          Highcharts.dateFormat('%b %e, %Y', point.low) + ' - ' +
          Highcharts.dateFormat('%b %e, %Y', point.y);
        } 
      },

      series: [{
        data: medicine_data
      }]

    });
  };


  //Bind events and render graphs when patient page is ready
  Template.patient_page.rendered = function () {
    Meteor.subscribe("all_patients", function () {
      var patient = Patients.findOne({_id: Router.current(true).path.split('/')[2]});
      generate_graphs(patient);

      $('#timeselect').change(function (e) {
        generate_graphs(patient);
        e.preventDefault();
      });

      $('#bp').click(function (e) {
        $(this).addClass('selected');
        $('#hr').removeClass('selected');
        $('#w').removeClass('selected');

        selected_metric = "mmHg";

        //change graph
        generate_graphs(patient);
      });

      $('#bp').mousedown(function(e) {
        e.preventDefault();
      });

      $('#hr').click(function (e) {
        $(this).addClass('selected');
        $('#bp').removeClass('selected');
        $('#w').removeClass('selected');

        selected_metric = "bpm";

        //change graph
        generate_graphs(patient);            
      });

      $('#hr').mousedown(function(e) {
        e.preventDefault();
      });

      $('#w').click(function (e) {
        $(this).addClass('selected');
        $('#hr').removeClass('selected');
        $('#bp').removeClass('selected');

        selected_metric = "lbs";

        //change graph
        generate_graphs(patient);
      });

      $('#w').mousedown(function(e) {
        e.preventDefault();
      });
    });
  };

  //Medication table - get current medications for this patient
  Template.medications.current_medications = function () {
    if (Router.getData()) {
      return Medications.find({patient_id: Router.getData().join_id, end_date: null});
    }
  };

  //Get prescribing doctor's name for this medication
  Template.medication.doctor_name = function () {
    // console.log(Doctors.find({join_id: this.doctor_id}));
  };

  //Medication events - discontinue and edit
  Template.medication.events({
    'click .discontinue' : function(e, t) {
      Medications.update(this._id, {end_date : new Date()});
    },
    'click .edit' : function(e, t) {
  //implement edit
    } 
  });

  //Prescribe new medication code, runs once medications has been rendered. 
  Template.medications.rendered = function () {
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

      $('.popover').on('click', '#add-med', function(e) {
        e.preventDefault();

        Medications.insert({
          patient_id : Router.getData().join_id,
          doctor_id : 1/*this user from join_id*/,
          name : $('#med-name').val(),
          dose : $('#med-dose').val(),
          dose_unit : $('#med-dose-unit').val(),
          frequency : $('#med-freq').val(),
          frequency_unit : $('#med-freq-unit').val(),
          comment : $('#med-comment').val(),
          reason : $('#med-reason').val(),
          start_date : new Date(),
          end_date : null
        }, function (err) {
          if (!err) {
            $('#prescribe').popover('hide');
          }
        });
        e.stopPropagation(); 
      });

      e.stopPropagation();
    });
  }

  //Close popover for prescribing medication
  $(document).on('click', function() {
    $('.trigger').popover('hide');
  });

}



if (Meteor.isServer) {
  Meteor.startup(function () {

    Patients = new Meteor.Collection("patients");
    Medications = new Meteor.Collection("medications");
    Alerts = new Meteor.Collection("alerts");
    Blood_P = new Meteor.Collection("blood_pressure");
    Weight = new Meteor.Collection("weight");
    Heart_R = new Meteor.Collection("heart_rate");

    //Publish all patients
    Meteor.publish("all_patients", function() {
      return Patients.find();
    });

    //Dummy Data

    //seed vital sign measurements
    var signal_dates = [Date.UTC(2013, 4), Date.UTC(2013, 5), Date.UTC(2013, 6), Date.UTC(2013, 7), 
    Date.UTC(2013, 8), Date.UTC(2013, 9), Date.UTC(2013, 10), Date.UTC(2013, 11), 
    Date.UTC(2014, 0), Date.UTC(2014, 1), Date.UTC(2014, 2), Date.UTC(2014, 3), Date.UTC(2014, 4)];

    // if (Blood_P.find().count() === 0) {
    //   for (var patient_id = 1; patient_id <= 10; patient_id++) {
    //     for (var day = 1; day <= 30; day++) {
    //       var date = new Date(2014, 4, day, 0, 0, 0, 0);
    //       Blood_P.insert({
    //         patient_id: patient_id,
    //         date: date, 
    //         systolic: Math.random() * (160 - 90) + 90,
    //         diastolic: Math.random() * (100 - 60) + 60
    //       });
    //     }

    //     Blood_P.insert({
    //       patient_id: patient_id,
    //       date: new Date(2014, 5, 1, 0, 0, 0, 0), 
    //       systolic: Math.random() * (160 - 90) + 90,
    //       diastolic: Math.random() * (100 - 60) + 60
    //     });

    //     months = [5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
    //     for (var month = 0; month < months.length; month++) {
    //       var date = new Date(2014, months[month], 1, 0, 0, 0, 0);
    //       Blood_P.insert({
    //         patient_id: patient_id,
    //         date: date, 
    //         systolic: Math.random() * (160 - 90) + 90,
    //         diastolic: Math.random() * (100 - 60) + 60
    //       });        
    //     }
    //   }
    // }


    Blood_P.remove({});

    for (var patient_id = 1; patient_id <= 10; patient_id++) {
      for (var i = 0; i < signal_dates.length; i++) {
        Blood_P.insert({
          patient_id: patient_id,
          date: signal_dates[i], 
          systolic: Math.floor(Math.random() * (160 - 90) + 90),
          diastolic: Math.floor(Math.random() * (100 - 60) + 60)
        });
      }
    }

    Heart_R.remove({});

    for (var patient_id = 1; patient_id <= 10; patient_id++) {
      for (var i = 0; i < signal_dates.length; i++) {
        Heart_R.insert({
          patient_id: patient_id,
          date: signal_dates[i], 
          heart_rate: Math.floor(Math.random() * (90 - 50) + 50)
        });
      }
    }

    Weight.remove({});

    for (var patient_id = 1; patient_id <= 10; patient_id++) {
      for (var i = 0; i < signal_dates.length; i++) {
        Weight.insert({
          patient_id: patient_id,
          date: signal_dates[i], 
          weight: Math.floor(Math.random() * (250 - 125) + 125)
        });
      }
    }

    // if (Heart_R.find().count() === 0) {
    //   for (var patient_id = 1; patient_id <= 10; patient_id++) {
    //     // for (var day = 1; day <= 30; day++) {
    //     //   var date = new Date(Date.UTC(2014, 4, day));
    //     //   Heart_R.insert({
    //     //     patient_id: patient_id,
    //     //     date: date, 
    //     //     heart_rate: Math.random() * (90 - 50) + 50
    //     //   });
    //     // }

    //     // Heart_R.insert({
    //     //   patient_id: patient_id,
    //     //   date: new Date(Date.UTC(2014, 5, 1)), 
    //     //   heart_rate: Math.random() * (90 - 50) + 50
    //     // });

    //     var months = [5, 6, 7, 8, 9, 10, 11, 12];
    //     for (var month = 0; month < months.length; month++) {
    //       var date = new Date(Date.UTC(2013, months[month]));
    //       Heart_R.insert({
    //         patient_id: patient_id,
    //         date: date, 
    //         heart_rate: Math.random() * (90 - 50) + 50,
    //       });        
    //     }
    //             Heart_R.insert({
    //       patient_id: patient_id,
    //       date: new Date(Date.UTC(2014, 1)), 
    //       heart_rate: Math.random() * (90 - 50) + 50
    //     });
    //             Heart_R.insert({
    //       patient_id: patient_id,
    //       date: new Date(Date.UTC(2014, 2)), 
    //       heart_rate: Math.random() * (90 - 50) + 50
    //     });
    //             Heart_R.insert({
    //       patient_id: patient_id,
    //       date: new Date(Date.UTC(2014, 3)), 
    //       heart_rate: Math.random() * (90 - 50) + 50
    //     });
    //   }
    // }

    // if (Weight.find().count() === 0) {
    //   for (var patient_id = 1; patient_id <= 10; patient_id++) {
    //     for (var day = 1; day <= 30; day++) {
    //       var date = new Date(2014, 4, day, 0, 0, 0, 0);
    //       Weight.insert({
    //         patient_id: patient_id,
    //         date: date, 
    //         weight: Math.random() * (250 - 125) + 125,
    //       });
    //     }

    //     Weight.insert({
    //       patient_id: patient_id,
    //       date: new Date(2014, 5, 1, 0, 0, 0, 0), 
    //       weight: Math.random() * (250 - 125) + 125,
    //     });

    //     months = [5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
    //     for (var month = 0; month < months.length; month++) {
    //       var date = new Date(2014, months[month], 1, 0, 0, 0, 0);
    //       Weight.insert({
    //         patient_id: patient_id,
    //         date: date, 
    //         weight: Math.random() * (250 - 125) + 125,
    //       });        
    //     }
    //   }
    // }

    // Meteor.publish("all_medications", function() {
    //   return Medications.find();
    // });
    // Patients.remove({});
    if (Patients.find().count() === 0) {
      Patients.insert({
        join_id: 1,
        first_name : "John",
        last_name : "Doe",
        age : "30",
        blood_type : "A",
        gender : "M"
      });
      Patients.insert({
        join_id: 2,
        first_name : "John",
        last_name : "Adams",
        age : "22",
        blood_type : "O",
        gender : "M"
      });
      Patients.insert({
        join_id: 3,
        first_name : "Ben",
        last_name : "Bitdiddle",
        age : "10",
        blood_type : "AB",
        gender : "M"
      });
      Patients.insert({
        join_id: 4,
        first_name : "Gabriel",
        last_name : "Frattallone",
        age : "57",
        blood_type : "B",
        gender : "M"
      });
      Patients.insert({
        join_id: 5,
        first_name : "Jan",
        last_name : "Rodriguez",
        age : "76",
        blood_type : "B",
        gender : "M"
      });
      Patients.insert({
        join_id: 6,
        first_name : "Harry",
        last_name : "Sanabria",
        age : "27",
        blood_type : "O",
        gender : "M"
      });
      Patients.insert({
        join_id: 7,
        first_name : "Joe",
        last_name : "Johnson",
        age : "45",
        blood_type : "A",
        gender : "M"
      });
      Patients.insert({
        join_id: 8,
        first_name : "Bob",
        last_name : "Bobbert",
        age : "29",
        blood_type : "AB",
        gender : "M"
      });
      Patients.insert({
        join_id: 9,
        first_name : "Natalie",
        last_name : "Bobbert",
        age : "28",
        blood_type : "A",
        gender : "F"
      });
      Patients.insert({
        join_id: 10,
        first_name : "Ashley",
        last_name : "Smith",
        age : "35",
        blood_type : "O",
        gender : "F"
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

    // Medications.remove({});
    if (Medications.find().count() === 0) {
      Medications.insert({
        patient_id : 5,
        doctor_id : 2,
        name : "Tylenol",
        dose : 50,
        dose_unit : "mg",
        frequency : 24,
        frequency_unit : "hours",
        comment : "",
        reason : "headache",
        start_date : Date.UTC(2013, 5, 1),
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
        start_date : Date.UTC(2013, 5, 1),
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
        start_date : Date.UTC(2013, 10, 21),
        end_date : Date.UTC(2014, 3, 28)
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
        start_date : Date.UTC(2014, 3),
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
        start_date : Date.UTC(2013, 1),
        end_date : Date.UTC(2013, 5)
      });
    }
  });
}
