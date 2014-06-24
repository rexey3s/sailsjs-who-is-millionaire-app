$(document).ready(function(){
    $('#form-signup .player-regis-email').on('blur',function() {
        $('.response').remove();
        var email = $('#form-signup .player-regis-email').val() ;
          var page = document.location.pathname;
          page = page.replace(/(\/)$/, '');
        var url;
        if(page == '/admin/new') {
            url = '/admin/check_email';
        } else {
            url = '/player/check_email';
        }
        var request = $.ajax({
                        url: url,
                        type: "GET",
                        data: {email : email},
                        dataType: "json"
                    });
            request.done(function(resp) {
                    if(resp.ok) {
                        //Add the success message text into the alert
                        // $('#form-signup .player-regis-email').after("<div class='response badge alert-success'>"+resp.msg+"</div>").fadeIn();
                        $('input[name=email]').removeClass('err');
                        $('input[name=email]').addClass('success');
                    }
                    else {
                        $('input[name=email]').removeClass('success');

                        $('input[name=email]').addClass('err');
                        bootbox.alert('Lỗi: '+resp.msg);
                        // $('#form-signup .player-regis-email').after("<div class='response badge alert-error'>"+resp.msg+"</div>").fadeIn();
                    }})
            .fail(function(jqXHR, textStatus) {
                console.log(textStatus);
            });

    })  ;
    // $('.form-signup #confirmation').on('blur',function()
    //     {
    //         $(".pwd-error").remove();
    //         var confirm = $('.form-signup #confirmation').val();
    //         var passwd = $('.form-signup #password').val();
    //         if(passwd=="") {
    //             $(".form-signup #password").after('<div class="pwd-error badge alert-error">Please enter a password.</div>');
    //         }
    //         if(confirm=="") {

    //             $(".form-signup #confirmation").after('<div class="pwd-error badge alert-error">Please re-enter your password.</div>');

    //         }
    //         else if (passwd!= confirm) {
    //             $(".form-signup #confirmation").after('<div class="pwd-error response badge alert-error">Password does not match.</div>');
    //         }
    //         else
    //         {
    //             $(".form-signup #confirmation").after('<div class="pwd-error badge alert-success">Password confirm</div>')
    //         }



    //     });
    // $('.form-signup #sign-up-btn').click(function() {


    // if($('.response').hasClass('alert-success') && $('.pwd-error').hasClass('alert-success')) {
    //     return true;

    // }
    // else {
    //     alert("Filling your info correctly!");
    //     return false;

    // }
    // });


})
