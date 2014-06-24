/**
 * RoomController
 *
 * @module      :: Controller
 * @description	:: A set of functions called `actions`.
 *
 *                 Actions contain code telling Sails how to respond to a certain type of request.
 *                 (i.e. do stuff, then send some JSON, show an HTML page, or redirect to another URL)
 *
 *                 You can configure the blueprint URLs which trigger these actions (`config/controllers.js`)
 *                 and/or override them with custom routes (`config/routes.js`)
 *
 *                 NOTE: The code you write here supports both HTTP and Socket.io automatically.
 *
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */

module.exports = {
  index: function(req,res,next) {
    Room.find(function foundRooms(err,rooms) {
        if(err) return next(err);
        res.view({
          admin : req.session.Admin,
          rooms : rooms
        });
    });
  },
  new: function (req,res) {
    res.view();
  },
  create : function(req, res, next) {
    // if( typeof req.session.Admin !== 'undefined')
    if( req.session.Admin.room == null ) {
      var roomJSON = {
        name : req.param('name'),
        managed_by : req.session.Admin.id,
        quizPack : [],
        eliminated_quiz:{}
      }
      Question.countByLevel('easy').exec(function(err,n) {
      var r = Math.floor(Math.random()* n);
      console.log(r);
      Question.find()
              .where({level :'easy'})
              .limit(5)
              .skip(r).exec(function(err,quizs) {
          if(err) return next(err);
          for (var i = quizs.length - 1; i >= 0; i--) {
            roomJSON.quizPack.push(quizs[i]);
          };
          Question.countByLevel('medium').exec(function(err,n) {
          r = Math.floor(Math.random()* n);
          console.log(r);
          Question
          .find()
          .where({level: 'medium'}).limit(5).skip(r)
          .exec(function(err,quizs) {
                if(err) return next(err);
                for (var i = quizs.length - 1; i >= 0; i--) {
                roomJSON.quizPack.push(quizs[i]);
                };
                Question.countByLevel('hard').exec(function(err,n) {
                r = Math.floor(Math.random()* n);
                console.log(r);
                Question
                .find()
                .where({level: 'hard'}).limit(5).skip(r)
                .exec(function(err,quizs) {
                  if(err) return next(err);
                  for (var i = quizs.length - 1; i >= 0; i--) {
                  roomJSON.quizPack.push(quizs[i]);
                  };
                  Eliminated_question.count().exec(function(err,n) {
                  r = Math.floor(Math.random()* n);
                  console.log(r);
                  Eliminated_question.find().limit(10).skip(r).exec(function(err,equiz) {
                    if(err) return next(err);
                      roomJSON.eliminated_quiz = equiz;
                      Room.create(roomJSON, function roomCreated(err,room) {
                      if(err) return next(err);
                      if(!room) return next([{err:'No room was created.'}]);
                      //Update roomCreated for admin
                      var roomId = room.id;
                      Admin.findOne(req.session.Admin.id,function(err,admin) {
                        admin.room = roomId;
                        admin.save(function(err,admin) {
                          if(err) return next(err);
                          req.session.Admin.room = roomId;
                          // console.log(req.session.Admin);
                          var roomCreationSuccess = [{ name : 'roomCreationSuccess',message: 'Tạo phòng thành công, hãy vào quản lý phòng của bạn'}]

                          req.session.flash = {
                            err : roomCreationSuccess
                          }
                          res.redirect('/room');
                          return;
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  } else {
      var roomCreationErr = [{ name : 'roomCreationError',message: 'Mỗi MC chỉ được quản lý 1 phòng,Hãy tìm phòng của bạn trong ds'}]
      req.session.flash = {
            err: roomCreationErr
      }
      res.redirect('/room');
      return;
    }
  },
  show: function(req, res, next) {
      var curr_room = req.session.Admin.room;
      Room.findOne(curr_room,function foundRoom (err, room){
        if(err) return next(err);
        if(!room) return next([{err: 'No room was found!'}]);
        var thisRoom = room;
        // console.log(room.players);
        Player.find().where({ id:room.players}).exec(function foundPlayers (err,players) {
          // console.log(players);
          // if(err) return next(err);
          // if(!players) return next([{err: 'No player was found'}]);
          var retObj = {
            room: thisRoom,
            players:players,

          };
         res.view(retObj);


        });

      });
  },
  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to RoomController)
   */
  _config: {}


};
