/**
 * app.js
 *
 * This file contains some conventional defaults for working with Socket.io + Sails.
 * It is designed to get you up and running fast, but is by no means anything special.
 *
 * Feel free to change none, some, or ALL of this file to fit your needs!
 */
(function (io) {

  // as soon as this file is loaded, connect automatically,
  var socket = io.connect();
  if (typeof console !== 'undefined') {
    log('Connecting to Sails.js...');
  }

  socket.on('connect', function socketConnected() {
    console.log("This is from the connect: ",this.socket.sessionid);
    // Listen for Comet messages from Sails
    socket.on('message',cometMessageReceivedFromServer)

    socket.get('/player/subscribe');
    socket.get('/admin/subscribe');
    ///////////////////////////////////////////////////////////
    // Here's where you'll want to add any custom logic for
    // when the browser establishes its socket connection to
    // the Sails.js server.
    ///////////////////////////////////////////////////////////
    log(
        'Socket is now connected and globally accessible as `socket`.\n' +
        'e.g. to send a GET request to Sails, try \n' +
        '`socket.get("/", function (response) ' +
        '{ console.log(response); })`'
    );
    ///////////////////////////////////////////////////////////


  });


  // Expose connected `socket` instance globally so that it's easy
  // to experiment with from the browser console while prototyping.
  window.socket = socket;


  // Simple log function to keep the example simple
  function log () {
    if (typeof console !== 'undefined') {
      console.log.apply(console, arguments);
    }
  }


})(

  // In case you're wrapping socket.io to prevent pollution of the global namespace,
  // you can replace `window.io` with your own `io` here:
  window.io

);
function cometMessageReceivedFromServer(message) {
      console.log('New comet message received :: ', message);
      if (message.model === 'player' || message.model === 'admin') {
        var playerId = message.id
        updateDomForPlayer(playerId, message);
      }
}
function updateDomForPlayer(playerId, message) {
  // What page am I on?
  var page = document.location.pathname;

  // Strip trailing slash if we've got one
  page = page.replace(/(\/)$/, '');
  // alert(page);
  switch (page) {

    // If we're on the User Administration Page (a.k.a. user index)
    case '/player/showroom':

      // This is a message coming from publishUpdate
      if (message.verb === 'update') {
        switch (message.data.action) {
          case 'change_ready_state' :playerFunc.changeReadyState(message);break;
          case 'player_join' : playerFunc.addPlayer(message);break;
          case 'player_left' : playerFunc.removePlayer(message);break;
          case 'chon_nguoi_choi_chinh': playerFunc.start1quiz(message.id);break;
         case 'admin_delete_room' : playerFunc.roomDeleted(message);break;

        }
      }
      // This is a message coming from publishCreate
      if(message.verb === 'create') {
      }
      // This is a message coming publishDestroy
      if(message.verb === 'destroy') {
      }
      break;
    case '/room/show':
      if(message.verb === 'update') {
        switch (message.data.action) {
            case 'change_ready_state' :playerFunc.changeReadyState(message);break;
            case 'player_join' :playerFunc.addPlayer(message);break;
            case 'player_left' : playerFunc.removePlayer(message);break;
            case 'chon_nguoi_choi_chinh' : $('#first-quiz-result').html("");break;
            case 'kq_chon_nguoi_choi_chinh' :playerFunc.chosenMainPlayer(message);break;
            case 'chua_chon_dc_nguoi_choi_chinh': $('.choose-main').removeClass('disabled');$('.choose-main').click(function(e) {
              $(this).addClass('disabled');
              $(this).unbind('click');
                e.preventDefault();
                $.ajax({
                  url: '/admin/start1quiz',
                  type: 'get'
                });

            }); bootbox.alert('Chưa có người chơi nào trả lời đúng câu hỏi lựa chọn,MC sử dụng câu hỏi kế tiếp!');break;
            case 'thoi_gian_cho_nguoi_choi_chinh': roomFunc.waiting_for_main(message);break;
            case 'co_1_nguoi_tra_loi' : roomFunc.addCorrectPlayer(message);break;
            case 'nguoi_choi_chinh_tra_loi_dung' : roomFunc.updateMainPlayer(message);break;
            case 'nguoi_choi_chinh_tra_loi_sai' : roomFunc.updateMainPlayer(message);break;
            case 'nguoi_choi_chinh_su_dung_quyen_50_50': bootbox.alert('Người chơi chính sử dụng trợ giúp 50/50');break;
            case 'nguoi_choi_chinh_nho_khan_gia': bootbox.alert('Người chơi chính sử dụng trợ giúp nhờ khảo sát từ khán giả');break;
            case 'kq_nguoi_choi_chinh_nho_nguoi_than':bootbox.alert('Người chơi chính sử dụng trợ giúp liên lạc với người thân');break;
            case 'nguoi_choi_chinh_chien_thang': bootbox.alert('Người chơi chính chiến thắng');updateMainPlayer(message);break;
            case 'nguoi_choi_chinh_dung_cuoc_choi' : bootbox.alert('Người chơi chính dừng cuộc chơi và ra về với giải thưởng là '+message.data.prize);break;

            // case 'chon_nguoi_choi_chinh': playerFunc.start1quiz();break;
        }
      }



      // This is a message coming from publishCreate
      if(message.verb === 'create') {
      }
      // This is a message coming publishDestroy
      if(message.verb === 'destroy') {
      }
      break;
    case '/player/start1quiz' :
      switch(message.data.action) {
          case 'chon_nguoi_choi_chinh' : playerFunc.restart1quiz(message.id);break;
          case 'kq_chon_nguoi_choi_chinh': playerFunc.goTo(message);break;
          case 'thoi_gian_cho_nguoi_choi_chinh': roomFunc.waiting_for_main(message);break;
         case 'admin_delete_room' : playerFunc.roomDeleted(message);break;


      }
    break;
    case '/player/mainplayer' :
    switch(message.data.action) {
        case 'nguoi_choi_chinh_tra_loi_dung': playerFunc.nextQuiz(message);break;
        case 'nguoi_choi_chinh_tra_loi_sai' : playerFunc.stopQuiz(message);break;
        case 'nguoi_choi_chinh_su_dung_quyen_50_50': playerFunc.support_fifty(message);break;
        case 'nguoi_choi_chinh_nho_khan_gia' : playerFunc.support_audience(message);break;
        case 'tgian_nho_nguoi_than': playerFunc.wait_relative(message);break;
        case 'kq_nguoi_choi_chinh_nho_nguoi_than':playerFunc.relative_support(message); break;
        case 'nguoi_choi_chinh_chien_thang': bootbox.alert('Chúc mừng bạn đã dành chiến thằng sau 15 câu hỏi bạn sẽ ra về với giải thưởng '+message.data.prize+' VND',function(){window.location="/player/scoreboard";});break;
        case 'nguoi_choi_chinh_dung_cuoc_choi' : bootbox.alert('Người chơi chính dừng cuộc chơi và ra về với giải thưởng là '+message.data.prize,function(){window.location="/player/scoreboard";});break;
        case 'quang_cao': ads();break;
         case 'admin_delete_room' : playerFunc.roomDeleted(message);break;
         case 'tgian_cho_khan_gia_khao_sat': roomFunc.wait_for_audience(message);break;
         case 'ket_qua_khao_sat_tu_khan_gia': playerFunc.audienceResult(message);break;
    }
    break;
    case '/player/audience' :
    switch(message.data.action){
        case 'nguoi_choi_chinh_tra_loi_dung': audienceFunc.nextQuiz(message);break;
        case 'nguoi_choi_chinh_tra_loi_sai' : audienceFunc.stopQuiz(message);break;
        case 'nguoi_choi_chinh_su_dung_quyen_50_50': playerFunc.support_fifty(message);break;
        case 'nguoi_choi_chinh_nho_khan_gia' : playerFunc.support_audience(message);break;

        // case 'tgian_nho_nguoi_than': playerFunc.wait_relative(message);break;
        case 'nguoi_choi_chinh_chien_thang': bootbox.alert('Người chơi chính chiến thắng',function(){window.location="/player/scoreboard";});break;
        case 'nguoi_choi_chinh_dung_cuoc_choi' : bootbox.alert('Người chơi chính dừng cuộc chơi và ra về với giải thưởng là '+message.data.prize,function(){window.location="/player/scoreboard";});break;
        case 'yeu_cau_khan_gia_khao_sat' : audienceFunc.enableAnswer(message);break;
        case 'quang_cao': ads();break;
         case 'admin_delete_room' : playerFunc.roomDeleted(message);break;
         case 'tgian_cho_khan_gia_khao_sat': roomFunc.wait_for_audience(message);break;
         case 'ket_qua_khao_sat_tu_khan_gia': playerFunc.audienceResult(message);break;


    }
  }
}
var ads = function() {
  var obj = {
    _csrf: window.mordor.csrf || ''
    };
  // $('#result-wrapper').after(JST['assets/linker/templates/ads.ejs'](obj));
  // show_ads('<video width="720" height="405" autoplay><source src="//sounds/cocacola-advertise.mp4" type="video/mp4">your browser does not support the video tag.</video>',720,405);
  show_ads('<iframe width="640" height="360" src="//www.youtube.com/embed/xbwKPSbL0jw" frameborder="0" allowfullscreen></iframe>',720,405);

  window.setTimeout("hide_ads()",30000);

  // bootbox.alert('<iframe width="420" height="315" src="//www.youtube.com/embed/IJZqR-uS5B0" frameborder="0" allowfullscreen></iframe>');
  // window.setTimeout("hide_ads()",30000);
}

    //hide_ads();
var playerFunc = {
  /**
   *  Đổi trạng thái ss của player
   */
  changeReadyState: function(message) {
    var $ready = $('div[data-id="' + message.data.playerId + '"] .status');
    var $name = $('div[data-id="' + message.data.playerId + '"] .name');
    if(message.data.isReady) {
      $ready.attr('class','status green').html('Sẵn sàng');
      } else {
      $ready.attr('class','status red').html('Chưa sẵn sàng');
    }
    $('#noti-sounds')[0].play();
  },
  /**
   * Thêm icon player mới khi người đó vào phòng
   */
  addPlayer : function(message) {
    var obj = {
              player: message.data.player,
              _csrf: window.mordor.csrf || ''
    };
    if($('#joined-list').children().length == 0) {
       $('#joined-list').append(JST['assets/linker/templates/addPlayer.ejs'](obj));
    } else {
      $('#joined-list li:last-child').after(JST['assets/linker/templates/addPlayer.ejs'](obj));
    }
    if(!$('.choose-main').length) {
      // alert('asd');
      $('.main-player-chosen-wrapper  .function-btns-wrapper').prepend('<div class="function-btn choose-main">Bắt đầu chọn</div>');
      $('.choose-main').click(function(e) {
              bootbox.confirm('Bạn có muốn bắt đầu chọn người chơi chính',function(confirm) {
                if(confirm == true) {
                $('.choose-main').addClass('disabled');
                $('.choose-main').unbind('click');
                  e.preventDefault();
                  $.ajax({
                    url: '/admin/start1quiz',
                    type: 'get'
                  });
                }
              });
            });
    }
    $('h2').html('<center>Phòng: <b>'+$('#player-list-wrapper').attr('data-room')+'</b> | Số người tham gia: <b>'+$('#joined-list').children().length+'</b></center>');
    // var h ='<h2 class=".player-num alert alert-success"></h2>';
  },
  /**
   * Xóa icon player khi người đó rời phòng
   */
  removePlayer: function(message) {
    $('#joined-list li[data-id="' + message.data.playerId + '"]').remove();
    $('h2').html('<center>Phòng: <b>'+$('#player-list-wrapper').attr('data-room')+'</b> | Số người tham gia: <b>'+$('#joined-list').children().length+'</b></center>');
  },
  start1quiz:function(playerId) {
        var clock_timer = null;
        var clock_time = 0;
        function clock_start(max){
          clock_time = max;
          $('#clock').html(clock_time);
          clock_timer = setInterval(countdown,1000);
        }
        function countdown(){
          if (clock_time > 0)
          {
            clock_time--;
            $('#clock').html(clock_time);
          }
          else
          {
            stop_clock();
          }
        }
        function stop_clock(){
          clock_time = 0;
          clearInterval(clock_timer);
          window.location = '/player/start1quiz';
        }
      if($('#thisPlayer').val() == playerId) {
      $('#supports').after('<div id="clock"></div>');
      clock_start(4);
      }
  },
  restart1quiz:function(playerId) {
      $('#clock').remove();
      bootbox.alert('Chưa ai trả lời đúng, các bạn sẽ trả lời thêm 1 câu hỏi nữa!');
      if(window.top == window) {
        window.setTimeout('location.reload()',2000);
      }
  },
  chosenMainPlayer:function(message) {
      var obj = {
        player: message.data.mainPlayer,
        _csrf: window.mordor.csrf || ''
      };
      var obq = {
        quizOrder : message.data.curr_quiz,
        quiz: message.data.nextquiz,
        _csrf: window.mordor.csrf || ''
      };
      $('#first-quiz-result li[data-id="' + message.data.playerId + '"]').addClass('active');
      $('#first-quiz-result li[data-id="' + message.data.playerId + '"] .position').html('Người chơi chính');
      $('.choose-main').after('<div class="function-btn advertise">Quảng cáo</div>');
      $('.choose-main').remove();
      $('.advertise').click(function(e) {
              e.preventDefault();
            bootbox.confirm('Xác nhận',function(confirm) {
                if(confirm == true) {
                  $.ajax({
                    url : '/admin/ads',
                    type : 'GET'
                  }).done(function(res) {
                    console.log(res);
                  }).fail(function(err) {
                    console.log(err);
                  });
                }
              });
            });
      // $('#main-player-history').children().remove();
      // $('#main-player-history').append(JST['assets/linker/templates/updateMain.ejs'](obj));
      // $('#qa-wrapper').remove();
      // $('.qa-wrapper-admin').append(JST['assets/linker/templates/addQuiz.ejs'](obq));
  },
  goTo:function(message) {
      if($('#thisPlayer').val() == message.id) {
        if(message.data.path == '/player/audience') {
          $('#player-list-wrapper h2').after('<div class="alert alert-info">Người chơi tên '+message.data.playerName+' đã trở thành người chơi chính, bạn sẽ được chuyển tới trang khán giả trong ít giây nữa!</div>');
          window.setTimeout('window.location="/player/audience"',3000);

        } else if(message.data.path == '/player/mainplayer') {
          $('#player-list-wrapper h2').after('<div class="alert alert-info">Chúc mừng bạn đã trở thành người chơi chính, bạn sẽ được chuyển tới ghế nóng trong ít giây nữa</div>');
          window.setTimeout('window.location="/player/mainplayer"',3000);
        }

      }
  },
  nextQuiz: function(message) {
      if(message.data.supports.fifty_fifty == false) {
        $('#5050').addClass('disable');
      }
      if(message.data.supports.audience == false) {
        $('#audience-support').addClass('disable');
      }
      if(message.data.supports.relative == false) {
        $('#relative-support').addClass('disable');
      }
      $('#qa-wrapper').remove();
      var obj = {
        quizOrder : message.data.curr_quiz,
        quiz: message.data.nextquiz,
        _csrf: window.mordor.csrf || ''
      };

      bootbox.alert('Chúc mừng đã trả lời đúng câu hỏi thứ '+ obj.quizOrder+" ,mời bạn trả lời câu hỏi kế tiếp");
      $('#player-regis-wrapper').after(JST['assets/linker/templates/addQuiz.ejs'](obj));
      $('.series-ans').click(function(e){
              e.preventDefault();
              // alert($(this).attr('data-value'));
              var ans= $(this).attr('data-value');
                bootbox.confirm('"'+ans+'" là câu trả lời cuối cùng của bạn không ?',function(confirmed) {
                  if(confirmed == true) {

                    $.ajax({
                            url :'/player/nextquiz',
                            data: { ans : ans },
                            type : 'POST',
                            error: function(err)  { console.log('ajax lỗi: '+err) },
                            success: function(resp) { console.log(resp) }
                        });

                  }
                });
      });
       $('.money-levels-list').children().each(function(index,value) {
              var curr_quiz = parseInt($('.question-holder').attr('data-value')) + 1;
              $(value).removeClass('active');
              // console.log($(value).children(':first'));
              if($(value).children(':first').html() == curr_quiz) {
                $(value).addClass('active');
              }
              if($(value).children(':first').html() < curr_quiz) {
                $(value).addClass('won');
              }
      });
  },
  stopQuiz: function(message) {
      $('#qa-wrapper').remove();
      bootbox.alert('Bạn sẽ ra về với "'+message.data.prize+'" VNĐ',function() {
        window.location = "/player/scoreboard";
      });
  },
  support_fifty: function(message) {

       $('.series-ans').each(function(index,value){
        if(message.data.first == $(value).attr('data-value')) {
          $(value).css('background-color','#E22514');

        }
        if(message.data.second == $(value).attr('data-value')) {
          $(value).css('background-color','#E22514');

        }
        // if(message.data.player_answer == $(value).attr('data-value')) {
        //   $(value).css('background-color','#E22514');

        // }
      });
  },
  support_audience: function(message) {
    var percentageArr = message.data.percentageArr;

    var labels = [];
    var data = [];
    $.each(percentageArr,function(i,val) {
      $('div[data-value="'+val.answer+'"] .order').html(val.percentage+"%");
      labels.push(val.answer);
      data.push(val.percentage);
    });
    var data = {
      labels : labels,
      datasets : [
        {
          fillColor : "#f7464a",
          strokeColor : "#21323D",
          data : data
        }
      ]
    }
    var bar = new Chart(document.getElementById("barchart").getContext("2d")).Bar(data,{
        barDatasetSpacing : 3
    });
    $('#barchart-modal').modal('show');
  },
  wait_relative: function(message) {
      // $('#supports').after('<div id="clock"></div>');
      $('#clock').html(message.data.relative_support_time);

  },
  relative_support: function(message){
      bootbox.alert('Câu trả lời của người thân của bạn cho câu hỏi này là "'+message.data.relative_answer+'"');
      $('.series-ans').each(function(i,val){
        if($(val).attr('data-value') == message.data.relative_answer) {
            $(val).css('background-color','#5ACE68');
        }
      });
  },
  roomDeleted : function(message) {
    if(message.id == $('#thisPlayer').val()){
         bootbox.alert("MC đã xóa phòng này",function() {window.location = '/player/room';});
                                    window.setTimeout("window.location='/player/room'",500);
    }
  },
  audienceResult: function(message) {
    var percentageArr = message.data.percentageArr;
    var curr_answers = message.data.curr_answers;
    var labels = [];
    var data = [];
    // $.each(percentageArr,function(i,val) {
    //   $('div[data-value="'+val.answer+'"] .order').html(val.percentage+"%");
    //   labels.push(val.answer);
    //   data.push(val.percentage);
    // });
    for (var i = curr_answers.length - 1; i >= 0; i--) {
      $('div[data-value="'+curr_answers[i]+'"] .order').html(percentageArr[i]+'%');
      labels.push(curr_answers[i]);
      data.push(percentageArr[i]);
    };
    var data = {
      labels : labels,
      datasets : [
        {
          fillColor : "#f7464a",
          strokeColor : "#21323D",
          data : data
        }
      ]
    }
    var bar = new Chart(document.getElementById("barchart").getContext("2d")).Bar(data,{
        barDatasetSpacing : 3
    });
    $('#barchart-modal').modal('show');
  }
}

var roomFunc = {

  waiting_for_main: function(message) {
    // if($('#clock')) {
      $('#clock').html(message.data.first_quiz_time);
    // }
    // else {
    // $('#clock').remove();
    // $('#supports').after('<div id="clock">'+message.data.first_quiz_time+'</div>');
    // }
  },
  addCorrectPlayer: function(message) {
    var obj = {
    player: message.data.player,
    _csrf: window.mordor.csrf || ''
    };
    // var $ul = $('ul[class="player-list main-player-chosen"]');
    // console.log($('#first-quiz-result'));
    if($('#first-quiz-result').children().length == 0) {
      $('#first-quiz-result').append(
      JST['assets/linker/templates/addCorrectPlayer.ejs']( obj)

        );
    } else {
      $('#first-quiz-result li:last-child').after(
      // This is the path to the templates file
      JST['assets/linker/templates/addCorrectPlayer.ejs']( obj)
      );
    }
  },
  updateMainPlayer: function(message) {
      if(message.data.action == 'nguoi_choi_chinh_tra_loi_dung') {
       var obj = {
        player: message.data.player,
        _csrf: window.mordor.csrf || ''
      };
      var obq = {
        quizOrder : message.data.curr_quiz,
        quiz: message.data.nextquiz,
        _csrf: window.mordor.csrf || ''
      };
      // $('#first-quiz-result li[data-id="' + message.data.playerId + '"]').addClass('active');
      // $('#first-quiz-result li[data-id="' + message.data.playerId + '"] .position').html('Người chơi chính');
      $('#first-quiz-result li[class="player active"]').remove();
      $('#first-quiz-result').append(JST['assets/linker/templates/updateMain.ejs'](obj));
      // $('#qa-wrapper').remove();
      // $('.qa-wrapper-admin').append(JST['assets/linker/templates/addQuiz.ejs'](obq));
      // $('.waiting-for-main').fadeOut(2000);

      $('#noti-anchor').after('<div class="player-list-wrapper waiting-for-main alert alert-info">Người chơi chính đưa ra câu trả lời là '+message.data.correct_answer+' và đó là một đáp án chính xác</div>');

    } else {
      // $('.waiting-for-main').fadeOut(2000);

      bootbox.alert('Người chơi chính trả lời sai, kết thúc trò chơi');
    }
  },
  wait_for_audience: function(message) {
      $('#clock').html(message.data.audience_survey_time);

  }
}
var audienceFunc = {
    nextQuiz: function(message) {
    if(message.data.supports.fifty_fifty == false) {
        $('#5050').addClass('disable');
      }
      if(message.data.supports.audience == false) {
        $('#audience-support').addClass('disable');
      }
      if(message.data.supports.relative == false) {
        $('#relative-support').addClass('disable');
      }
      $('#qa-wrapper').remove();
      var obj = {
        quizOrder : message.data.curr_quiz,
        quiz: message.data.nextquiz,
        _csrf: window.mordor.csrf || ''
      };

     $('#player-regis-wrapper h2').after('<div class="alert alert-info">Câu trả lời cho câu hỏi vừa rồi là "'+message.data.correct_answer+'"</div>');
     $('.alert-info').fadeOut(5000);
      $('.series-ans').each(function(index,value){
        if(message.data.correct_answer == $(value).attr('data-value')) {
          $(value).css('background-color','#5ACE68');
        }
        // if(message.data.player_answer == $(value).attr('data-value')) {
        //   $(value).css('background-color','#E22514');

        // }
      });
      $('#player-regis-wrapper').after(JST['assets/linker/templates/addQuiz.ejs'](obj));

       $('.money-levels-list').children().each(function(index,value) {
              var curr_quiz = parseInt($('.question-holder').attr('data-value')) + 1;
              $(value).removeClass('active');
              // console.log($(value).children(':first'));
              if($(value).children(':first').html() == curr_quiz) {
                $(value).addClass('active');
              }
              if($(value).children(':first').html() < curr_quiz) {
                $(value).addClass('won');
              }
      });
  },
  stopQuiz: function(message) {
      // $('#qa-wrapper').remove();
      $('.waiting-for-main').fadeOut(2000);

      $('.series-ans').each(function(index,value){
        if(message.data.correct_answer == $(value).attr('data-value')) {
          $(value).css('background-color','#5ACE68');
        }
        if(message.data.player_answer == $(value).attr('data-value')) {
          $(value).css('background-color','#E22514');

        }
      });
       bootbox.alert('Người chơi chính sẽ ra về với "'+message.data.prize+'" VNĐ',function() {
        window.location = "/player/scoreboard";
      });
  },
  enableAnswer: function(message) {
    bootbox.alert('Người chơi chính đã sử dụng quyền nhờ khảo sát từ khán giả, bạn hãy trả lời giúp anh/chị ấy trong thời gian đếm ngược');
    $('.series-ans').bind('click',function() {
              // alert($(this).attr('data-value'));
            var ans= $(this).attr('data-value');
                bootbox.confirm('"'+ans+'" là câu trả lời cuối cùng của bạn không ?',function(confirmed) {
                  if(confirmed == true) {

                    $.ajax({
                            url :'/player/audience_survey_submit',
                            data: { ans : ans },
                            type : 'POST',
                            error: function(err)  { console.log('ajax lỗi: '+err) },
                            success: function(res) {
                                if(res.ok) {
                                  bootbox.alert(res.msg)
                                } else {
                                  bootbox.alert('Lỗi:' +res.msg)
                                }
                            }
                        });
                  }
            });
    });
  }
}

