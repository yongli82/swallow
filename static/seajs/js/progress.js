//function for progress bar
define(function(require, exports, module) {
    var progressInterval;
    var ajax=require("./ajax");
    var percent=0;
    var $=require("jquery");
    require("bootstrap");
    module.exports= {
        show: function (url, interval, variable) {
            $("#progressDialog").modal('show');
            progressInterval = setInterval(function () {
                ajax.post(url, "", function (data) {
                    percent = eval("data." + variable);
                    $("#progressDialog_title").html("执行进度  " + percent + "%");
                    $("#progress_bar").css('width', percent + "%");
                });
                if(percent>=100){
                    this.stop();
                }
            }, interval);
        },

        stop: function () {
            if (progressInterval != null) {
                window.clearInterval(progressInterval);
            }
        }
    }
});