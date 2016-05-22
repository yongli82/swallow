define(function(require, exports, module) {
	var $ = require('jquery');
	require('datepicker');
	require('bootstrap');
	var Alert = require('alert');

    $(document).ready(function() {

		var maskHtml = '<div class="modal-backdrop">' + 
						'</div>' + 
						'<div class="alert" id="loading">' + 
							'加载中...' + 
						'</div>';
		$mask = $(maskHtml).prependTo(document.body);
		$mask.hide();
        changeStatus();

        $('#status').bind('change', function () {
            changeStatus();
        });

        $('#businesstype').bind('change', function () {
            var selectedOption = $(this).find(":selected");
            var redirect = selectedOption.attr("new-payplan");
            if(redirect && redirect == "true"){
                window.location.href = "/settle/payplan/payplanlist#businesstype="+$("#businesstype").val();
            }

            if ($('#businesstype').val() == 2) {
                $('#shop-id-input').show();
            } else {
                $('#shop-id-input').hide();
                $('#shopid').val("");
            }
        });

		//点击查询
		$('#search').bind('click', function() {
			$mask.show();
			$('#loading').show();
	      	pageTracker._trackPageview('dp_fs_dper_paymentplanlist_search_status');
	        if($('#datebegin').val().trim() != "") {
				pageTracker._trackPageview('dp_fs_dper_paymentplanlist_search_beginDate');
		    }
            if($('#dateend').val().trim() != "") {
	  	        pageTracker._trackPageview('dp_fs_dper_paymentplanlist_search_endDate');
		    }
		    if($('#audittype').val() != 0){
	             pageTracker._trackPageview('dp_fs_dper_paymentplanlist_search_auditType');
		    }
            if($('#businesstype').val() != 0){
                pageTracker._trackPageview('dp_fs_dper_paymentplanlist_search_businessType');
            }
		    if($('#contractserialno').val() != ""){
		    	pageTracker._trackPageview('dp_fs_dper_paymentplanlist_search_contractserialno');
		    }
		    if($('#ppids').val() != ""){
		    	pageTracker._trackPageview('dp_fs_dper_paymentplanlist_search_ppids');
		    }
		    if($('#addbegindate').val().trim() != ""){
		    	pageTracker._trackPageview('dp_fs_dper_paymentplanlist_search_addbegindate');
		    }
		    if($('#addenddate').val().trim() != ""){
		    	pageTracker._trackPageview('dp_fs_dper_paymentplanlist_search_addenddate');
		    }
            if($('#businesstype').val() == 0){
                $('#query-status-info').html("请选择业务类型");
                $('#query-status-info').show();
                $('#loading').hide();
                $mask.hide();
                return;
            } else {
                $('#query-status-info').html("");
                $('#query-status-info').hide();
            }
		    location.href = 'paymentplanlist?'
                      + 'paymentBeginDate=' + $('#datebegin').val()+ '&'
                      + 'paymentEndDate=' + $('#dateend').val()+ '&'
              	      + 'status=' + $('#status').val()+ '&'
                      + 'auditType=' + $('#audittype').val()+ '&'
                      + 'contractSerialNo=' + $('#contractserialno').val()+ '&'
                      + 'ppIds=' + $('#ppids').val() + '&'
                      + 'addBeginDate=' + $('#addbegindate').val() + '&'
                      + 'addEndDate=' + $('#addenddate').val() + '&'
                      + 'businessType=' + $('#businesstype').val() + '&'
                      + 'shopId=' + $('#shopid').val();
	            return false;
		});

        $('#order-export').bind("click", function(){
            var param = "businessType=" + $("#businesstype").val();
            param += "&shopId=" + $("#shopid").val();
            param += "&paymentBeginDate=" + $("#datebegin").val();
            param += "&paymentEndDate=" + $("#dateend").val();
            param += "&contractSerialNo=" + $("#contractserialno").val();
            param += "&addBeginDate=" + $("#addbegindate").val();
            param += "&addEndDate=" + $("#addenddate").val();
            param += "&ppIds=" + $("#ppids").val();
            param += "&status=" + $("#status").val();
            param += "&auditType=" + $("#audittype").val();

            var url = "exportPaymentPlan?" + param;
            window.open(url, "_blank");

            setTimeout(function(){
                $('#search').trigger("click");
            }, 3000);
        });

		//初始化日历控件
		$('#datebegin').datepicker({format: 'yyyy-mm-dd'});
		$('#dateend').datepicker({format: 'yyyy-mm-dd'});
		$('#select-date').bind('change', function () {
			changeDateSelect();
		});

		$('#addbegindate').datepicker({format: 'yyyy-mm-dd'});
		$('#addenddate').datepicker({format: 'yyyy-mm-dd'});
		$('#select-add-date').bind('change', function () {
			changeAddDateSelect();
		});

                $('.query-relation').bind('click', function(e){
                        var ppId = $(this).attr("pp-id");
                        $.ajax({
					type: "GET",
					url: "../relation/getRelationHtml"
				}).done(function (data) {
                                        $('#relation-result .modal-body').html(data);
                                        getRelationByPPId(ppId);     
				});
                });
		//全选
		$('#select-all').bind('click', function() {
			var checked = $('#select-all')[0].checked;
			$.each($('.selected-payment'), function(index, el) {
				$(el).attr('checked', checked);
			});

			if(checked) {
				$('#select-all-pageinfo').show();
			}else{
				$('#select-all-pageinfo').hide();
			}
		});

		//选择所有
		$('#select-all-page').bind('click', function() {
			ENV.data._allPage = true;
			$('#select-all-pageinfo').hide();
			$('#select-cur-pageinfo').show();
		});

		//取消勾选
		$('#select-cur-page').bind('click', function() {
			ENV.data._allPage = false;
			$('#select-cur-pageinfo').hide();
			$('#select-all-pageinfo').hide();
			$('#select-all').attr('checked', false);
			$.each($('.selected-payment'), function(index, el) {
				$(el).attr('checked', false);
			});
		});

		$('#pay').bind('click', function() {
			$mask.show();
			$('#loading').show();
			var ppIds = [];
			$.each($('.selected-payment'), function(index, el) {
				if($(el)[0].checked) {
					ppIds.push(el.id);
				}
			});
			if(ppIds.length === 0) {
				$('#loading').hide();
				Alert.error("请勾选需要提交的记录！", function(){
					$mask.hide();
				});
				return false;
			}
			if(!ENV.data._allPage) {
				pageTracker._trackPageview('dp_fs_dper_paymentplanlist_submitPaymentPlanByChecked');
				$.ajax({
					type: "POST",
					url: "../ajax/submitPaymentPlanByChecked",
					data: {
						ppIds: ppIds.join(',')
					}
				}).done(function (data) {
					if(data.code == 200) {
						$('#loading').hide();
						Alert.success(data.msg.message, function () {
		    location.href = 'paymentplanlist?'
                      + 'paymentBeginDate=' + $('#datebegin').val()+ '&'
                      + 'paymentEndDate=' + $('#dateend').val()+ '&'
              	      + 'status=' + $('#status').val()+ '&'
                      + 'auditType=' + $('#audittype').val()+ '&'
                      + 'contractSerialNo=' + $('#contractserialno').val()+ '&'
                      + 'ppIds=' + $('#ppids').val() + '&'
                      + 'addBeginDate=' + $('#addbegindate').val() + '&'
                      + 'addEndDate=' + $('#addenddate').val() + '&'
                      + 'businessType=' + $('#businesstype').val() + '&'
                      + 'shopId=' + $('#shopid').val();
						$mask.hide();
						});
					} else {
						$('#loading').hide();				
						Alert.error(data.msg.message, function(){
							$mask.hide();
						});
					}
				});
			} else {
				pageTracker._trackPageview('dp_fs_dper_paymentplanlist_submitPaymentPlanAll');
				$.ajax({
					type: "POST",
					url: "../ajax/submitPaymentPlanAll",
					data: ENV.data.query
				}).done(function (data) {
					if(data.code == 200) {
						$('#loading').hide();
						Alert.success(data.msg.message, function () {
				    location.href = 'paymentplanlist?'
                      + 'paymentBeginDate=' + $('#datebegin').val()+ '&'
                      + 'paymentEndDate=' + $('#dateend').val()+ '&'
              	      + 'status=' + $('#status').val()+ '&'
                      + 'auditType=' + $('#audittype').val()+ '&'
                      + 'contractSerialNo=' + $('#contractserialno').val()+ '&'
                      + 'ppIds=' + $('#ppids').val() + '&'
                      + 'addBeginDate=' + $('#addbegindate').val() + '&'
                      + 'addEndDate=' + $('#addenddate').val() + '&'
                      + 'businessType=' + $('#businesstype').val() + '&'
                      + 'shopId=' + $('#shopid').val();
								$mask.hide();
						});
					} else {
						$('#loading').hide();
						Alert.error(data.msg.message, function() {
							$mask.hide();
						});
					}
				});
			}
			return false;
		});
	});

    //修改状态
    function changeStatus () {
        if($('#status').val() == 7) {
            $('#not-passed-reason-selector').show();
        } else {
            $('#not-passed-reason-selector').hide();
            $('#audittype').val(0);
        }
    };

    //应付日期默认值
	function changeDateSelect(){
		var dateMap = initDateMap();		
        var v = $('#select-date').val();
        var s = dateMap[v || '0']['s'];
        var e = dateMap[v || '0']['e'];
        $('#datebegin').val(s);
        $('#dateend').val(e);
    };

    //产生日期默认值
    function changeAddDateSelect(){
		var dateMap = initDateMap();		
        var v = $('#select-add-date').val();
        var s = dateMap[v || '0']['s'];
        var e = dateMap[v || '0']['e'];
        $('#addbegindate').val(s);
        $('#addenddate').val(e);
    };

	function initDateMap(){
		var ODT = 24*60*60*1000;
        var now = new Date();
        var nowTime = now.getTime();
	    var dateMap = {
	        '99': {
	            s: '',
	            e: ''
	        },
	        '0': {
	            s: '', 
	            e: dateFormat(now)
	        },
	        '1': {
	            s: dateFormat(now),
	            e: dateFormat(now)
	        },
	        '2': {
	            s: dateFormat(new Date(nowTime - ODT)), 
	            e: dateFormat(new Date(nowTime - ODT))
	        },
	        '3': {
	            s: dateFormat(new Date(nowTime - 2*ODT)), 
	            e: dateFormat(new Date(nowTime - 2*ODT))
	        }
	    };
	    return dateMap;
	};

    function dateFormat(date){
		var format = 'yyyy-mm-dd';
		var val = {
			d: date.getDate(),
			m: date.getMonth() + 1,
			yy: date.getFullYear().toString().substring(2),
			yyyy: date.getFullYear()
		};
		val.dd = (val.d < 10 ? '0' : '') + val.d;
		val.mm = (val.m < 10 ? '0' : '') + val.m;
		return val.yyyy + '-' + val.mm + '-' + val.dd;		
	};

});
