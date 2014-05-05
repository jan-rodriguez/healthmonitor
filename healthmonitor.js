Router.onBeforeAction(function(pause) {
  if (!Meteor.user()) {
    pause();
    Router.go('root');
  }
}, {except: ['root', 'signup']});

Router.onBeforeAction(function(pause) {
  if (Meteor.user()) {
    pause();
    Router.go('root');
  }
}, {only: ['signup']});

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
});


if (Meteor.isClient) {
  currentUser = Meteor.user();

  UI.registerHelper("currentPage", function(localPath) {
    return Router.current(true).path === localPath;
  });

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

  Template.navbar.events({
    'click #logout' : function(e, t) {
      e.preventDefault()

      Meteor.logout( function() {
        Router.go('root');
      });
    }
  });

}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
