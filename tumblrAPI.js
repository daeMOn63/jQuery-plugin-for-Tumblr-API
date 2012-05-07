/*
jQuery plugin for embedding Tumblr via Tumblr API read-only implementation.
For more info on the Tumblr API, please visit http://www.tumblr.com/docs/en/api/v2
2011 ian.ainley (@ gmail)
*/

;(function ($) {

$.fn.embedTumblr = function (APIKey, options) {
    return this.each(function(){
        var target = $(this);

        if (target.data("embedTumblr")) return;

        var tumblrPosts = new AccessTumlbrApi(target, APIKey, options);

        target.data('embedTumblr', tumblrPosts)

        tumblrPosts.init();
    });
};

$.fn.embedTumblr.defaults = {
    postsPerPage: 3,
    pagination: true,
    currentPage: 1,
    loading: "<p>Loading...</p>",
    previousBtn: "&laquo; Prev",
    nextBtn: "Next &raquo;",
    error: "<h2>Error!</h2><p>There was an error accessing the Tumblr API, LAME!</p>"
};

function AccessTumlbrApi(target, APIKey, options){
    var s = this;

    s.settings = $.extend({}, $.fn.embedTumblr.defaults, options);

    /*** FORMAT TIMESTAMP ***/
    var formatedPostDate = function (timestamp) {
        var jsDate = new Date(timestamp * 1000),
            month = jsDate.getMonth() + 1,
            day = jsDate.getDay(),
            hours = convertedHours(),
            minutes = convertedMinutes(),
            year = jsDate.getFullYear(),
            postTime; // Used to store formatted time.

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
    var formatPosts = function (blog, data) {
        var frag = $("<div />");
       
        $.each(data.response.posts, function () {
            var postType = this.type,
                thisPost = $("<div class='post'/>"),
                postDate = formatedPostDate(this.timestamp),
                linkURL = this.post_url;

            switch (postType) {

            /*** AUDIO POST ***/
            case "audio":
                var audioTitle = 'AUDIO: ' + this.artist + ' - ' + this.track_name,
                    imgSRC = this.album_art ? '<img src="' + this.album_art + '"/>' : " ";

                thisPost.addClass('audio-post')
                        .append(
                            '<h2>' + audioTitle + '</h2>', 
                            '<p class="post-date">' + postDate + '</p>', 
                            imgSRC, 
                            this.player, 
                            this.caption, 
                            '<a href="' + linkURL + '">Go to tumblr post...</a>'
                        );
                frag.append(thisPost);
                break; /*** END AUDIO POST***/

            /*** TEXT POST ***/
            case "text":
                thisPost.addClass('text-post')
                        .append(
                            '<h2>' + this.title + '</h2>', 
                            '<p class="post-date">' + postDate + '</p>', 
                            this.body, 
                            '<a href="' + linkURL + '">Go to tumblr post...</a>'
                        );
                frag.append(thisPost);
                break; /*** END TEXT POST***/            

            /*** PHOTO POST ***/
            case "photo":
                var photos = this.photos,
                    photoContainer = $('<div class="tumblr-photos" />');

                for (i = 0; i < photos.length; i++) {
                    var figure = $('<figure />');
                    // Check for photo size options. Prevents really large original images from being called.
                    if (photos[i].alt_sizes[0].width >= 500) {
                        var n = 0;
                        for ( ; n < photos[i].alt_sizes.length; n++) {
                            if (photos[i].alt_sizes[n].width === 500) {
                                var photoSizeURL = photos[i].alt_sizes[n].url;
                            }
                        }
                    } else {
                        var photoSizeURL = photos[i].original_size.url;
                    }
                    if (photos.length > 1) {
                        photoContainer.addClass("multi-photo");
                    }
                    if (photos[i].caption != "") {
                        var caption = $('<figcaption />');
                        caption.append(photos[i].caption);
                    } else {
                        var caption = "";
                    }
                    figure.append('<a href="' + photos[i].original_size.url + '" target="_blank" title="' + photos[i].caption + '"><img src="' + photoSizeURL + '"/></a>', caption);
                    photoContainer.append(figure);
                }
                thisPost.addClass('photo-post')
                        .append(
                            '<p class="post-date">' + postDate + '</p>', 
                            photoContainer, 
                            this.caption, 
                            '<a href="' + linkURL + '">Go to tumblr post...</a>'
                        );
                frag.append(thisPost);
                break; /*** END PHOTO POST***/
            
            /*** QUOTE POST ***/
            case "quote":
                thisPost.addClass('quote-post')
                        .append(
                            '<p class="post-date">' + postDate + '</p>', 
                            '<q class="quote-text">' + this.text + '</q>', 
                            '<p class="quote-author"> &#8212; ' + this.source + '</p>', 
                            '<a href="' + linkURL + '">Go to tumblr post...</a>'
                        );
                frag.append(thisPost);
                break; /*** END QUOTE POST***/

            /*** VIDEO POST ***/
            case "video":
                thisPost.addClass('video-post')
                        .append(
                            '<p class="post-date">' + postDate + '</p>', 
                            this.player[2].embed_code, 
                            this.caption, 
                            '<a href="' + linkURL + '">Go to tumblr post...</a>'
                        );
                frag.append(thisPost);
                break; /*** END VIDEO POST ***/

            /*** LINK POST ***/
            case "link":
                var description;
                    
                if (this.description){                    
                    description = this.description;                
                } else {
                    description = "";
                }

                thisPost.addClass('link-post')
                        .append(
                            '<p class="post-date">' + postDate + '</p>',
                            '<a href="' + this.url + '">' + this.title + '</a>',
                            description,
                            '<a href="' + linkURL + '">Go to tumblr post...</a>'
                        );
                frag.append(thisPost);
                break; /*** END LINK POST ***/

            /*** CHAT POST ***/
            case "chat":
                thisPost.addClass('chat-post')
                        .append('<p class="post-date">' + postDate + '</p>');

                for (i = 0; i < this.dialogue.length; i++){
                    thisPost.append(
                        '<span class="chat-post-name">' + this.dialogue[i].name + '</span>',
                        '<p class="chat-post-phrase">' + this.dialogue[i].phrase + '</p>'
                    );
                }

                thisPost.append('<a href="' + linkURL + '">Go to tumblr post...</a>');

                frag.append(thisPost);
                break; /*** END CHAT POST ***/
            }
        });
        
        blog.append(frag);
    } /*** END POSTS ***/

    /***  PAGINATION ***/
    var createPagination = function (target, APIKey, data, postsPerPage, currentPage) {
        if (s.settings.pagination === true) {
            var paginationContainer = $("<div class='blog-pagination clearfix'></div>");

               if (Math.ceil(data.response.total_posts / postsPerPage) !== currentPage) {
                   var nextBtn = $("<div class='blog-btn next'>" + s.settings.nextBtn + "</div>").css({
                       "cursor": "pointer"
                   });
                   paginationContainer.append(nextBtn);
               }
               if (currentPage !== 1) {
                   var prevBtn = $("<div class='blog-btn prev'>" + s.settings.previousBtn + "</div>").css({
                       "cursor": "pointer"
                   });
                   paginationContainer.append(prevBtn);
               }

            target.append(paginationContainer);
            bindPagination(target, APIKey);
        }  
    }

    var bindPagination = function (target, APIKey) {
        $('.blog-btn').on('click.embedTumblr', function(){
            if ($(this).hasClass('next')) {
                s.settings.currentPage++;   
            }
            if ($(this).hasClass('prev')) {
                s.settings.currentPage--;
            }

            target.data('embedTumblr').getPosts(target, APIKey);
        });
    }  /***  END PAGINATION ***/

    s.getPosts = function (target, APIKey) {
        var postsPerPage = s.settings.postsPerPage, currentPage = s.settings.currentPage;

        $.ajax({
                url: APIKey + "&limit=" + postsPerPage + "&offset=" + (currentPage - 1) * postsPerPage,
                dataType: "jsonp",
                jsonp: "&jsonp",
                beforeSend: function () {
                    target.html(s.settings.loading);    // While Loading...
                },
                success: function (data) {
                    target.html("");
                    formatPosts(target, data);
                    createPagination(target, APIKey, data, postsPerPage, currentPage);                       
                },
                error: function () {
                    target.append(s.settings.error);
                }
        });              
    }

    s.init = function () {        
        s.getPosts(target, APIKey);
    }

    s.destroy = function (clearContainer) {
        if(clearContainer === true) {
            target.html("");
        }

        $('.blog-btn').off('.embedTumblr');

        target.removeData('embedTumblr');
    }
}

})(jQuery);