$(document).ready(function()  {

        var page = document.location.pathname;

        page = page.replace(/(\/)$/, '');
        switch(page) {
        case '/': $('#welcome-sound')[1].play();
        case '/player/room':  $('#logout-icon').click(function() {
                window.location = "/player/logout";
            });
          break;
				 case '/player/start1quiz': $(window).keypress(function(e)  {
            switch(e.keyCode){
      						case 49: {
      							choose_sery_answer($('.series-ans.ans-1'));
      						};break;
      						case 50: {
      							choose_sery_answer($('.series-ans.ans-2'));
      						};break;
      						case 51: {
      							choose_sery_answer($('.series-ans.ans-3'));
      						};break;
      						case 52: {
      							choose_sery_answer($('.series-ans.ans-4'));
      						};break;
      						case 32: {
      							clear_all_answer();
      						}
  					   }
				    });
            $('.series-ans').click(function(){
              choose_sery_answer($(this));
            });
            $('.question-holder').popover({
              animation : true,
              placement : 'top',
              trigger : 'hover',
              content : 'Chọn các câu trả lời theo thứ tự bạn cho là đúng nhất'
            });
              break;
         case '/player/showroom' :
            $('#welcome-sound')[0].play();
            bootbox.alert('Bạn cần nhấn sẵn sàng để MC bắt đầu câu hỏi chọn người chơi chính!');
            /**
             *  Nút sẵn sàng
             */
            $('.ready-btn').click(function(e) {
                e.preventDefault();
                $.ajax({
                  url: '/player/ready',
                  type: 'post'
                  });
            }).popover({
              animation : true,
              placement : 'bottom',
              trigger : 'hover',
              content : 'Click để chuyển trạng thái sẵn sàng,chưa sẵn sàng, nếu bạn chưa sẵn sàng bạn sẽ không được chuyển tới câu hỏi chọn người chơi chính'
           });

            $('#logout-icon').click(function() {
                window.location = "/player/logout";
            });
            break;
         case '/room/show':
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
            $('.advertise').click(function(e) {
              e.preventDefault();
            bootbox.confirm('Xác nhận',function(confirm) {
                if(confirm == true) {
                  $.ajax({
                    url : '/admin/ads',
                    type : 'GET'
                  }).done(function(res) {
                    bootbox.alert(res.msg);
                  }).fail(function(err) {
                    console.log(err);
                  });
                }
              });
            });
            $('#logout-icon').click(function() {
                window.location = "/admin/logout";
              }
            );
            break;
         case '/player/audience' :
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
              if($('#audience_survey_time').val() > 0) {
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
                                                  bootbox.alert('Lỗi:' +res.msg);
                                                }
                                            }
                                        });
                                  }
                            });
                    });

              } else {
                $('.series-ans').unbind('click');
              }

         break;
         case '/player/mainplayer':
            // $('#welcome-sound')[1].play();
            $('#playing-sound')[0].play();

            $('#logout-icon').remove();
            $('#player-power').popover({
              animation : true,
              placement : 'bottom',
              trigger : 'hover',
              content : 'Click để bắt đầu'
            });
            $('#player-power').click(function(e){

              $('#player-power').popover('destroy');
              $(this).remove();
              $('#qa-wrapper').removeClass('hide');
              $('#header').removeClass('hide');
            });
            $('.series-ans').bind('click',function(e){
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

            break;

};
				/*
				*	clear all answer
				*/
				function clear_all_answer(){
					$('.series-ans').removeClass('chosen-ans').attr('data-order','').find('.order').html('');
					cur_order = 1;
				}


        /*
        * selecting main player question
        */
        var cur_order = 1;
        var sery_ans = [null,null,null,null,null];
				function choose_sery_answer(target)
				{
					if (cur_order < 4)
					{
						// add answer to array
						sery_ans[cur_order] = target.attr('data-ansNum');
						// handle answer element
						target.addClass('chosen-ans').attr('data-order',cur_order).find('.order').html(cur_order);
						cur_order++;
						target.unbind('click').click(function(){
							remove_chosen_answer($(this));
						});
						// console.log(sery_ans);
            if(cur_order == 4) {
                var realAns =   $('div[data-ansNum='+sery_ans[1]+']').attr('data-value') + " "
                              + $('div[data-ansNum='+sery_ans[2]+']').attr('data-value') + " "
                              + $('div[data-ansNum='+sery_ans[3]+']').attr('data-value') + " "
                              + $('.series-ans').not($('.chosen-ans')).attr('data-value') ;
                bootbox.confirm('"'+realAns+'" là câu trả lời cuối cùng của bạn không ?',function(confirmed) {
                    var serverTime = $('#my-player-time').val();
                    if(confirmed == true) {
                        $.ajax({
                          url : '/player/first_quiz_submit',
                          data : { ans : realAns , time: parseInt($('#clock').html())},
                          type : 'POST'
                        }).done(function(res) {
                          $('.series-ans').unbind('click');
                          if(res.ok) {
                            if(res.correct)
                            bootbox.alert(res.msg);
                            else
                            bootbox.alert(res.msg);
                          }else
                          bootbox.alert(res.msg);
                       })
                    }
                });

            }
					}
				}
				// remove a chosen answer
				function remove_chosen_answer(target)
				{

					var target_order = parseInt(target.attr('data-order'));
					target.removeClass('chosen-ans').attr('data-order','').find('.order').html('');

					if (target_order != 4)
						for (i = target_order; i<4; i++)
						{
							sery_ans[i] = sery_ans[i+1];
						}
					sery_ans[4] = null;
					for (var j = 1; j < 4; j++)
					{
						if (sery_ans[j] != null)
						{
							console.log(j);
							$('.series-ans.ans-'+sery_ans[j]+'.chosen-ans').attr('data-order',j).find('.order').html(j);
						}
					}

					cur_order--;
					console.log(sery_ans);

					target.unbind('click').click(function(){
						choose_sery_answer($(this));
					})
				}




			// 	/*
			// 	*	clock handle
			// 	*/
			// 	var clock_timer = null;
			// 	var clock_time = 0;
			// 	function clock_start(max){
			// 		clock_time = max;
			// 		$('#clock').html(clock_time);
			// 		clock_timer = setInterval(countdown,1000);
			// 	}
			// 	function countdown(){
			// 		if (clock_time > 0)
			// 		{
			// 			clock_time--;
			// 			$('#clock').html(clock_time);
			// 		}
			// 		else
			// 		{
			// 			stop_clock();
			// 		}
			// 	}
			// 	function stop_clock(){
			// 		clock_time = 0;
			// 		clearInterval(clock_timer);
			// 	}

			// 	clock_start(60);

});
