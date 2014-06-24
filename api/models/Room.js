/**
 * Room
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
    name: {
      type: 'string',
      required : true
    },
    managed_by: {
      type: 'json',
      defaultsTo: null
    },
    players :{
      type:'array',
      defaultsTo: []
    },
    first_quiz_time :{
      type: 'int',
      defaultsTo:0
    },
    relative_support_time : {
      type : 'int',
      defaultsTo: 0
    },
    audience_survey_time: {
      type: 'int',
      defaultsTo: 0
    },
    eliminated_quiz :{
      type:'json'
    },
    quizPack : {
      type :'array'
    },
    isWaiting: {
      type: 'boolean',
      defaultsTo: true
    },
    isPlaying: {
      type : 'boolean',
      defaultsTo: false
    },
    closed: {
      type: 'boolean',
      defaultsTo: false
    }
  }

};
