/**
 * Admin
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  schema: true,
  attributes: {

  	/* e.g.
  	nickname: 'string'
  	*/
    email: {
     type: 'string',
     email:true,
     unique: true,
     required: true
    },
    name : {
      type : 'string'
    },
    encryptedPassword: {
     type: 'string',
    },
    adminRole : {
      type : 'boolean',
      defaultsTo: true
    },
    room: {
      type : 'json',
      defaultsTo : null
    },
    toJSON: function() {
      var obj = this.toObject();
      delete obj.password;
      delete obj.confirmation;
      // delete obj._csrf;
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


};
