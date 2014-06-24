/**
 * PlayerController
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
  index: function(req,res) {
    res.view();
  },
  new : function(req, res) {
    res.view();
  },
  check_email: function(req,res,next) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(!re.test(req.param('email'))) return res.json({
        'ok': false,
        'msg': 'Sai định dạng của email'
    });
    Player.findOneByEmail(req.param('email'),function findEmail(err,player){
      if(err) return next(err);
      if(player) return res.json({
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
    var playerObj = {
      name : req.param("name"),
      email : req.param("email"),
      password: req.param("password"),
      confirmation: req.param("confirmation")
    };
    Player.create(playerObj,function playerCreated (err,player) {
      if(err) return next(err);

      if(!player)  {
          res.json({
            ok: false,
            msg: 'Chưa tạo được tài khoản'
          });
          return
      } else {
          req.session.destroy();
          res.json({
            ok: true,
            msg: '"'+playerObj.email+'" đã tạo tài khoản thành công'
          });
          return
      }
      // res.redirect('/player/login');

      // res.redirect('/player/login');
      // res.redirect('/player/show/'+player.id);
      // req.session.flash ={};
    });
  },

  login : function(req, res) {
    if(typeof req.session.authenticated !== 'undefined' && req.session.authenticated == true) {
      if(req.session.Player.isInRoom != null ) {
        res.redirect('/player/showroom');
        return;
      }
      res.redirect('/player/room');
      return;
    }
    res.view();
  },
  doLogin : function(req, res, next) {
    if(typeof req.session.authenticated !== 'undefined' && req.session.authenticated == true) {
      if(req.session.Player.isInRoom != null ) {
        res.redirect('/player/showroom');
        return;
      }
      res.redirect('/player/room');
      return;
    }
      if(!req.param('email') || !req.param('password')) {
        var emailPasswordRequiredErr = [{name: 'emailPasswordRequiredErr',message: 'Please enter your email and password!'}]
        req.session.flash = {
          err: emailPasswordRequiredErr
        }
        res.redirect('/player/login');
        return;
      }
      Player.findOneByEmail(req.param("email"), function(err, player){
          if(err) return next(err);

          if(!player) {
            var noAccountErr = [{name: 'No account',message: 'The email address ' + req.param("email") +' not found.'}]
            req.session.flash = {
              err: noAccountErr
            }
            res.redirect('/player/login');
            return;
          }
          // console.log(player);
      // Compare password from the form params to the encrypted password of the player found.
      var bcrypt = require("bcrypt-nodejs");
      bcrypt.compare(req.param('password'), player.encryptedPassword, function(err, valid) {
        if (err) return next(err);
        // If the password from the form doesn't match the password from the database...
        if (!valid) {
          var playernamePasswordMismatchError = [{
            name: 'playerEmailPasswordMismatch',
            message: 'Invalid playerEmail and password combination.'
          }]
          req.session.flash = {
            err: playernamePasswordMismatchError
          }
          res.redirect('/player/login');
          return;
        }
        // Log player in
        req.session.authenticated = true;
        req.session.Player = player;
        // Change status to online
        player.online = true;
        player.save(function(err, player) {
          if (err) return next(err);
          if(req.session.Player.isInRoom) {
            switch(req.session.Player.state) {
              case 'chon_nguoi_choi_chinh': res.redirect('/player/start1quiz');return;
              case 'nguoi_choi_chinh':res.redirect('/player/mainplayer');return;
              case 'cho_kq_chon_nguoi_choi_chinh': res.redirect('/player/start1quiz');return;
              case 'khan_gia' :res.redirect('/player/audience');return;
              default:break;
            }
            res.redirect('/player/showroom');
            return
          }
            res.redirect('/player/room');
        });
      });
    });
  },
  logout: function(req, res, next) {

    Player.findOne(req.session.Player.id, function foundPlayer(err, player) {

      var PlayerId = req.session.Player.id;

      if (player) {
        Player.update(PlayerId, {
          online: false
        }, function(err) {
          if (err) return next(err);
          // Wipe out the session (log out)
          req.session.destroy();

          // Redirect the browser to the sign-in screen
          res.redirect('/player/login');
        });
      } else {

        // Wipe out the session (log out)
        req.session.destroy();

        // Redirect the browser to the sign-in screen
        res.redirect('/player/login');
      }
    });
  },
  subscribe: function(req, res, next) {
    if( typeof req.session.Player !== 'undefined') {
      if(req.session.Player.isInRoom != null) {
      Player.subscribe(req.socket);
      var roomId = req.session.Player.isInRoom;
      Room.findOne(roomId, function foundRoom(err,room) {
          if(err) return next(err);
          if(room) {
          Player.find().where({id:room.players}).exec(function foundPlayers(err, players) {
            if (err) return next(err);
            Player.subscribe(req.socket, players);
            res.send(200);
            });
          }
        });
      }
      else return res.send(403);
    }
    else res.send(404);
  },
  join : function(req, res, next) {
    Room.findOne(req.param('id'),function foundRoom (err,room)  {
    if(err) return next(err);
    if(!room) return next([{err: 'Could not find any rooms'}]);
    var adminId = room.managed_by;
    var roomId = room.id;
    Player.findOne(req.session.Player.id,function foundPlayer(err,player) {
          player.isInRoom = room.id;
          player.save(function (err,player) {
          if(err) return next(err);
            // Inform other sockets that this player has joined this room
            Player.publishUpdate(player.id,{
              room : room.id,
              player : player,
              action : 'player_join'
            });
            Admin.publishUpdate(adminId,{
              room : room.id,
              player : player,
              action : 'player_join'
            });
            req.session.Player.isInRoom = roomId;
            if(room.players.indexOf(player.id) === -1) {
              room.players.push(player.id);
              room.save(function(err, room) {
                if (err) return next(err);

             res.redirect('/player/showroom');


                });
            } else {
             res.redirect('/player/showroom');
            }
        });
      });
    });
  },
  disjoin: function(req, res, next) {
     Player.findOne(req.session.Player.id,function foundPlayer (err,player) {
        var playerId = req.session.Player.id;
        var roomId = req.session.Player.isInRoom;
        if(err) return next(err);
        if(!player) return next([{err: 'No player was found'}]);

        player.isInRoom = null;
        player.isReady = false;
        player.state = '';

        player.save(function(err,player)  {
          if(err) return next(err);
          if(!player) return next([{err:'No player was found!'}]);
          req.session.Player.isInRoom = null;
          req.session.Player.isReady = false;
          Player.publishUpdate(player.id,{
              roomId : roomId,
              playerId : playerId,
              action : 'player_left'
          });
          Room.findOne(roomId,function foundRoom(err,room) {
              if(room) {
              var playerIndex = room.players.indexOf(playerId);
              if( playerIndex !== -1) {
                room.players.splice(playerIndex,1);
                room.save(function(err, room) {
                if (err) return next(err);
                req.session.Player.isInRoom = null;
                req.session.Player.isReady = false;
                  // Inform other sockets that this room had one more member
                  Admin.publishUpdate(room.managed_by, {
                    // Inform for admin
                    roomId : roomId,
                    playerId : playerId,
                    action : 'player_left'
                  });
                  res.redirect('/player/room');
                  return;
                });
              } else {
                res.redirect('/player/room');
                }
              } else {

              }
          });
        });
     });
  },
  room : function(req, res, next) {
    // if(req.session.Player.isInRoom != null) {
    //   res.redirect('/player/showroom');
    //   return;
    // }
    Player.findOne(req.session.Player.id,function(err,player) {
      if(err) return next(err);
      if(player.isInRoom != null) {
          res.redirect('/player/showroom');
          return;
      } else {
        Room.find(function foundRooms (err,rooms) {
          if(err)  return next(err);
          if(!rooms) return next({err : [{name: 'roomNotFound',message: 'Can not find any rooms!'}]});
            res.view({
              rooms : rooms
            });
        });
      }
    });

  },
  showroom: function(req, res, next) {
    Player.findOne(req.session.Player.id,function(err,player) {
      if(err) return next(err);
      if(player.isInRoom == null) {
          res.redirect('/player/room');
          return;
      } else {

        Room.findOne(req.session.Player.isInRoom,function foundRoom (err, room){
        if(err) return next(err);
        if(!room) return next([{err: 'No room was found!'}]);
        Player.find().where({ id:room.players}).exec(function foundPlayers (err,players) {
            var json = {
                thisPlayer: req.session.Player,
                room: room,
                players:players
            };
            res.view(json);
          });
        });
      }
    });

  },
  ready: function(req, res, next) {
    Player.findOne(req.session.Player.id,function foundPlayer (err,player) {
      if(err) return next(err);
      if(!player) return next([{err:'No player was found.'}]);
      player.isReady = player.isReady == true ?  false: true;
      var status = player.isReady == true ? 'is ready':'is not ready';
      player.save(function(err,player) {
          if(err) return next(err);
          Player.publishUpdate(player.id,{
            isReady : player.isReady,
            playerId :player.id,
            action : 'change_ready_state'
          });
          Room.findOne(player.isInRoom,function(err,room) {
            if(err) return next(err);
            if(room) {
              Admin.findOne(room.managed_by,function(err,admin) {
                if(!err && admin) {
                  Admin.publishUpdate(admin.id,{
                    isReady : player.isReady,
                    playerId :player.id,
                    action : 'change_ready_state'
                  });
                }
              });
            }
          });
          res.send(200);
      });
    });
  },
  start1quiz:function(req,res,next) {
    var roomId = req.session.Player.isInRoom;
    var playerId = req.session.Player.id;
    var state = req.session.Player.state;
      if(roomId == null) {
        res.redirect('/player/room');
        return
      }
      Room.findOne(roomId,function foundRoomOfPlayer(err, room){

        if(err) return next(err);
        if(!room) return next([{err:'Couldn\'t find this room '}]);


        res.view({
          thisPlayer : req.session.Player,
          quizTime : room.first_quiz_time,
          quiz: room.eliminated_quiz[0]
        });
      })

  },
  first_quiz_submit: function(req,res,next) {
    var playerAnswer = req.param('ans');
    var ansTime = parseInt(req.param('time'));
    var roomId = req.session.Player.isInRoom;
    // console.log(playerAnswer);

    Room.findOne(roomId,function foundRoomOfPlayer(err, room){
        if(err) return next(err);
        if(!room) return next([{err:'Couldn\'t find this room of'}]);
        var adminId = room.managed_by;
        var correct_answer = room.eliminated_quiz[0].correct_answer;
        if(room.first_quiz_time > 0){
                  if(playerAnswer == correct_answer) {
                    Player.findOne(req.session.Player.id,function (err,player) {
                      if(player.first_quiz_result != null ) {
                          res.json({
                            ok :false,
                            msg : 'Bạn ko được trả lời lại'
                          });

                      } else {
                      player.state = 'cho_kq_chon_nguoi_choi_chinh';
                      player.first_quiz_result = {
                        correct : true,
                        time : ansTime
                      }
                      req.session.Player.state = 'cho_kq_chon_nguoi_choi_chinh';
                      player.save(function(err,player) {
                        if(err) return next(err);
                        Player.publishUpdate(player.id,{
                            player : player,
                            first_quiz_result: player.first_quiz_result,
                            action : 'co_1_nguoi_tra_loi'
                        });
                        // Room.findOne(roomId,function foundRoomOfPlayer(err, room) {
                        //     if(err) return next(err);
                        //     if(!room) return next([{ err: 'No room was found.'}]);
                        //     room.
                        // });
                        Admin.publishUpdate(adminId,{
                            player : player,
                            first_quiz_result: player.first_quiz_result,
                            action: 'co_1_nguoi_tra_loi'
                        });
                        res.json({
                          ok :true,
                          correct: true,
                          msg : "Bạn đã trả lời chính xác, vui lòng chờ những người khác trả lời xong!"
                          });

                        });
                      }
                    });

                  } else {
                    Player.findOne(req.session.Player.id,function (err,player) {
                       if(player.first_quiz_result != null ) {
                          res.json({
                            ok :false,
                            msg : 'Bạn ko được trả lời lại'
                          });
                          return;
                      } else {
                      req.session.Player.state = 'cho_kq_chon_nguoi_choi_chinh';
                      player.state = 'cho_kq_chon_nguoi_choi_chinh';
                      player.first_quiz_result = {
                        correct : false,
                        time : ansTime
                      }
                      player.save(function(err,player) {
                        if(err) return next(err);
                        Player.publishUpdate(player.id,{
                            player : player,
                            first_quiz_result: player.first_quiz_result,
                            action: 'co_1_nguoi_tra_loi'
                        });
                        Admin.publishUpdate(adminId,{
                            player : player,
                            first_quiz_result: player.first_quiz_result,
                            action: 'co_1_nguoi_tra_loi'
                        });
                       res.json({
                        ok:true,
                          correct: false,
                          msg : 'Bạn đã trả lời sai đáp án đúng là "'+correct_answer+'".Bạn vui lòng chờ những người khác trả lời xong!'
                        });
                      });
                      }
                    });
                  }
        } else {
          res.json({
            ok:false,
            msg: 'Bạn đã hết thời gian trả lời, hãy đợi MC bắt đầu câu hỏi mới'
          })
        }
    })
  },
  mainplayer: function(req,res,next) {
    var roomId = req.session.Player.isInRoom;
    var playerId = req.session.Player.id;
    var state = req.session.Player.state;
    if(roomId == null) {
        res.redirect('/player/room');
        return
    }
    else
    Player.findOne(playerId,function(err,player) {
      if(player.state != 'nguoi_choi_chinh') {
        res.redirect('/player/showroom');
        return
      }
      Room.findOne(roomId,function(err,room){
        res.view({
            thisPlayer: player,
            quiz : room.quizPack[player.curr_quiz],
            quizOrder : player.curr_quiz
        });
      })
    });
  },
  audience : function(req,res) {
    var roomId = req.session.Player.isInRoom;
    var playerId = req.session.Player.id;

    Player.find().where({state:'nguoi_choi_chinh'}).limit(1).exec(function(err,p){
     if(p.length > 0) {
      Room.findOne(roomId,function(err,room) {
          if(err) return next(err);
          if( p[0].curr_quiz < 15) {
              res.view({
                thisPlayer : p[0],
                quiz : room.quizPack[p[0].curr_quiz],
                quizOrder: p[0].curr_quiz,
                audience_survey_time: room.audience_survey_time
              });
          } else{
            res.redirect('/player/scoreboard');
          }
        });
      }else
      res.redirect('/player/showroom');

    });

  },
  nextquiz : function(req,res,next) {
    // if(req.session.Player.isInRoom != null ) {
    roomId = _.clone(req.session.Player.isInRoom);
    playerId = _.clone(req.session.Player.id);
    playerName = _.clone(req.session.Player.name);
    Player.findOne(playerId,function foundPlayer(err,player) {
      if(err) return next(err);
    var quizIndex = player.curr_quiz;
    Room.findOne(roomId,function foundRoom(err,room) {
        if(err) return next(err);
        // var quizIndex = _.clone(req.session.Player.curr_quiz);
        var adminId = room.managed_by;
        var Players = room.players;
        if(quizIndex < 14) {
        var correct_answer = room.quizPack[quizIndex].correct_answer;

          if(req.param('ans') == correct_answer) {
            var point = pointFromQuizIndex(quizIndex);

            ++quizIndex;
            var next_quiz = room.quizPack[quizIndex];
            Player.update(playerId,{
              curr_quiz : quizIndex,
              point : point
             } ,function foundPlayer(err, player) {
                req.session.Player.curr_quiz = quizIndex;
                Player.publishUpdate(playerId,{
                    curr_quiz : quizIndex,
                    nextquiz : next_quiz,
                    player_answer : req.param('ans'),
                    correct_answer : correct_answer,
                    supports : player[0].supports,
                    action : 'nguoi_choi_chinh_tra_loi_dung'
                });
                Admin.publishUpdate(adminId,{
                    curr_quiz : quizIndex,
                    nextquiz : next_quiz,
                    player_answer : req.param('ans'),
                    correct_answer : correct_answer,
                    player : player[0],
                    action : 'nguoi_choi_chinh_tra_loi_dung'
                });
                res.json({
                    correct :true,
                    nextquiz : quizIndex
                });
            });
          } else {
            Player.update(playerId,{
                point : getPrize(quizIndex),
             } ,function foundPlayer(err, player) {
                req.session.Player.curr_quiz = quizIndex;

                Player.publishUpdate(playerId,{
                    curr_quiz : quizIndex,
                    prize : getPrize(quizIndex),
                    player_answer : req.param('ans'),
                    correct_answer : correct_answer,
                    action : 'nguoi_choi_chinh_tra_loi_sai'
                });
                Admin.publishUpdate(adminId,{
                    curr_quiz : quizIndex,
                    prize : getPrize(quizIndex),
                    player_answer : req.param('ans'),
                    correct_answer : correct_answer,
                    player : player[0],
                    action : 'nguoi_choi_chinh_tra_loi_sai'
                });
                var obj = {
                    name : playerName,
                    date : new Date(),
                    point : getPrize(quizIndex),
                    max_quiz : quizIndex + 1
                }

                Player.update({isInRoom:roomId},{
                  state: '',
                  first_quiz_result: null,
                  audience_survey_result: '',
                  playing: false,
                  curr_quiz:0,
                  isReady :false,
                  point : ""
                },function(err,players) {
                  if(!err)
                    {
                    players.forEach(function(player) {
                      player.score_history.push(obj);
                      player.save(function(err){});
                    });
                    console.log('Success: '+players);
                    }
                });
                res.json({
                    correct :false,
                    nextquiz : quizIndex
                });
            });
          }
        } else {
          Player.update(playerId,{
                state: '',
                first_quiz_result:null,
                playing: false,
                point : getPrize(quizIndex),
                curr_quiz : 0,
                isReady : false,
                point : ""
             } ,function foundPlayer(err, player) {
                req.session.Player.curr_quiz = quizIndex;

                Player.publishUpdate(playerId,{
                    curr_quiz : quizIndex,
                    prize : getPrize(quizIndex),
                    player_answer : req.param('ans'),
                    correct_answer : room.quizPack[14].correct_answer,
                    action : 'nguoi_choi_chinh_chien_thang'
                });
                Admin.publishUpdate(adminId,{
                    curr_quiz : quizIndex,
                    prize : getPrize(quizIndex),
                    player_answer : req.param('ans'),
                    correct_answer : room.quizPack[14].correct_answer,
                    action : 'nguoi_choi_chinh_chien_thang'
                });
                var obj = {
                    name : playerName,
                    date : new Date(),
                    point : getPrize(quizIndex),
                    max_quiz : quizIndex + 1
                }
                 Player.update({isInRoom:roomId},{
                  state: '',
                  playing: false,
                  curr_quiz:0,
                  audience_survey_result: '',


                },function(err,players) {
                  if(!err)
                    {
                    players.forEach(function(player) {
                      player.score_history.push(obj);
                      player.save(function(err){});
                    });
                    console.log('Success: '+players);
                    }
                });
                res.json({
                    correct :false,
                    nextquiz : quizIndex
                });
            });
        }
      });
    });
    // }
  },
  '5050': function (req,res,next) {
    var playerId = _.clone(req.session.Player.id);
    var roomId =  _.clone(req.session.Player.isInRoom);
    var curr_quiz = req.param('curr_quiz');
    Player.findOne(playerId,function(err,player) {
      var supports = player.supports;
      if(err) return next(err);
      if(player.supports.fifty_fifty) {
        Room.findOne(roomId,function(err,room) {
          var adminId = room.managed_by;
          var answers = room.quizPack[curr_quiz].answer;
          var correct_answer = room.quizPack[curr_quiz].correct_answer;
          answers.splice(answers.indexOf(correct_answer),1);
          var first = answers[Math.floor(Math.random()*answers.length)];
          answers.splice(answers.indexOf(first),1);
          var second = answers[Math.floor(Math.random()*answers.length)];
          req.session.Player.supports = {
              fifty_fifty: false,
              audience :supports.audience,
              relative : supports.relative
            }
          Player.update(playerId,{
            supports :{
              fifty_fifty: false,
              audience :supports.audience,
              relative : supports.relative
            }
          },function(err) {
                Player.publishUpdate(playerId,{
                  first : first,
                  second : second,
                  action: 'nguoi_choi_chinh_su_dung_quyen_50_50'
                });
                Admin.publishUpdate(adminId,{
                  first : first,
                  second : second,
                  action: 'nguoi_choi_chinh_su_dung_quyen_50_50'
                });
                res.json({
                    ok : true,
                    msg: 'Đợi tí'
                });
          });
        });
      }
      else {
        res.json({
          ok : false,
          msg: 'Bạn đã sử dụng xong quyền trợ giúp 50:50'
        })
      }
    });
  },
  audience_support:function(req,res,next) {
    var playerId = _.clone(req.session.Player.id);
    var roomId =  _.clone(req.session.Player.isInRoom);
    var curr_quiz = req.param('curr_quiz');
    Player.findOne(playerId,function(err,player) {
      var supports = player.supports;
      if(err) return next(err);
      if(player.supports.audience) {
        Room.findOne(roomId,function(err,room) {
          var adminId = room.managed_by;
          var answers = room.quizPack[curr_quiz].answer;
          var correct_answer = room.quizPack[curr_quiz].correct_answer;
          var level = room.quizPack[curr_quiz].level;
          // answers.splice(answers.indexOf(correct_answer),1);
          // var first = answers[Math.floor(Math.random()*answers.length)];
          // answers.splice(answers.indexOf(first),1);
          // var second = answers[Math.floor(Math.random()*answers.length)];
          var total = 100;
          answers.splice(answers.indexOf(correct_answer),1);
          var first = answers[0];
          var second = answers[1];
          var third = answers[2];
          var correct_percent ;
          if(level === 'easy') {
            var correct_percent = getRandomInt(70,90);
          } else if(level === 'medium') {
            var correct_percent = getRandomInt(50,69);
          } else {
            var correct_percent = getRandomInt(20,49);
          }
            var first_correct = getRandomInt(0,total - correct_percent);
            var second_correct = getRandomInt(0,total - correct_percent - first_correct);
            var third_correct = total - correct_percent - first_correct - second_correct;
            var percentageArr = [
              {
                answer : correct_answer,
                percentage : correct_percent
              },
              {
                answer : first,
                percentage : first_correct
              },
              {
                answer : second,
                percentage : second_correct
              },
              {
                answer : third,
                percentage: third_correct
              }
            ]
            console.log(percentageArr);
          req.session.Player.supports = {
              audience: false,
              fifty_fifty :supports.fifty_fifty,
              relative : supports.relative
            }
          Player.update(playerId,{
            supports :{
              audience: false,
              fifty_fifty :supports.fifty_fifty,
              relative : supports.relative
            }
          },function(err) {
                Player.publishUpdate(playerId,{
                  percentageArr: percentageArr,
                  action: 'nguoi_choi_chinh_nho_khan_gia'
                });
                Admin.publishUpdate(adminId,{
                  percentageArr: percentageArr,
                  action: 'nguoi_choi_chinh_nho_khan_gia'
                });
                res.json({
                    ok : true,
                    msg: 'Đợi tí'
                });
          });
        });
      }
      else {
        res.json({
          ok : false,
          msg: 'Bạn đã sử dụng xong quyền trợ giúp nhờ khán giả'
        })
      }
    });
  },
  audience_survey: function(req,res,next) {
    var playerId = req.session.Player.id;
    var curr_quiz = req.param('curr_quiz');
    Player.findOne(playerId,function(err,player){
      if(err) return next(err);
      if(player) {
        if(player.supports.audience) {
          var roomId = player.isInRoom;
          player.supports.audience = false;
          player.save(function(err){
            Room.findOne(roomId,function(err,room) {
                if(err) return next(err);
                if(room.players.length < 2) {
                    res.json({
                        ok:false,
                        msg: 'Bạn là người chưa duy nhất trong phòng,nên sẽ không có khán giả để khảo sát, vui lòng chọn tùy chọn random'
                    });
                    return
                }
                Player.publishUpdate(playerId,{
                  action: 'yeu_cau_khan_gia_khao_sat'
                });
                var adminId = room.managed_by;
                var _timer = null;
                Room.update(roomId,{
                  audience_survey_time: 32
                },function(err) {
                  if(err) return next(err);
                  res.json({
                            ok:true,
                            msg: 'Yêu cầu khảo sát của bạn đã được gửi tới khán giả trong phòng.'
                          });
                    // console.log(room)
                    _timer = setInterval(function() {
                      Room.findOne(room.id,function(err,room) {
                        if(room) {
                          // console.log('@@',room);

                          if(room.audience_survey_time > 0) {
                            room.audience_survey_time--;
                            room.save(function(err){
                              Player.publishUpdate(playerId,{
                                audience_survey_time: room.audience_survey_time,
                                action:'tgian_cho_khan_gia_khao_sat'
                              });
                              // Admin.publishUpdate(adminId,{
                              //   audience_survey_time : room.audience_survey_time,
                              //   action: 'tgian_cho_khan_gia_khao_sat'
                              // });
                            });

                          } else {
                            // room.audience_survey_time = 0;
                            // Collect audience result
                            var adminId = room.managed_by;

                            var answers = room.quizPack[curr_quiz].answer;
                            var audienceCount = room.players.length - 1;
                            var ansCountArr = [0,0,0,0];
                            var percentageArr = [0,0,0,0];

                            Player.find().where({state:'khan_gia'}).exec(function(err,players){
                                  if(players.length > 0) {
                                    for (var i = players.length - 1; i >= 0; i--) {
                                      for (var j = answers.length - 1; j >= 0; j--) {
                                        if(answers[j] == players[i].audience_survey_result) {
                                          ansCountArr[j]++;
                                          console.log(ansCountArr);
                                          break;
                                        }
                                      }
                                    };
                                      console.log('answers survey:',ansCountArr);
                                      for (var i = ansCountArr.length - 1; i >= 0; i--) {
                                            percentageArr[i] = Math.floor((ansCountArr[i] / audienceCount ) * 100);
                                      };

                                      console.log('percentageArr:',percentageArr);
                                      Player.publishUpdate(playerId,{
                                      curr_answers: answers,
                                      percentageArr : percentageArr,
                                      action:'ket_qua_khao_sat_tu_khan_gia'
                                    });



                                  }
                                });

                            clearInterval(_timer);





                          }
                        }
                      });
                    },1000);

                });
            })
          });
        } else {
          res.json({
            ok : false,
            msg: 'Bạn đã sử dụng xong quyền trợ giúp nhờ khán giả'
          })
        }
      }
    });
  },
  audience_survey_submit : function(req,res,next) {
    var playerId = req.session.Player.id;
    Player.findOne(playerId,function(err,player) {
      if(err) return next(player);
      if(player) {
        var roomId = player.isInRoom;
        Room.findOne(roomId,function(err,room) {
          if(err) return next(err);
          if(room) {
            if(room.audience_survey_time > 0) {
              var ans = req.param('ans') || '';
              Player.update(playerId,{
                audience_survey_result : ans,
              },function(err,player) {
                if(err) return next(err);
                if(player) {
                  res.json({
                    ok: true,
                    msg: 'Câu trả lời của bạn đã được gửi.'
                  })
                }
              })
            } else {
              res.json({
                ok:false,
                msg:'Bạn đã hết thời gian trả lời câu hỏi khảo sát cho người chơi chính.'
              })
            }
          }
        });
      }
    });
  },
  scoreboard:function(req,res,next) {
    var playerId = req.session.Player.id;
    Player.findOne(playerId,function(err,player) {
      if(err) return next(err);
      if(player) {
        player.score_history.sort(function(a, b){return b.max_quiz-a.max_quiz});
        res.view({
          thisPlayer:player,
          scoreboard: player.score_history
        });
      }
    });
  },
  relative: function(req,res,next){
    var playerId = _.clone(req.session.Player.id);
    var roomId =  _.clone(req.session.Player.isInRoom);
    var curr_quiz = req.param('curr_quiz');
    Player.findOne(playerId,function(err,player) {
      var supports = player.supports;
      if(err) return next(err);
      if(player.supports.relative) {
           res.json({
                          ok : true,
                          msg: 'Bạn vui lời chờ trong thời gian 30 giây để nhận câu trả lời từ người thân'
                      });
          // answers.splice(answers.indexOf(correct_answer),1);
          // var first = answers[Math.floor(Math.random()*answers.length)];
          // answers.splice(answers.indexOf(first),1);
          // var second = answers[Math.floor(Math.random()*answers.length)];
          var _timer = null;
          Room.update(roomId,
          {
            relative_support_time: 32
          },function(err,room) {

          _timer = setInterval(function() {
          Room.findOne(roomId,function(err,room) {
            if(room.relative_support_time > 0 ) {
                room.relative_support_time--;
                room.save(function(err){
                  Player.publishUpdate(playerId,{
                    relative_support_time: room.relative_support_time,
                    action:'tgian_nho_nguoi_than'
                  })
                });
              } else {
                room.relative_support_time = 0;
                var adminId = room.managed_by;
                var answers = room.quizPack[curr_quiz].answer;
                // var correct_answer = room.quizPack[curr_quiz].correct_answer;
                // var level = room.quizPack[curr_quiz].level;
                var relative_answer = answers[getRandomInt(0,3)];
                clearInterval(_timer);
                Player.update(playerId,{
                  supports :{
                    relative: false,
                    fifty_fifty :supports.fifty_fifty,
                    audience : supports.audience
                  }
                },function(err) {
                      Player.publishUpdate(playerId,{
                        relative_answer: relative_answer,
                        action: 'kq_nguoi_choi_chinh_nho_nguoi_than'
                      });
                      Admin.publishUpdate(adminId,{
                        relative_answer: relative_answer,
                        action: 'kq_nguoi_choi_chinh_nho_nguoi_than'
                      });

                });
              }
            });

          },1000);
        });
      }
      else {
        res.json({
          ok : false,
          msg: 'Bạn đã sử dụng xong quyền trợ giúp từ người thân'
        })
      }
    });
  },
  quit: function(req,res) {

      var playerId = req.session.Player.id ;
      var roomId = req.session.Player.isInRoom;
      var curr_quiz = req.param('curr_quiz');
      var playerName = req.session.Player.name;
      Player.findOne(playerId,function(err,player) {
        if(err) return next(err);
        var quizIndex = player.curr_quiz;
        player.state = 'nguoi_choi_chinh_dung_cuoc_choi';
        player.curr_quiz = curr_quiz;
        player.point = getPrize(curr_quiz);
        player.save(function(err) {
          Player.publishUpdate(playerId,{
            prize : getPrize(curr_quiz),
            action: 'nguoi_choi_chinh_dung_cuoc_choi'
          });
          // Admin.publishUpdate(playerId,{
          //   prize : getPrize(curr_quiz),
          //   action: 'nguoi_choi_chinh_dung_cuoc_choi'
          // });

         var obj = {
                    name : playerName,
                    date : new Date(),
                    point : getPrize(quizIndex),
                    max_quiz : quizIndex + 1
                }
          Player.update({isInRoom:roomId},{
                  state: '',
                  playing: false,
                  audience_survey_result: '',

                  curr_quiz:0,
                  isReady : false,
                  point : ""
                },function(err,players) {
                  if(!err)
                    {
                    players.forEach(function(player) {
                      player.score_history.push(obj);
                      player.save(function(err){});
                    });
                    console.log('Success: '+players);
                    }
          });
          res.json({
            ok : true,
            msg: 'Bạn sẽ ra về với số tiền thưởng là '+getPrize(curr_quiz)
          });
          return;
        })
      });
      res.json({
        ok: false,
        msg: '403'
      })
  },
  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to PlayerController)
   */
  _config: {}


};


var pointFromQuizIndex = function(quizIndex) {
    switch(quizIndex) {
    case 0 : return '200,000';
    case 1 : return '400,000';
    case 2 : return '600,000';
    case 3 : return '1,000,000';
    case 4 : return '2,000,000';
    case 5 : return '3,000,000';
    case 6 : return '6,000,000';
    case 7 : return '10,000,000';
    case 8 : return '14,000,000';
    case  9 : return '22,000,000';
    case  10 : return '30,000,000';
    case  11 : return '40,000,000';
    case  12 : return '60,000,000';
    case  13 : return '85,000,000';
    case  14 : return '150,000,000';
    default : return '200,000';
    }
}
var getPrize = function(quizIndex) {
    if(quizIndex < 5) return '200,000';
    if(quizIndex >=5 && quizIndex < 10) return pointFromQuizIndex(4);
    if(quizIndex >=10 && quizIndex < 14) return pointFromQuizIndex(9);
    if(quizIndex == 14) return pointFromQuizIndex(14);

}
/**
 * Returns a random integer between min (inclusive) and max (inclusive)
 * Using Math.round() will give you a non-uniform distribution!
 */
var getRandomInt = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
