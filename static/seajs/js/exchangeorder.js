define(function(require, exports, module) {
    var $ = require('jquery');
    require('datepicker');
    require('bootstrap');
    var ajax = require('./ajax');
    var form = require("./form");
    var customValidator = require("./customValidator");
    var list = require("./list");
    var option = require("./option");
    $(document).ready(function () {
        option.ajax("businesstype","/caiwu/ajax/loadBusinessTypeOption","","option",0);
        option.ajax("status","/caiwu/ajax/loadEOStatusOption","","option",0);
        $('#addbegindate').datepicker({format: 'yyyy-mm-dd'});
        $('#addenddate').datepicker({format: 'yyyy-mm-dd'});
    });
});