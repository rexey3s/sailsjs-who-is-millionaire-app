	$(document).ready(function(){


				/*
				*	admin login
				*/
				$('#admin-power').click(function(){
					$('#player-list-wrapper').removeClass('hide');
					$('.function-btns-wrapper').removeClass('hide');
					$('#admin-login').addClass('hide');
				})

				/*
				*	start choosing main player
				*/
				$('.start-choosing-main-player').click(function(){
					$('.player-main-list').addClass('hide');
					$('.main-player-wrapper').addClass('hide');
					$('.main-player-chosen-wrapper').removeClass('hide');
					$('.qa-wrapper-admin').addClass('hide');

				})

				/*
				*	show player main list
				*/
				$('.function-btn.show-player-main-list').click(function(){
					$('.player-main-list').removeClass('hide');
					$('.main-player-chosen-wrapper').addClass('hide');
					$('.main-player-wrapper').addClass('hide');
					$('.qa-wrapper-admin').addClass('hide');
				})
				//
				$('.start-the-game').click(function() {
					$('.main-player-wrapper').removeClass('hide');
					$('.main-player-chosen-wrapper').addClass('hide');
					$('.player-main-list').addClass('hide');
					$('.qa-wrapper-admin').addClass('hide');

				});
				$('.main-player-watch').click(function() {
					$('.qa-wrapper-admin').removeClass('hide');
					$('.main-player-chosen-wrapper').addClass('hide');
					$('.player-main-list').addClass('hide');
					$('.main-player-wrapper').addClass('hide');

				});
				 $('.scoreboard').click(function(e) {
                  if($('#scoreboard').hasClass('hide')) {
                    $('#scoreboard').removeClass('hide');
                  } else {
                    $('#scoreboard').addClass('hide');
                  }
          });
			});
