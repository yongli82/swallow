(function() {
    var getBase = function() {
        return '/js/';
    };

    if (typeof ENV === 'undefined') {
        ENV = {};
    }

    seajs.config({
        debug: ENV.debug
    });

    seajs.config(
        {
            base: getBase(),

            alias: {
                "jquery": "jquery/src/jquery.js",
                "$": "jquery/src/jquery.js",
                "upload": "jquery-upload/jquery.fileupload.js",
                "datepicker": "date-picker/js/bootstrap-datepicker.js",
                "timepicker": "timepicker/js/bootstrap-timepicker.js",
                "bootstrap": "bootstrap/js/bootstrap.js",
                "nav": "theme/nav.js",
                "alert": "alert/alert.js"
            }
        }
    );

})()