/**
 * Player
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  attributes: {

  	/* e.g.
  	nickname: 'string'
  	*/
    name : {
      type:'string',
      // required: true
    },
    email: {
     type: 'string',
     email:true,
     unique: true,
     required: true
    },
    encryptedPassword: {
     type: 'string',
    },
    last_login : {
      type : 'string'
    },
    online: {
      type : 'boolean',
      defaultsTo : false
    },
    playing : {
      type : 'boolean',
      defaultsTo: false
    },
    isInRoom : {
      type : 'json',
      defaultsTo: null
    },
    isReady : {
      type : 'boolean',
      defaultsTo : false
    },
    first_quiz_result :{
      type :'json',
      defaultsTo:null
    },
    audience_survey_result : {
      type: 'string',
      defaultsTo: ''
    },
    state : {
      type : 'string',
      defaultsTo: ""
    },
    curr_quiz : {
      type : 'int',
      defaultsTo : 0
    },
    supports : {
      type :'json',
      defaultsTo:null
    },
    score_history : {
      type :'array',
      defaultsTo: []
    },
    toJSON: function() {
      var obj = this.toObject();
      delete obj.password;
      delete obj.confirmation;
      delete obj.encryptedPassword;
      delete obj._csrf;
      return obj;
    }
  },
  /* password hashing with bcrypt-nodejs*/
  beforeCreate: function (values, next) {
    if( !values.password || values.password != values.confirmation) {
      return next({err: ["Mật khẩu và xác nhận không khớp!"]});
    }

    var bcrypt = require('bcrypt-nodejs');

    // bcrypt.genSalt(10, function(err, salt) {
      // if (err) return next(err);

      bcrypt.hash(values.password, null,null, function(err, hash) {
        if (err) return next(err);

        values.encryptedPassword = hash;
        delete values.password;
        delete values.confirmation;
        next();
      });
    // });
  }
  /* passwd hashing with bcrypt */
  // beforeCreate : function(values, next) {
  //   if( !values.password || values.password != values.confirmation) {
  //     return next({err: ["Mật khẩu và xác nhận không khớp!"]});
  //   }
  //   require("bcrypt").hash(values.password,10, function passwordEncrypted(err, encryptedPassword) {
  //     if(err) return next(err);
  //     values.encryptedPassword = encryptedPassword;
  //     values.online = true;
  //     next();
  //   });
  // }


};
