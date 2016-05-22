define(function(require, exports, module) {
	var $ = require('jquery');
	require('upload');
	require('datepicker');
	require('bootstrap');
	var Alert = require('alert');

	//修改开票状态
	function changeStatus () {
		if($('#invoicestatus').val() == 2 || $('#invoicestatus').val() == -1) {
			$('#invoicedextra').show();
		} else {
			$('#invoicedextra').hide();
			$('#invoicetaxno').val(null);
			$('#releasedatebegin').val(null);
			$('#releasedateend').val(null);
		}
	}

	$(document).ready(function() {

		ENV.data._allPage = false;

		changeStatus();

		$('#invoicestatus').bind('change', function () {
			changeStatus();
		})

		//点击查询
		$('#search').bind('click', function() {
			//产品需求 ga
			pageTracker._trackPageview('dp_fs_dper_invoicelist_search_invoiceStatus');
			if($('#shopname').val().trim() != "") {
				pageTracker._trackPageview('dp_fs_dper_invoicelist_search_shopName');
			}
			if($('#shopid').val().trim() != "") {
				pageTracker._trackPageview('dp_fs_dper_invoicelist_search_shopId');
			}
			if($('#invoicetitle').val().trim() != "") {
				pageTracker._trackPageview('dp_fs_dper_invoicelist_search_invoiceTitle');
			}
			if($('#invoicecode').val().trim() != "") {
				pageTracker._trackPageview('dp_fs_dper_invoicelist_search_requestID');
			}
			if($('#invoicedatebegin').val() != "" || $('#invoicedateend').val() != "") {
				pageTracker._trackPageview('dp_fs_dper_invoicelist_search_requestDate');
			}
			if($('#invoicetaxno').val().trim() != "") {
				pageTracker._trackPageview('dp_fs_dper_invoicelist_search_invoiceID');
			}
			if($('#releasedatebegin').val() != "" || $('#releasedateend').val() != "") {
				pageTracker._trackPageview('dp_fs_dper_invoicelist_search_invoiceDate');
			}
			location.href = 'invoicelist_' 
				+ $('#invoicestatus').val() + '_' 
				+ $('#shopname').val().trim() + '_' 
				+ $('#shopid').val().trim() + '_' 
				+ $('#invoicetitle').val().trim() + '_' 
				+ $('#invoicecode').val().trim() + '_' 
				+ $('#invoicedatebegin').val() + '_' 
				+ $('#invoicedateend').val() +　'_'
				+ $('#invoicetaxno').val().trim() +　'_'
				+ $('#releasedatebegin').val() +　'_'
				+ $('#releasedateend').val();
			return false;
		});

		//初始化日历控件
		$('#invoicedatebegin').datepicker({format: 'yyyy-mm-dd'});

		$('#invoicedateend').datepicker({format: 'yyyy-mm-dd'});

		$('#releasedatebegin').datepicker({format: 'yyyy-mm-dd'});

		$('#releasedateend').datepicker({format: 'yyyy-mm-dd'});

		//上传
		$('#fileupload').fileupload({
			dataType: 'json',
			done: function(e, data) {
				if(data.result.code == 200) {
					Alert.success(data.result.msg.message, function () {
						location.href = 'invoicelist_1_________';
					});
				} else {
					Alert.error(data.result.msg.message);
				}
			}
		});

		//全选
		$('#selectAll').bind('click', function() {
			var checked = $('#selectAll')[0].checked;
			$.each($('.selected-invoice'), function(index, el) {
				$(el).attr('checked', checked);
			});

			if(checked) {
				$('#selectAllPageInfo').show();
			}else{
				$('#selectAllPageInfo').hide();
			}
		});

		//选择所有
		$('#selectAllPage').bind('click', function() {
			ENV.data._allPage = true;
			$('#selectAllPageInfo').hide();
			$('#selectCurPageInfo').show();
		});

		//取消勾选
		$('#selectCurPage').bind('click', function() {
			ENV.data._allPage = false;
			$('#selectCurPageInfo').hide();
			$('#selectAll').attr('checked', false);
			$.each($('.selected-invoice'), function(index, el) {
				$(el).attr('checked', false);
			});
		});

		//批量开票
		$('#batch-invoice').bind('click', function() {
			var invoiceIds = [];
			$.each($('.selected-invoice'), function(index, el) {
				if($(el)[0].checked) {
					invoiceIds.push(el.id);
				}
			});
			if(invoiceIds.length === 0) {
				Alert.error("请选择需要开票的记录！");
				return false;
			}
			if(!ENV.data._allPage) {
				$.ajax({
					type: "POST",
					url: "../ajax/invoicepend",
					data: {
						invoiceIds: invoiceIds.join(',')
					}
				}).done(function (data) {
					if(data.code == 200) {
						Alert.success(data.msg.message, function () {
							location.href = 'invoicelist_1_________';
						});
					} else {
						Alert.error(data.msg.message);
					}
				});
			} else {
				$.ajax({
					type: "POST",
					url: "../ajax/invoicependall",
					data: ENV.data.query
				}).done(function (data) {
					if(data.code == 200) {
						Alert.success(data.msg.message, function () {
							location.href = 'invoicelist_1_________';
						});
					} else {
						Alert.error(data.msg.message);
					}
				});
			}
			return false;
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