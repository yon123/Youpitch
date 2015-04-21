(function($, undefined) {

    function sanitize(str) {
        return str.toLowerCase();
    }

    function normalizeP4kResult(result) {
        var parts = result.split(' - '),
            artist = parts[0],
            album = parts[1];

        return {
            artist: sanitize(artist),
            album: sanitize(album)
        };
    }

    function returnResult(obj) {
        return $.extend({
            url: obj.url
        }, normalizeP4kResult(obj.name));
    }

    function getAlbumUrl(data, textStatus, xhr) {

        var searchData = data.value.items[0].json,
            reviews = {},
            theResult = {};

        // Find the reviews object
        for (var i = 0, m = searchData.length; i < m; i++) {
            if (searchData[i].label.toLowerCase() === "reviews") {
                reviews = searchData[i];
                break;
            }
        }

        if (!$.isEmptyObject(reviews) && !$.isEmptyObject(reviews.objects)) {
            // We have results
            reviews = (reviews.objects.length > 0) ? reviews.objects : [reviews.objects];

            if (reviews.length === 1) {
                // Only 1 result, use it
                theResult = returnResult(reviews[0]);
            } else {
                for (var i = 0, m = reviews.length; i < m; i++) {
                    var p4kResult = normalizeP4kResult(reviews[i].name),
                        p4kArtist = p4kResult.artist,
                        p4kAlbum = p4kResult.album;

                    if ((p4kArtist === artist || artist === '') && (p4kAlbum === album || album === '')) {
                        // we found an exact match!
                        theResult = returnResult(reviews[i]);
                        break;
                    }
                }
            }

            if ($.isEmptyObject(theResult)) {
                // No exact match was found for the multiple results
                // Might as well use pitchfork's top match
                theResult = returnResult(reviews[0]);
            }

            // Populate album, artist data from search query
            $('#result_artist').text(theResult.artist);
            $('#result_album').text(theResult.album);

            // Get the album score
            getAlbumScore("http://pitchfork.com" + theResult.url);

        } else {
            console.error('The search returned no reviews');
        }
    }

    function getAlbumScore(url) {

        var keyword = $('#artist').val()
        // Create YQL query to get span containing score
        var query = encodeURIComponent('select content from html where url="' + url + '" and compat="html5" and xpath=\'//div[@id="main"]/ul/li/div[@class="info"]/span\''),

            // JSONP url for YQL query
            yqlurl = 'http://query.yahooapis.com/v1/public/yql?q=' + query + '&format=json&callback=?';

        $.ajax({
            url: 'http://query.yahooapis.com/v1/public/',
            type: 'GET',
            dataType: 'jsonp',
            data: 'keyword',
            success: function(data, textStatus, xhr) {
                console.log('success')
                $('#score').text(data.query.results.span);
            },
            error: function(xhr, textStatus, errorThrown) {
                console.error(xhr, textStatus, errorThrown);
            }
        });
    }

    function searchPitchfork() {
        // Get album and artist from html
        var album = sanitize($('#album').text()),
            artist = sanitize($('#artist').text()),

            // Set up url to search pitchfork
            p4kAC = "http://pitchfork.com/search/ac/?query=" + album + ' - ' + artist,

            // Use this yahoo pipe to return JSONP from pitchfork's JSON
            yahooPipeId = '332d9216d8910ba39e6c2577fd321a6a';

        $.ajax({
            url: "http://pipes.yahoo.com/pipes/pipe.run?u=" + encodeURIComponent(p4kAC) + "&_id=" + yahooPipeId + "&_render=json&_callback=?",
            type: 'GET',
            dataType: 'jsonp',
            success: getAlbumUrl,
            error: function(xhr, textStatus, errorThrown) {
                console.error(xhr, textStatus, errorThrown);
            }
        });
    }


    // Run on dom ready
$( document ).ready(function() {
  $("#searchPitchfork").on('click', function(e){
    e.preventDefault();
    getAlbumScore();
  });

});


})(jQuery);


