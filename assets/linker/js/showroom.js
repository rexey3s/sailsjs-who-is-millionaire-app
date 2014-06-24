// $(document).ready(function() {

//   $('#confirm-1-quiz-ans').on('click',function(e) {
//       e.preventDefault();
//       bootbox.confirm("Xác nhận đây có phải là câu trả lời cuối cùng của bạn không ?",function(confirmed) {
//           if(confirmed == true) {
//               // first_quiz_submit();
//           }
//       });
//   });
//   var page = document.location.pathname;

//   // Strip trailing slash if we've got one
//   page = page.replace(/(\/)$/, '');
//   switch(page) {
//    case  '/player/start1quiz' :$('#logo').after('<div id="clock"></div>');break;
//   }
//   // clock_start(30);
//   if($('#my-player-time').val()) {
//     clock_start(parseInt($('#my-player-time').val()));
//   }

// });
// function first_quiz_submit() {
//           var ans = $('input[name="answer"]').val();
//             if(ans.length == 4 && ans.toLowerCase().match('^[a-d]')) {
//               var arr = ans.toLowerCase().split("");
//               console.log(arr);
//               var realAns =   $('div[data-ans="'+arr[0]+'"]').attr('data-value') + " "
//                             + $('div[data-ans="'+arr[1]+'"]').attr('data-value') + " "
//                             + $('div[data-ans="'+arr[2]+'"]').attr('data-value') + " "
//                             + $('div[data-ans="'+arr[3]+'"]').attr('data-value');
//               var req = $.ajax({
//                   url : '/player/first_quiz_submit',
//                   data : {
//                     ans : realAns,
//                     time : 30 - parseInt($('#clock').html())
//                   },
//                   type: 'post'
//               }).done(function(resp) {
//                 alert(resp.msg);
//               }).fail(function(err) {
//                 alert(err);
//               });
//           }
//           if(clock_time == 0 && !(ans.length == 4 && ans.toLowerCase().match('^[a-d]'))) {
//               var req = $.ajax({
//                   url : '/player/first_quiz_submit',
//                   data : {
//                     ans : "",
//                     time : 30 - parseInt($('#clock').html())
//                   },
//                   type: 'post'
//               }).done(function(resp) {
//                 alert(resp.msg);
//               }).fail(function(err) {
//                 alert(err);
//               });
//           }
// }

