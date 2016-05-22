define(function(require, exports, module) {
	var $ = require('jquery');
	require('datepicker');
	require('timepicker');
	require('bootstrap');
	$(document).ready(function() {
		//点击查询
		$('#search').bind('click', function() {
			//产品需求 ga
			if($('#shopname').val().trim() != "") {
				pageTracker._trackPageview('dp_fs_dper_accountinfolist_search_shopName');
			}
			if($('#shopid').val().trim() != "") {
				pageTracker._trackPageview('dp_fs_dper_accountinfolist_search_shopId');
			}
			pageTracker._trackPageview('dp_fs_dper_accountinfolist_search_payType');
			pageTracker._trackPageview('dp_fs_dper_accountinfolist_search_tradeType');
			if($('#begindate').val() != "" || $('#enddate').val() != "") {
				pageTracker._trackPageview('dp_fs_dper_accountinfolist_search_postDate');
			}
			location.href = 'accountinfolist_' 
				+ $('#shopname').val().trim() + '_' 
				+ $('#shopid').val() + '_' 
				+ $('#paytype').val() + '_'
				+ $('#tradetype').val().trim() + '_'
				+ $('#businesstype').val().trim() + '_'
				+ $('#begindate').val() + '_' 
				+ $('#begintime').val() + '_'
				+ $('#enddate').val() + '_' 
				+ $('#endtime').val();
			return false;
		});

		//初始化控件
		$('#begindate').datepicker({format: 'yyyy-mm-dd'});

	    $('#begintime').timepicker({
            minuteStep: 1,
            showInputs: true,
            defaultTime: 'value',
            showSeconds: true,
            secondStep: 1,
            showMeridian: false
        });

	    $('#enddate').datepicker({format: 'yyyy-mm-dd'});

	    $('#endtime').timepicker({
            minuteStep: 1,
            showInputs: true,
            defaultTime: 'value',
            showSeconds: true,
            secondStep: 1,
            showMeridian: false
        });

        $('#tradetype').bind('change',function(){
        	if($('#tradetype').val()==200){
        		$('#not-receive-type-selector').show();
        	}else{
        		$('#not-receive-type-selector').hide();
        		$('#paytype').val(0);
        	}
        });

	    var timeout;
		//模糊匹配
		$('#shopname').typeahead({
		    source: function (query, process) {
		    	if(timeout) clearTimeout(timeout);
		    	timeout = setTimeout(function () {
		    		$.ajax({
						type: "POST",
						url: "../ajax/suggestshopname",
						data: {
							shopname: query
						}
					}).done(function (data) {
						if(data.code == 200) {
							return process(data.msg.message);
						} 
					});
		    	}, 200);
			}
		});
	});
});