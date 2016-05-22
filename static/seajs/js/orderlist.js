define(function(require, exports, module) {
	var $ = require('jquery');
	require('datepicker');
	require('bootstrap');
        require('upload');
	var Alert = require('alert');

        function getConvertFormat(str) {
            str = str.toFixed(2);
            var regex = /(-?[0-9]+)([0-9]{3})/;
            str += '';
            while (regex.test(str)) {
                str = str.replace(regex, '$1,$2');
            }
            return str;
        }

	$(document).ready(function() {

        var url = $("a[title='付款单']").attr("href");
        var host=url.split("//")[0]+"//"+url.split("//")[1].split('/')[0];

		var maskHtml = '<div class="modal-backdrop customize">' + 
						'</div>' + 
						'<div class="alert" id="loading">' + 
							'加载中...' + 
						'</div>';
		$mask = $(maskHtml).prependTo(document.body);
		$mask.hide();

		pageTracker._trackPageview('dp_fs_dper_exchangeorder_search_status');
		//点击查询
		$('#search').bind('click', function() {
			$mask.show();
			$('#loading').show();
			if($('#datebegin').val().trim() != "") {
				pageTracker._trackPageview('dp_fs_dper_exchangeorderlist_search_beginDate');
			}
            if($('#businesstype').val() != 0) {
                pageTracker._trackPageview('dp_fs_dper_exchangeorderlist_search_businessType');
            }
        	if($('#dateend').val().trim() != "") {
	  	        pageTracker._trackPageview('dp_fs_dper_exchangeorderlist_search_endDate');
	  	    }
        	if($('#bizCode').val() != 0) {
		   		pageTracker._trackPageview('dp_fs_dper_exchangeorderlist_search_orderId');
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
			location.href = 'orderlist?' 
				+ 'bizCode=' + $('#bizCode').val()+ '&'
				+ 'addDateBegin=' + $('#datebegin').val() + '&' 
				+ 'addDateEnd=' +$('#dateend').val() + '&'
				+ 'status=' + $('#status').val() + '&'
				+ 'businessType=' + $('#businesstype').val() + '&'
                + 'shopId=' + $('#shopid').val();
			return false;
		});

		$('#btn-export').click(function(){
			var url = 'orderexport?' 
				+ 'bizCode=' + $('#bizCode').val()+ '&'
				+ 'addDateBegin=' + $('#datebegin').val() + '&' 
				+ 'addDateEnd=' +$('#dateend').val() + '&'
				+ 'status=' + $('#status').val() + '&'
				+ 'businessType=' + $('#businesstype').val() + '&'
                + 'shopId=' + $('#shopid').val();

			window.open(url,'_blank');

			setTimeout(function(){
			location.href = 'orderlist?' 
				+ 'bizCode=' + $('#bizCode').val()+ '&'
				+ 'addDateBegin=' + $('#datebegin').val() + '&' 
				+ 'addDateEnd=' +$('#dateend').val() + '&'
				+ 'status=' + $('#status').val() + '&'
				+ 'businessType=' + $('#businesstype').val() + '&'
                + 'shopId=' + $('#shopid').val();
							    }, 3000);
			
		});

		//初始化日历控件
		$('#datebegin').datepicker({format: 'yyyy-mm-dd'});
		$('#dateend').datepicker({format: 'yyyy-mm-dd'});
		$('#select-date').bind('change', function () {
			changeDateSelect();
		});

        $('#businesstype').bind('change', function () {
            var selectedOption = $(this).find(":selected");
            var redirect = selectedOption.attr("new-payorder");
            if(redirect && redirect == "true") {
                window.location.href = host + "/exchange/payorder/orderlist#businesstype="+$('#businesstype').val()
            }

            if ($('#businesstype').val() == 2) {
                $('#shop-id-input').show();
            } else {
                $('#shop-id-input').hide();
                $('#shopid').val("");
            }
        });
			
		//全选
		$('#select-all').bind('click', function() {
			var checked = $('#select-all')[0].checked;
			$.each($('.selected-order'), function(index, el) {
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
			$.each($('.selected-order'), function(index, el) {
				$(el).attr('checked', false);
			});
		});

                $('input[type="file"]').on('change', function (event, files, label) {
			$('input[name="upload-file"]').val(this.value);
                });

                $('#import-file').fileupload({
			url: "../ajax/importrefund",
			dataType: 'json',
			add: function(e, data){
                              $('#confirm-import').click(function(){
                                  $('#import-refund').modal('hide');
                                  $mask.show();
				  $('#loading').text("导入退票中...");
                                  $('#loading').show();
				  data.submit();
                              });
			},
			done: function(e, data) {
                             $mask.hide();
                             $('#loading').hide();
                             $('#refund-result').modal('show');
                             if(data.result.code == 200){
                                 if(data.result.excelInvalidMsg != ""){
			                $("#refund-result .failed-result").html("<span class=\"fail-msg\">" + data.result.excelInvalidMsg + "</span>");
				 } else if(data.result.msg.successCount != undefined){
                                        $("#refund-result .success-result").html("成功导入退票<span class=\"number-char\">" + 
                                        data.result.msg.successCount  + "</span>条，总金额<span class=\"number-char\">" + getConvertFormat(data.result.msg.refundTotalAmount) + "</span>元。");        
                                                
                                 } else {
                                        var errorMsg = "<span class=\"fail-msg\">导入退票失败!</span>" +
                                                "<table class=\"table result-table\"><thead><tr><th>失败原因</th><th>失败的付款单号</th></tr></thead>";
                                        var hasError = false;
					if(data.result.invalidRefundMap.invalidIds != undefined){
                                                hasError = true;
                                                 errorMsg += "<tr><td>付款单号格式不对！正确格式为：P+数字。</td><td>" 
                                                + data.result.invalidRefundMap.invalidIds + "</td></tr>";
					}
                                        if(data.result.invalidRefundMap.duplicateIds != undefined){
                                                hasError = true;
                                                errorMsg += "<tr><td>付款单号有重复！</td><td>" +
                                                data.result.invalidRefundMap.duplicateIds + "</td></tr>";
                                        }
                                        if(data.result.invalidRefundMap.notFoundRefundIds != undefined){
                                                hasError = true;
                                                errorMsg += "<tr><td>付款单号不存在！</td><td>" +
                                                data.result.invalidRefundMap.notFoundRefundIds + "</td></tr>";
                                        }
                                        if(data.result.invalidRefundMap.statusErrorIds != undefined){
                                                hasError = true;
                                                errorMsg += "<tr><td>付款单号状态错误！</td><td>" +
                                                data.result.invalidRefundMap.statusErrorIds + "</td></tr>";
                                        }

                                        if(hasError){
                                                errorMsg += "</table>";
                                                $("#refund-result .failed-result").html(errorMsg);
                                        }
				 }
			     } else {
                                 $("#refund-result .failed-result").html("<span class=\"fail-msg\">系统异常，请稍后再试</span>"); 
			     }
		        }
	        });
                $('#confirm-result').bind('click', function() {
                        location.href = 'orderlist?status=4' + '&'
                            + 'businessType=' + $('#businesstype').val() + '&'
                            + 'shopId=' + $('#shopid').val();
                });

		$('#paysuccess').bind('click', function() {
			$mask.show();
			$('#loading').show();
			var orderIds = [];
			$.each($('.selected-order'), function(index, el) {
				if($(el)[0].checked) {
					orderIds.push(el.id);
				}
			});
			if(orderIds.length === 0) {
				$('#loading').hide();
				Alert.error("请勾选需要提交的记录！", function(){
					$mask.hide();
				});
				return false;
			}
			if(!ENV.data._allPage) {
				$.ajax({
					type: "POST",
					url: "../ajax/paysuccess",
					data: {
						orderIds: orderIds.join(',')
					}
				}).done(function (data) {
					$('#loading').hide();
					if(data.code == 200) {
						Alert.success(data.msg.message, function () {
							location.href = 'orderlist?' 
				+ 'bizCode=' + $('#bizCode').val()+ '&'
				+ 'addDateBegin=' + $('#datebegin').val() + '&' 
				+ 'addDateEnd=' +$('#dateend').val() + '&'
				+ 'status=' + $('#status').val() + '&'
				+ 'businessType=' + $('#businesstype').val() + '&'
                + 'shopId=' + $('#shopid').val();
							$mask.hide();
						});
					} else {
						Alert.error(data.msg.message, function(){
							$mask.hide();
						});
					}
					
				});
			} else {
				$.ajax({
					type: "POST",
					url: "../ajax/paysuccessAll",
					data: ENV.data.query
				}).done(function (data) {
					$('#loading').hide();
					if(data.code == 200) {	
						Alert.success(data.msg.message, function () {
							location.href = 'orderlist?' 
				+ 'bizCode=' + $('#bizCode').val()+ '&'
				+ 'addDateBegin=' + $('#datebegin').val() + '&' 
				+ 'addDateEnd=' +$('#dateend').val() + '&'
				+ 'status=' + $('#status').val() + '&'
				+ 'businessType=' + $('#businesstype').val() + '&'
                + 'shopId=' + $('#shopid').val();
			        		$mask.hide();
						});
					} else {
						Alert.error(data.msg.message, function() {
							$mask.hide();							
						});
					}
				});	
			}
			return false;
		});

		$('[data-toggle="popover"]').popover();

		$('body').on('click', function (e) {
		    $('[data-toggle="popover"]').each(function() {
		        if (!$(this).is(e.target) 
		        		&& $(this).has(e.target).length === 0 
		        		&& $('.popover').has(e.target).length === 0) {
		            $(this).popover('hide');
		        }
		    });
		});

		$('.query-relation').bind('click', function(){
			var eoId = $(this).attr("eo-id");
			var eoBizCode = $(this).attr("eo-bizcode");
        	$.ajax({
				type: "GET",
				url: "../relation/getRelationHtml"
			}).done(function (response) {
				$('#relation-result .modal-body').html(response);
				getRelationByEOId(eoId, eoBizCode);
			});
        });
	});

	function changeDateSelect(){
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

        var v = $('#select-date').val();
        var s = dateMap[v || '0']['s'];
        var e = dateMap[v || '0']['e'];
        $('#datebegin').val(s);
        $('#dateend').val(e);
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

