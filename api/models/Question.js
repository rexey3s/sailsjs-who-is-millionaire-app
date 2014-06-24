/**
 * Question
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
    question : {
      type : 'string',
      required : true
    },
    answer : {
      type : 'array'
    },
    correct_answer:{
      type : 'string'
    },
    id: {
      type :'int'
    },
    level :{
      type:'string'
    }
  }

};
