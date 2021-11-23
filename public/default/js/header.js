
$(".reg").click(function(){
    $(document.body).css({
        "overflow-x":"hidden",
        "overflow-y":"hidden"
    });
    $(".reg_box").slideDown();
    $(".shade_box").show();
})


$(".reg_close").click(function(){
    $(document.body).css({
        "overflow-x":"auto",
        "overflow-y":"auto"
      });
    $(".reg_box").slideUp();
    $(".shade_box").hide();
})



$(".login").click(function(){
    $(document.body).css({
        "overflow-x":"hidden",
        "overflow-y":"hidden"
    });
    $(".log_box").slideDown();
    $(".shade_box").show();
})


$(".log_close").click(function(){
    $(document.body).css({
        "overflow-x":"auto",
        "overflow-y":"auto"
      });
    $(".log_box").slideUp();
    $(".shade_box").hide();
})

// $(".nav_list li").click(function(){
//     $(this).addClass("active").siblings().removeClass("active");
// })



$(document).ready(function () {
    var time = 0;
    var $range = $("#range_44"),
        $result = $("#result_44");
    var track = function (data) {
        delete data.input;
        delete data.slider;
        if (JSON) {
            $result.html(JSON.stringify(data, null, 2));
        } else {
            $result.html(data.toString());
        }
     time  = $(".irs-from").html();
     console.log(time)
    };
    // $range.ionRangeSlider({
    //     type: "double",
    //     min: 0,
    //     max: 40,
    //     from: 0,
    //     to: 40,
    //     step: 10,
    //     grid: true,
    //     onStart: track,
    //     onChange: track,
    //     onFinish: track,
    //     onUpdate: track
    // });
   var timechange = time;
});

// function changeIcon(ele){
//     $(ele).click(function(){
//         var result = $(this).attr("num");
//         if(result){
//             $(this).find("i").css({"background":'url("/ssd/web/image/index/before_active.png") center center no-repeat',})
//             $(this).attr("num","");
//         }else{
//             $(this).find("i").css({"background":'url("/ssd/web/image/index/after_active.png") center center no-repeat',})
//             $(this).attr("num",true);
//         }
//     })
// }
// changeIcon(".zan_btn")

