define(function(require, exports, module) {
	var $ = require('jquery');
	require('upload');
	require('datepicker');
	require('bootstrap');
	var Alert = require('alert');
    var ajaxDisabledButtons=".ajaxdisabledbutton";
        $(ajaxDisabledButtons).on('click', function(){
	    $(ajaxDisabledButtons).ajaxStart(function() {
			$(this).attr('disabled',"true");
	    });
	    $(ajaxDisabledButtons).ajaxStop(function() {
			$(this).removeAttr("disabled"); 
	    });

        });

});