$(function () {
    let n = 0,
        imgNum = $("img").length,
        img = $('img');

    function lazyload(event) {
        for (let i = n; i < imgNum; i++) {
            let winH = parseInt($(window).height()) + parseInt($(window).scrollTop());
            let imgItem = img.eq(i);
            if (imgItem.offset().top < winH) {
                let dataSrc = imgItem.attr("data-src")
                // console.log(dataSrc)
                if (dataSrc) {
                    let extensionName = dataSrc.substring(dataSrc.lastIndexOf(".") + 1, dataSrc.length)
                    // console.log(extensionName)
                    imgItem.css('opacity', 0);
                    if ("txt" == extensionName) {
                        $.get(dataSrc, (res) => {
                            let baseImg = aesDecrypt(res)
                            imgItem.attr("src", baseImg);
                            imgItem.animate({ opacity: 1 }, 300);
                        })
                    } else {
                        imgItem.attr("src", dataSrc);
                        imgItem.on('load', () => {
                            imgItem.animate({ opacity: 1 }, 300);
                        });
                    }
                    n = i + 1;
                }
            }
        }
    }

    // document.oncontextmenu = new Function("return false");
    // document.onselectstart = new Function("return false");
    $(window).scroll(lazyload);
    lazyload();
});