/************************************************
 ************TUMBLR API jQUERY PLUGIN************
 **************IAN.AINLEY@GMAIL.COM**************
 ***************PLEASE REED README***************
 ************************************************/

(function ($) {

    $.fn.getTumblrPosts = function (APIKey, options) {
        return $.fn.getTumblrPosts.obj(this, APIKey, options);
    }

    $.fn.getTumblrPosts.defaults = {
        postsPerPage: 3,
        pagination: true,
        currentPage: 1,
        loading: "<p>Loading...</p>",
        previousBtn: "&laquo; Prev",
        nextBtn: "Next &raquo;"
    }

    $.fn.getTumblrPosts.obj = function (target, APIKey, options) {
        var blog = target,
            settings = $.extend({}, $.fn.getTumblrPosts.defaults, options),
            ppPage = settings.postsPerPage,
            currentPage = settings.currentPage;

        blog.html("");

        $.ajax({
            url: APIKey + "&limit=" + ppPage + "&offset=" + (currentPage - 1) * ppPage,
            dataType: "jsonp",
            jsonp: "&jsonp",
            beforeSend: function () {
                blog.html(settings.loading);	// While Loading...
            },
            success: function (data) {
                blog.html("");

                /*** FORMAT TIMESTAMP ***/
                formatedPostDate = function (timestamp) {
                    var jsDate = new Date(timestamp * 1000),
                        month = jsDate.getMonth(),
                        day = jsDate.getDay(),
                        hours = convertedHours(),
                        minutes = convertedMinutes(),
                        year = jsDate.getFullYear(),
						postTime; // Will be used to store formatted time.

                    function convertedHours() {
                        var military = jsDate.getHours();

                        if (military > 12) {
                            var standard = military - 12,
                                period = "PM";
                        } else {
                            var standard = military,
                                period = "AM";
                        }

                        return {
                            hour: standard,
                            period: period
                        };
                    }

                    function convertedMinutes() {
                        var jsMin = jsDate.getMinutes();

                        if (jsMin < 10) {
                            var min = "0" + jsMin;
                        } else {
                            var min = jsMin;
                        }

                        return min;
                    }

                    postTime = month + "\/" + day + "&nbsp;" + year + "&nbsp;" + hours.hour + ":" + minutes + hours.period;

                    return postTime;

                } /*** END TIMESTAMP ***/

                /*** POSTS ***/
                $.each(data.response.posts, function () {
                    var postType = this.type,
                        thisPost = $("<div class='post'/>"),
                        postDate = formatedPostDate(this.timestamp),
                        linkURL = this.post_url;

                    switch (postType) {

                    /*** AUDIO POST ***/
                    case "audio":
                        var audioTitle = 'AUDIO: ' + this.artist + ' - ' + this.track_name,
                            imgSRC = this.album_art ? '<img src="' + this.album_art + '"/>' : " ",
                            audioSRC = this.player,
                            audioCaption = this.caption;

                        thisPost.addClass('audio-post').append(
							'<h2>' + audioTitle + '</h2>', 
							'<p class="post-date">' + postDate + '</p>', 
							imgSRC, 
							audioSRC, 
							audioCaption, 
							'<a href="' + linkURL + '">Go to tumblr post...</a>'
						);

                        blog.append(thisPost);

                        break; /*** END AUDIO POST***/

                    /*** TEXT POST ***/
                    case "text":
                        var title = this.title,
                            textBody = this.body;

                        thisPost.addClass('text-post').append(
							'<h2>' + title + '</h2>', 
							'<p class="post-date">' + postDate + '</p>', 
							textBody, 
							'<a href="' + linkURL + '">Go to tumblr post...</a>'
						);

                        blog.append(thisPost);

                        break; /*** END TEXT POST***/

                    /*** PHOTO POST ***/
                    case "photo":
                        var photoText = this.caption,
                            photos = this.photos,
                            photoContainer = $('<div class="tumblr-photos" />');

                        for (i = 0; i < photos.length; i++) {
                            var figure = $('<figure />');

                            // Check for photo size options. Prevents really large original images from being called.
                            if (photos[i].alt_sizes[0].width >= 500) {
                                var n = 0;
                                for (n = 0; n < photos[i].alt_sizes.length; n++) {
                                    if (photos[i].alt_sizes[n].width === 500) {
                                        var photoSizeURL = photos[i].alt_sizes[n].url;
                                    }
                                }

                            } else {
                                var photoSizeURL = photos[i].original_size.url;
                            }

                            if (photos.length > 1) {
                                figure.addClass("multi-photo");
                            }

                            if (photos[i].caption != "") {
                                var caption = $('<figcaption />');
                                caption.append(photos[i].caption);
                            } else {
                                var caption = "";
                            }

                            figure.append(
								'<a href="' + photos[i].original_size.url + '" target="_blank" title="' + photos[i].caption + '"><img src="' + photoSizeURL + '"/></a>', 
								caption
							);

                            photoContainer.append(figure);
                        }

                        thisPost.addClass('photo-post').append(
							'<p class="post-date">' + postDate + '</p>', 
							photoContainer, 
							photoText, '<a href="' + linkURL + '">Go to tumblr post...</a>'
						);

                        blog.append(thisPost);

                        break; /*** END PHOTO POST***/

                    /*** QUOTE POST ***/
                    case "quote":
                        var quote = this.text,
                            author = this.source;

                        thisPost.addClass('quote-post').append(
							'<p class="post-date">' + postDate + '</p>', 
							'<q class="quote-text">' + quote + '</q>', '
							<p class="quote-author"> &#8212; ' + author + '</p>', 
							'<a href="' + linkURL + '">Go to tumblr post...</a>'
						);

                        blog.append(thisPost);

                        break; /*** END QUOTE POST***/

                    /*** VIDEO POST ***/
                    case "video":
                        var caption = this.caption,
                            embeddedVideo = this.player[2].embed_code;

                        thisPost.addClass('video-post').append(
							'<p class="post-date">' + postDate + '</p>', 
							embeddedVideo, 
							caption, 
							'<a href="' + linkURL + '">Go to tumblr post...</a>'
						);

                        blog.append(thisPost);

                        break; /*** END VIDEO POST ***/

                    }

                }); /*** END POSTS ***/

                /*** PAGINATION ***/
                if (settings.pagination === true) {
                    var paginationContainer = $("<div class='blog-pagination clearfix'></div>");

                    if (Math.ceil(data.response.total_posts / ppPage) != currentPage) {
                        var nextBtn = $("<div class='blog-next-btn'>" + settings.nextBtn + "</div>").css({
                            "cursor": "pointer"
                        });

                        paginationContainer.append(nextBtn);

                    }

                    if (currentPage !== 1) {
                        var prevBtn = $("<div class='blog-prev-btn'>" + settings.previousBtn + "</div>").css({
                            "cursor": "pointer"
                        });

                        paginationContainer.append(prevBtn);

                    }

                    function bindPagination() {

                        $(".blog-next-btn").click(function () {

                            $.fn.getTumblrPosts.defaults.currentPage++;

                            blog.getTumblrPosts(APIKey, options);

                        });

                        $(".blog-prev-btn").click(function () {

                            $.fn.getTumblrPosts.defaults.currentPage--;

                            blog.getTumblrPosts(APIKey, options);

                        });

                    }

                    blog.append(paginationContainer);
                    bindPagination();

                } /*** END PAGINATION ***/

            },
            /*** END SUCCESS ***/

            error: function () {

                blog.append("<h2>ERRRRRRRR!</h2>", "<p>There was an error loading Tumblr, LAME!</p>");

            }
        });
    }

})(jQuery);