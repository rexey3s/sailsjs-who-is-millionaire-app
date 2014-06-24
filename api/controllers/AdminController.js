/**
 * AdminController
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
  index : function(req,res) {
    res.view();
  },
  new : function(req,res) {
    res.view();
  },
  check_email: function(req,res,next) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(!re.test(req.param('email'))) return res.json({
        'ok': false,
        'msg': 'Sai định dạng của email'
    });
    Admin.findOneByEmail(req.param('email'),function findEmail(err,admin){
      if(err) return next(err);
      if(admin) return res.json({
        ok : false,
        msg: 'Email đã được đăng ký'
      });
      return res.json({
        ok : true,
        msg: 'Email OK!'
      });

    });
  },
  create: function(req, res, next)  {
    // console.log(req.params.all());
    var adminObj = {
      name : req.param("name"),
      email : req.param("email"),
      password: req.param("password"),
      confirmation: req.param("confirmation")
    };
    Admin.create(adminObj,function adminCreated (err,admin) {
      if(err) {
        console.log(err);
        req.session.flash = {
          err: err
        }
        res.json({
          ok:false,
          msg: err
        });
        return
      } if(!admin)  {
          res.json({
            ok: false,
            msg: 'Chưa tạo được tài khoản'
          });
          return
      } else {
          req.session.destroy();
          res.json({
            ok: true,
            msg: '"'+adminObj.email+'" đã tạo tài khoản thành công'
          });
          return
      }
    });
  },
  login : function (req, res) {
    res.view();
  },
  doLogin : function(req, res, next) {
      if(!req.param('email') || !req.param('password')) {
        var emailPasswordRequiredErr = [{name: 'emailPasswordRequiredErr',message: 'Please enter your email and password!'}]
        req.session.flash = {
          err: emailPasswordRequiredErr
        }
        res.redirect('/admin/login');
        return;
      }
      Admin.findOneByEmail(req.param("email"), function(err, admin){
      // console.log(admin);

          if(err) return next(err);

          if(!admin) {
            var noAccountErr = [{name: 'No account',message: 'The email address ' + req.param("email") +' not found.'}]
            req.session.flash = {
              err: noAccountErr
            }
            res.redirect('/admin/login');
            return;
          }
      // Compare password from the form params to the encrypted password of the admin found.
      var bcrypt = require("bcrypt-nodejs");
      bcrypt.compare(req.param('password'), admin.encryptedPassword, function(err, valid) {
        if (err) return next(err);
        // If the password from the form doesn't match the password from the database...
        if (!valid) {
          var adminAccountAndPasswordMismatchError = [{
            name: 'EmailPasswordMismatch',
            message: 'Invalid admin and password combination.'
          }]
          req.session.flash = {
            err: adminAccountAndPasswordMismatchError
          }
          res.redirect('/admin/login');
          return;
        }
        req.session.authenticated = true;
        req.session.Admin = admin;
        if(req.session.Admin.room !=  null) {
          res.redirect('/room/show');
          return;
        }
        var roomCreationErr = [{ name : 'NoRoomCreatedError',message: 'Mc hãy tạo 1 phòng chơi'}]
        req.session.flash = {
            err: roomCreationErr
        }
        res.redirect('/room');
        return;
        // var roomObj = {
        //   name : req.param('roomname')
        // }

        // Room.create(roomObj,function roomCreated(err,room) {
        //   admin.room = room.id;
        //   var roomId = room.id;
        //     Admin.update(req.session.Admin.id,{
        //     room : room.id
        //     },
        //     function(err,admin) {
        //       if(err) return next(err);
        //       req.session.Admin = admin;
        //       Eliminated_question.find(function(err,quiz) {
        //       if(err) return next(err);
        //       // console.log(quiz);
        //       var randIndexQuiz = Math.floor((Math.random() * quiz.length) + 1);
        //       console.log(randIndexQuiz);
        //       Room.update(req.session.Admin.room,{
        //         eliminated_quiz :quiz[randIndexQuiz]
        //       },function(err,room) {
        //         if(err) return next(err);
        //         req.session.Admin = admin;

        //           res.redirect('/room/show');


        //       });
        //     });
        //   });
        // });




      });
    });
  },
  deleteRoom : function(req,res,next){
    var adminId = req.session.Admin.id;
    Admin.findOne(adminId,function(err,admin) {
      if(err) return next(err);
      if(admin) {
        if(admin.room != null) {
          Room.findOne(admin.room,function(err,room) {
            if(err) return next(err);
            if(!room) {
              var roomNotFound = [{ name :'roomNotFound',message :'Lỗi, ko tìm được phòng của MC đã tạo'}]
              req.session.flash = {
                err: roomNotFound
              }
              res.redirect('/room');
              return
            }
            if(room.first_quiz_time > 0 || room.relative_support_time > 0) {
            res.json({
              ok:false,
              msg: 'Không thể xóa phòng vào lúc này vì người chơi vẫn đang tương tác với các chức năng của phòng chơi'
            });return;
            } else {
               if(room.players.length > 0) {
              room.players.forEach(function(id) {
                Player.findOne(id,function(err,player) {
                  if(err) return next(err);
                  if(player) {
                    player.isInRoom = null;
                    player.state = "";
                    player.supports = null;
                    player.first_quiz_result = null;
                    player.isReady = false;
                    player.isPlaying = false;
                    player.save(function(err,aff_player) {
                      if(!err)
                      // console.log('Delete room "affected player":',aff_player);
                      Player.publishUpdate(aff_player.id,{
                        action: "admin_delete_room"
                      });
                    });
                  }
                });

              });

              }
              room.destroy(function(err) {
                 req.session.Admin.room =null;
                  admin.room = null;
                  admin.save(function(err,admin) { console.log('Delete room "aff_admin":',admin) ;});
                  res.json({
                    ok:true,
                    msg: 'Phòng đã bị xóa'
                  });
                  return;
              });
            }
          });

        } else {
          var roomNotFound = [{ name : 'roomNotFound',message: 'Mc chưa tạo phòng nào!'}]
          req.session.flash = {
            err: roomNotFound
          }
          res.redirect('/room');
          return
        }
      }
    });
  },
  logout: function(req, res, next) {

    Admin.findOne(req.session.Admin.id, function foundPlayer(err, admin) {

      var PlayerId = req.session.Admin.id;

      if (admin) {
        Admin.update(PlayerId, {
          online: false
        }, function(err) {
          if (err) return next(err);

          Admin.publishUpdate(PlayerId, {
            online: false,
            id: PlayerId,
            name: admin.name,
            action: ' has logged out.'
          });

          // Wipe out the session (log out)
          req.session.destroy();

          // Redirect the browser to the sign-in screen
          res.redirect('/admin/login');
        });
      } else {

        // Wipe out the session (log out)
        req.session.destroy();

        // Redirect the browser to the sign-in screen
        res.redirect('/admin/login');
      }
    });
  },
  subscribe: function(req, res,next) {

    if ( typeof req.session.Admin !== 'undefined' ) {
      if( req.session.Admin.room != null) {
      Admin.subscribe(req.socket);
      var roomId = req.session.Admin.room;
      Room.findOne(roomId, function foundRoom(err,room) {
          if(err) return next(err);
          Admin.find({room:roomId},function foundPlayers(err, admin) {
            if (err) return next(err);
            console.log(admin);
            Admin.subscribe(req.socket, admin);
            res.send(200);
          });
        });
      }
      else return res.send(403)
    } else res.send(404);
  },
  ads : function(req,res,next) {
    var roomId = req.session.Admin.room;


    Player.find().where({state:'nguoi_choi_chinh'}).limit(1).exec(function(err,p){
     if(p.length > 0) {

      Room.findOne(roomId,function(err,room) {
          if(err) return next(err);
          if( p[0].curr_quiz > 0 && p[0].curr_quiz < 15 ) {
              Player.publishUpdate(p[0].id,{
                action:'quang_cao'
              });
              res.json({
                ok:true,
                msg:'Quảng cáo đã được phát'
              })
          } else{
            res.json({
              ok: false,
              msg: 'Người chơi chính đã hoàn thành phần chơi hay đang câu hỏi đầu tiên, quảng cáo sẽ không chạy'
            })
          }
        });
      }else
      res.json({
        ok :false,
        msg: 'Quảng cáo chỉ chạy khi đang ở trong phần thi của người chơi chính'
      })

    });
  },
  start1quiz :function(req,res, next){
    var curRoom = req.session.Admin.room;

    Room.findOne(curRoom,function foundRoom (err, room){
        var adminId = room.managed_by;
        if(err) return next(err);
        if(!room) return next([{err: 'No room was found!'}]);
        // var quiz = shuffle(room.eliminated_quiz);
        // quiz[0].answer = shuffle(quiz[0].answer);
        room.eliminated_quiz = shuffle(room.eliminated_quiz);
        room.eliminated_quiz[0].answer = shuffle(room.eliminated_quiz[0].answer);
        room.isWaiting = false;
        room.isPlaying = true;
        room.save(function(err,room) {
          if(err) return next(err);
          // Room.publishUpdate();
          // console.log(room.players);
          Player.find().where({ id:room.players}).exec(function foundPlayers (err,players) {
            // console.log(players);
            // if(err) return next(err);
            // if(!players) return next([{err: 'No player was found'}]);
            // console.log(players);
            players.forEach(function(p) {
              if(p.isReady) {

                Player.update(p.id,{
                  state : 'chon_nguoi_choi_chinh',
                  playing: true
                },function(err,affectedPlayer) {
                  if(err) return next(err);
                  Player.publishUpdate(p.id,{
                      playing : true,
                      state : 'chon_nguoi_choi_chinh',
                      action : 'chon_nguoi_choi_chinh'
                  });
                  Admin.publishUpdate(adminId,{
                      // playing : true,
                      // state : 'chon_nguoi_choi_chinh',
                      action : 'chon_nguoi_choi_chinh'
                  });
                  res.send(200);
                });
              }
            });
          });
        Room.update(curRoom,{
          first_quiz_time : 36 // thêm 5s cho quá trình xử lý
        },function(err,room) {
              var clock_timer = null;
              // var clock_time = 0;
              // clock_time = max;
              clock_timer = setInterval(function() {
              Room.findOne(curRoom,function(err,room) {
                if(err) return next(err);
                var pid = room.players[0];
                  if(room.first_quiz_time > 0) {
                      room.first_quiz_time--;

                      room.save(function(err,room){

                      Player.publishUpdate(pid,{
                          first_quiz_time : room.first_quiz_time,
                          action: 'thoi_gian_cho_nguoi_choi_chinh',
                        });

                      Admin.publishUpdate(room.managed_by,{
                          first_quiz_time : room.first_quiz_time,
                          action: 'thoi_gian_cho_nguoi_choi_chinh',
                        });
                      });
                  } else {
                    room.first_quiz_time = 0;// Kết thúc quá trình chọn người chơi chính
                    room.save(function(err,room) {
                      var roomId = room.id;
                      var nextquiz = room.quizPack[0];
                      var adminId = room.managed_by;
                      var roomPlayers = room.players;
                      clearInterval(clock_timer);
                      Player.find()
                      .where({id:room.players})
                      .where({"first_quiz_result.correct":true})
                      .sort("first_quiz_result.time desc")
                      .exec(function(err,players) {
                          if(err) return next(err);
                          if( players.length > 0) {
                          var pid = players[0].id;
                          var mainPlayer = players[0];
                          Player.update(pid,{
                              supports :{
                                fifty_fifty : true,
                                audience : true,
                                relative : true
                              },
                              // role : 'nguoi_choi_chinh',
                              state: 'nguoi_choi_chinh',
                              first_quiz_result : null
                          },function(err,player) {
                                if(err) return next(err);
                                var mainIndex = roomPlayers.indexOf(pid);
                                roomPlayers.splice(mainIndex,1);
                                console.log('roomPlayers: ',roomPlayers);
                                Player.find().where({id:roomPlayers}).exec(function(err,affectedPlayers) {
                                  if(affectedPlayers.length > 0){
                                    affectedPlayers.forEach(function(player) {
                                      player.state = 'khan_gia';
                                      player.first_quiz_result = null;
                                      player.save(function(err) {
                                        Player.publishUpdate(player.id,{
                                            playerId :pid,
                                            playerName : mainPlayer.name,
                                            path : '/player/audience',
                                            action: 'kq_chon_nguoi_choi_chinh'
                                            });
                                      });
                                    });
                                  }
                                });





                                Player.publishUpdate(pid,{
                                    playerId :pid,
                                    playerName : mainPlayer.name,
                                    path : '/player/mainplayer',
                                    action: 'kq_chon_nguoi_choi_chinh'
                                });
                                Admin.publishUpdate(adminId,{
                                    mainPlayer : mainPlayer,
                                    playerId :pid,

                                    action: 'kq_chon_nguoi_choi_chinh'
                                });
                              });
                          } else {
                            Room.findOne(roomId,function(err,room){
                              if(err) return next(err);
                                 Player.update({isInRoom:roomId},
                                  {
                                    first_quiz_result: null
                                  }
                                ,function(err,players){
                                  //Do sth here if you want
                                });
                                 Admin.publishUpdate(adminId,{
                                    action: 'chua_chon_dc_nguoi_choi_chinh'
                                  });
                              });
                          }

                      });
                    });
                  }
              });
            },1020);
        });
      });
    });
  },
  quitRoom: function(req,res,next) {
    var roomId = req.session.Admin.room;
    if(roomId == null || roomId == '') {
      return res.redirect('/room');
    }
    Room.findOne(roomId,function(err,room) {
      if(err) return next(err);
      if(!room) return res.redirect('/room');
      if(room.players.length > 0) {
        players.forEach(function(player) {
          Player.publishUpdate(player.id,{
            action: 'admin_roi_phong',
          });
        });
      }
    });
  },

  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to AdminController)
   */
  _config: {}


};
function shuffle(array) {
  var currentIndex = array.length
    , temporaryValue
    , randomIndex
    ;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}
