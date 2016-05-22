define(function(require, exports, module) {
    var $ = require('jquery');
    require('datepicker');
    require('bootstrap');
    require('./jquery.autocomplete')($);
    require('./bootstrap-datetimepicker')($);

    var ajax = require('./ajax');
    var list=require("./list");
    var option=require("./option");
    var loading = require("./loading");
    var dialog = require("./dialog");
    var form = require("./form");
    var pub = require("./public");
    var dateutil = require("./date");
    require('upload');
    var autoValidator = require("./autovalidator");
    var bizTypeOrder = '0,1,8,6,9,10,11,12,4,5,2,7,13,15';

    function initialAddDialog(){
        pub.bindAutoComplete();
        option.ajax("add-BusinessType", "/settle/ajax/loadBusinessTypeOption", "", "option", 0);

        $("#add-BusinessType").live("change",  function() {
            var param = "businessType=" + $('#add-BusinessType').val();
            var businessType = $('#add-BusinessType').val();
            $('#add-PayType').empty();
            if (businessType == 1 || businessType == 6 || businessType == 9) {
                $('#add-PayType').append("<option value='14'>保证金</option>");
                $('#add-PayType').append("<option value='15'>点评用户补款</option>");
                $('#add-PayType').append("<option value='16'>点评商户补款</option>");
                $('#add-PayType').append("<option value='17'>上架费</option>");
            } else {
                option.ajax("add-PayType", "/settle/ajax/loadPayTypeOption", param, "option", 0);
            }

        });

        $("#add-PlanDate").datetimepicker({
            format: "yyyy-mm-dd",
            autoclose: true,
            language: "zh_CN",
            forceParse: false,
            startView: 2,
            minView:2
        });

        $("#add-BankName").live("resultChange", function(){
            var param = "bankName=" + $('#add-BankName').val();
            $("#add-BranchMasterCode").val($('#add-BankName').attr("result"));
            option.ajax("add-BankProvince", "/settle/bank/selector/bankProvince", param, "msg.option", 0);
        });

        $("#add-BankProvince").live("change", function(){
            var param = "bankName=" + $('#add-BankName').val() + "&bankProvince=" + $("#add-BankProvince").val();
            option.ajax("add-BankCity", "/settle/bank/selector/bankCity", param, "msg.option", 0);
        });

        $("#add-BankCity").live("change", function(){
            var param = "bankName=" + $('#add-BankName').val() + "&bankProvince=" + $("#add-BankProvince").val() + "&bankCity=" + $("#add-BankCity").val();
            $("#add-BankBranchName").attr("param", param).trigger("list");
        });

        $("#add-BankBranchName").live("resultChange", function(){
            var bankBranch = $("#add-BankBranchName").attr("result");
            if(bankBranch){
                var split = bankBranch.indexOf("_");
                var bankBranchCode = bankBranch.substring(0, split);
                var bankBranchFullName = bankBranch.substring(split + 1);
                $("#add-BankBranchCode").val(bankBranchCode);
                $("#add-BankBranchFullName").val(bankBranchFullName);
            }
        });

        function cleanAddFormControl(){
            form.clean("add-payplan-form");
            $('#add-PlanDate').val(dateutil.trans(new Date().getTime(),"yyyy-MM-dd"));
            $('#add-BankProvince').html("<option value='0'>请选择省份</option>");
            $('#add-BankCity').html("<option value='0'>请选择城市</option>");
            $('#add-BusinessType').val(0);
            $('#add-PayType').html("<option value='0'>请选择款项类型</option>");
            $('#add-BranchMasterCode').val("");
            $('#add-BankBranchCode').val("");
            $('#add-BankBranchFullName').val("");
        }
        cleanAddFormControl();
        //提交新增付款计划
        $('#add-payplan-button').bind('click', function () {
            $('#add-payplan-button').attr("disabled","true");
            var isValid = form.defaultSubmit("add-payplan-form","","",null,function(data){
                if(data.code==200){
                    form.success("付款计划录入成功！");
                    form.clean("add-payplan-form");
                    $("#add-payplan-dialog").modal('hide');
                    cleanAddFormControl();

                    form.clean("payplan-search-form");
                    $("#businesstype").val(data.bean.businessType);
                    var param = "businessType=" + $('#businesstype').val();
                    option.ajax("payType", "/settle/ajax/loadPayTypeOption", param, "option", data.bean.payType);
                    $("#ppids").val(data.ppid);
                    $("#status").val(1);
                    $("#customerName").val("");
                    $("#customerName").attr("result", "0");


                    $("#search").click();
                } else {
                    form.fail("收款单录入失败！");
                }
                $('#add-payplan-button').removeAttr("disabled");
            });
            if(!isValid){
                $('#add-payplan-button').removeAttr("disabled");
            }
        });
    }


    function initialImportDialog(){
        $("#choose-file").on("click", function () {
            $("#import-file").trigger("click")
        });

        $("#import-file").on('change', function (event, files, label) {
            $('input[name="upload-file"]').val(this.value);
        });

        $('#import-file').fileupload({
            url: "/settle/ajax/importPayPlan",
            dataType: 'json',
            add: function (e, data) {
                // 移除之前的事件处理，防止重复提交
                $('#confirm-import').unbind("click");
                $('#confirm-import').click(function () {
                    var uploadFileField = $("#upload-file-input");
                    if (!autoValidator.validate(uploadFileField[0])) {
                        showError(autoValidator.errorMsg());
                        uploadFileField.addClass("error-input");
                        return;
                    }
                    uploadFileField.removeClass("error-input");
                    $('#import-payplan-dialog').modal('hide');
                    $('#import-payplan-dialog').css('display', "none");
                    loading.show();
                    data.submit();
                });
            },
            done: function (e, data) {
                $("input[name='upload-file']").val("");
                loading.hide();
                var failedResultElem = $("#import-result .failed-result");
                failedResultElem.empty();
                var successResultElem = $("#import-result .success-result");
                successResultElem.empty();
                if (data.result.code != 200) {
                    failedResultElem.html("<span class=\"fail-msg\">系统异常，请稍后再试</span>");
                    $('#import-result').modal('show');
                    return;
                }
                if (data.result.invalidFileMsg) {
                    failedResultElem.html("<span class=\"fail-msg\">" + data.result.invalidFileMsg + "</span>");
                    $('#import-result').modal('show');
                    return;
                }

                if (data.result.msg.successCount > 0) {
                    successResultElem.html(
                        "导入成功<span class=\"number-char\">" +
                        data.result.msg.successCount +
                        "</span>条，总金额<span class=\"number-char\">" +
                        data.result.msg.successAmount +
                        "</span>元。");
                }

                if (data.result.msg.failedCount > 0) {
                    failedResultElem.html(
                        "导入失败<span class=\"number-char\">" +
                        data.result.msg.failedCount +
                        "</span>条，总金额<span class=\"number-char\">" +
                        data.result.msg.failedAmount +
                        "</span>元。");
                }

                var checkErrorFields = {
                    "emptyFieldRows": "字段为空",
                    "invalidFieldRows": "字段格式错误",
                    "invalidAmountRows": "金额格式错误",
                    "failedAddRows": "创建付款计划失败"
                };
                var errHtml = "";
                for (errField in checkErrorFields) {
                    if (data.result.msg[errField]) {
                        errHtml += generateErrHtml(data.result.msg[errField], checkErrorFields[errField]);
                    }
                }
                if (errHtml.length > 0) {
                    failedResultElem.html(failedResultElem.html() + "<div class='fail-msg' style='font-weight:bold'>导入失败记录</div><br>" + errHtml);
                }
                $('#import-result').modal('show');

                if(data.result.payPlanIdList.length > 0){
                    var ppids = data.result.payPlanIdList.join(",");
                    form.clean("payplan-search-form");
                    $("#businesstype").val(0);
                    $("#payType").empty();
                    var param = "businessType=" + $('#businesstype').val();
                    option.ajax("payType", "/settle/ajax/loadPayTypeOption", param, "option", 0);
                    $("#ppids").val(ppids);
                    $("#status").val(1);
                    $("#customerName").val("");
                    $("#customerName").attr("result", "0");

                    $("#search").click();
                }
            }
        });

        function generateErrHtml(errItems, title) {
            var errorContent = "<span class='fail-msg'>" + title + "</span>";
            errorContent += "<table class='table result-table'><tbody>";
            for (var i = 0; i < errItems.length; ++i) {
                errorContent += "<tr><td>" + errItems[i] + "</td></tr>";
            }
            errorContent += "</tbody></table>";
            return errorContent;
        }
    }

    $(document).ready(function() {

        $('body').on('click', function (e) {
            $('[data-toggle="popover"]').each(function () {
                if (!$(this).is(e.target)
                    && $(this).has(e.target).length === 0
                    && $('.popover').has(e.target).length === 0) {
                    $(this).popover('hide');
                }
            });
        });

        initialAddDialog();

        initialImportDialog();

        //init empty table
        list.empty("paymentplan_list", "NoRowsTemplate");

        $(".selected-payment").live("click", function() {
            var count = 0;
            var amount = 0;
            $.each($('.selected-payment'), function (index, el) {
                if ($(el)[0].checked) {
                    count++;
                    amount += parseFloat($(el).parent().parent().find(".pay-amount").text().replace(/,/g, "").trim());
                }
            });
            $(".selected-count").html(count);
            $(".selected-amount").html(pub.formatMoney(amount.toFixed(2)));
            if(count > 0) {
                $("#select-part-pageinfo").show();
                $("#select-cur-pageinfo").hide();
                $("#select-all-pageinfo").hide();
                ENV.data._allRecords = false;
            }
        });

        //init option content
        option.ajax("businessSource", "/settle/ajax/loadBusinessSourceOption", "", "option", 0);
        option.ajax("status", "/settle/ajax/loadPPStatusOption", "", "option", 0);
        ajax.post("/settle/ajax/loadBusinessTypeOption", "", function(data) {
            var order = bizTypeOrder.split(",");
            $("#businesstype").empty();
            var options = data.option;
            for(var key in options){
                if(order.indexOf(key) == -1){
                    order.push(key);
                }
            }
            for(var i = 0;i<order.length;i++) {
                if(options[order[i]]) {
                    $("#businesstype").append('<option value="' + order[i] + '">' + options[order[i]] + '</option>');
                }
            }
            var oldBooking = $('#businesstype').find("option[value=2]");
            oldBooking.attr("old-paymentplan", "true");
            var prepaidcard = $('#businesstype').find("option[value=4]");
            prepaidcard.attr("old-paymentplan", "true");
            $('#businesstype').find("option[value=2]").after("<option value='2' old-paymentplan='false'>预约预订-阿波罗</option>");

            var type = location.hash;
            if (type.indexOf("businesstype") > -1) {
                var bType = type.split('=')[1];//
                var options = $('#businesstype').find("option[value=" + bType + "]");
                if (options.length == 1) {
                    options.attr("selected", "selected")
                } else {
                    options.each(function(){
                        var option = $(this);
                        var old = option.attr("old-paymentplan");
                        if (old == "false") {
                            $(this).attr("selected", "selected")
                        }
                    });
                }
                $('#businesstype').trigger("change");
            }
        });
		var param = "businessType=" + $('#businesstype').val();
		option.ajax("payType", "/settle/ajax/loadPayTypeOption", param, "option", 0);

        //init date picker
        var date_format = {
            format: "yyyy-mm-dd",
            autoclose: true,
            language: "zh_CN",
            forceParse: false,
            startView: 2,
            minView:2
        };

        var datetime_format = {
            format: "yyyy-mm-dd hh:ii",
            autoclose: true,
            todayBtn: true,
            language: "zh_CN",
            forceParse: false
        }

        $('#datebegin').datetimepicker(date_format);
        $('#dateend').datetimepicker(date_format);
        $('#addbegindate').datetimepicker(date_format);
        $('#addenddate').datetimepicker(date_format);


        function switch_date_format(switcher, beginPicker, endPicker, dateformat, icon){
            $(switcher).find("i").removeClass("icon-calendar").removeClass("icon-time").addClass(icon);
            $(beginPicker).data('datetimepicker').remove();
            $(beginPicker).datetimepicker(dateformat);

            $(endPicker).data('datetimepicker').remove();
            $(endPicker).datetimepicker(dateformat);
        }

        $("#select-date-switcher").toggle(
            function(){
                switch_date_format($("#select-date-switcher"), $('#datebegin'), $('#dateend'), datetime_format, "icon-time");
                changeToMinuteDateFormat($('#datebegin_val'), $('#dateend_val'));
            },
            function(){
                switch_date_format($("#select-date-switcher"), $('#datebegin'), $('#dateend'), date_format, "icon-calendar");
                changeToDayDateFormat($('#datebegin_val'), $('#dateend_val'));
            }
        );

        $("#select-add-date-switcher").toggle(
            function(){
                switch_date_format($("#select-add-date-switcher"), $('#addbegindate'), $('#addenddate'), datetime_format, "icon-time");
                changeToMinuteDateFormat($('#addbegindate_val'), $('#addenddate_val'));
            },
            function(){
                switch_date_format($("#select-add-date-switcher"), $('#addbegindate'), $('#addenddate'), date_format, "icon-calendar");
                changeToDayDateFormat($('#addbegindate_val'), $('#addenddate_val'));
            }
        );

        $('#businesstype').bind("change", function(){
            $("#customerName").val("");
            $("#customerid").val("");
            var selectedOption = $(this).find(":selected");
            var redirect = selectedOption.attr("old-paymentplan");
            if (redirect && redirect == "true") {
                window.location.href = "/caiwu/paymentplan/paymentplanlist?status=1&businessType=" + selectedOption.val();
            }else{
				var param = "businessType=" + selectedOption.val();
				option.ajax("payType", "/settle/ajax/loadPayTypeOption", param, "option", 0);
			}
        })

        $('#businessSource').on("change", function(){
            var businessSource = $(this).val();
            if("5" == businessSource){
                //手工录入，不能用客户名查询
                $("#customerName").val("").attr("disabled", "true");
                $("#customerid").val("0").attr("disabled", "true");
            }else{
                $("#customerName").removeAttr("disabled");
                $("#customerid").removeAttr("disabled");
            }
        });

        //search payplan list
        $('#search').bind('click', function () {
            var businessType = $("#businesstype").val();
            var payplanIdList = $("#ppids").val();
            var payType = $("#payType").val();
            if(!payplanIdList || payplanIdList.trim() == ""){
                if(!businessType || "0" == businessType){
                    showError("请选择产品线");
                    $("#businesstype").addClass("error-input");
                    return;
                }

                if(!($("#datebegin_val").val() || $("#dateend_val").val() || $("#addbegindate_val").val() || $("#addenddate_val").val())){
                    showError("请选择应付日期或产生日期");
                    $("#datebegin_val").addClass("error-input");
                    $("#dateend_val").addClass("error-input");
                    return;
                }
            }
            var customerName = $("#customerName").val();
            var status = $("#status").val();
            var customerId = $("#customerid").val();
            if (customerName && (!customerId || customerId == "0")) {
                showError("请选择有效的客户名");
                $("#customerName").addClass("error-input");
                return;
            }
            list.init("list_model", "paymentplan_list", "pagination_bar", "", "", "NoRowsTemplate", "paymentplan_search", null, 1,  function(data){
                $(".recordCount").html(data.payPlanModel.recordCount);
                $(".totalAmount").html(data.totalAmount);
                $("#order-export").show();
                if (data.status == 1 && payType != 0) {
                    $('#submit-payplan').show()
                } else {
                    $('#submit-payplan').hide()
                }
                if(status == 10) {
                    $(".selected-payment").hide();
                }
                ENV.data._allRecords = false;
                $('#select-all-in-page').attr('checked', false);
                $('#select-all-pageinfo').hide();
                $('#select-cur-pageinfo').hide();
                $("#select-part-pageinfo").hide();
                $(".payorder-show").popover({
                    trigger: 'click',
                    animation: true,
                    html: true,
                    title: "付款信息",
                    content: function () {
                        return "<tr>" +
                                    "<th style='text-align:left; min-width:60px;'>付款单ID：</th>" +
                                    "<td style='text-align:left'>" + $(this).attr('payCode') + "</td>" +
                                "</tr>" +
                                "<tr>" +
                                    "<th style='text-align:left; min-width:60px;'>开户名：</th>" +
                                    "<td style='text-align:left'>" + $(this).attr('bankAccountName') + "</td>" +
                                "</tr>" +
                                "<tr>" +
                                    "<th style='text-align:left; min-width:60px;'>开户行：</th>" +
                                    "<td style='text-align:left'>" + $(this).attr('bankFullBranchName') + "</td>" +
                                "</tr>" +
                                "<tr>" +
                                    "<th style='text-align:left; min-width:60px;'>银行账号：</th>" +
                                    "<td style='text-align:left'>" + $(this).attr('bankAccountNo') + "</td>" +
                                "</tr>";
                    }
                });

            });
            if ($('#select-all-in-page')[0].checked) {
                $('#select-all-in-page').attr('checked', false);
                $('#select-all-pageinfo').hide();
                $("#select-part-pageinfo").hide();
                $('#select-cur-pageinfo').hide();
            }
        });

        $("#order-export").bind("click", function(){
            var param = "businessType=" + $("#businesstype").val();
			param += "&payType=" + $("#payType").val();
            param += "&customerID=" + $("#customerid").val();
            param += "&status=" + $("#status").val();
            param += "&ppIds=" + $("#ppids").val();
            param += "&memo=" + $("#memo").val();
            param += "&planBeginDate=" + $("#datebegin_val").val();
            param += "&planEndDate=" + $("#dateend_val").val();
            param += "&addBeginDate=" + $("#addbegindate_val").val();
            param += "&addEndDate=" + $("#addenddate_val").val();
            param += "&amount=" + $('#amount').val();

            var url = "/settle/ajax/exportPayPlan?" + param;
            url =encodeURI(url);
            window.open(url, "_blank");

            setTimeout(function(){
                $('#search').trigger("click");
            }, 3000);
        });

        $('#select-all-in-page').bind('click', function () {
            var checked = $('#select-all-in-page')[0].checked;
            var amount = 0;
            $.each($('.selected-payment'), function (index, el) {
                $(el).attr('checked', checked);
                amount += parseFloat($(el).parent().parent().find(".pay-amount").html().replace(/,/g, "").trim())
            });
            $(".selected-amount").html(pub.formatMoney(amount.toFixed(2)));
            if (checked) {
                $('#select-all-pageinfo').show();
                $("#select-part-pageinfo").hide();
            } else {
                $('#select-all-pageinfo').hide();
            }
            ENV.data._allRecords = false;
        });

        //选择所有
        $('#select-all-records').bind('click', function () {
            ENV.data._allRecords = true;
            $('#select-all-pageinfo').hide();
            $("#select-part-pageinfo").hide();
            $('#select-cur-pageinfo').show();
        });

        //取消勾选
        $('#select-cur-page').bind('click', function () {
            ENV.data._allRecords = false;
            $('#select-cur-pageinfo').hide();
            $('#select-all-pageinfo').hide();
            $("#select-part-pageinfo").hide();
            $('#select-all-in-page').attr('checked', false);
            $.each($('.selected-payment'), function (index, el) {
                $(el).attr('checked', false);
            });
        });

        $('#select-date').bind('change', function () {
            changeDateSelect();
        });

        $('#select-date').val("this_month");
        changeDateSelect();

        $('#select-add-date').bind('change', function () {
            changeAddDateSelect();
        });



        $('#submit-payplan').click(function() {
            loading.show();
            var param = {};
            param.allRecords = ENV.data._allRecords;

            var ppIds = [];
            $.each($('.selected-payment'), function (index, el) {
                var recJqObj = $(el)
                if (recJqObj[0].checked) {
                    ppIds.push(recJqObj.attr("pp-id"));
                }
            });
            if (ppIds.length === 0) {
                loading.hide();
                dialog.init("提交付款计划", "请勾选需要提交的记录！");
                return false;
            }

            if (ENV.data._allRecords) {
                buildSearchParam(param);
            } else {
                param.ppIds = ppIds.join(',');
            }


            $.ajax({
                type: "POST",
                url: "/settle/ajax/submitPayPlan",
                data: param
            }).done(function (data) {
                loading.hide();
                if (data.code == 200) {
                    dialog.init("提交付款计划", "成功提交" + data.msg.count + "条");
                    $('#status').val(1);
                    $('#search').trigger("click");
                } else {
                    dialog.init("提交结果", "提交失败");
                }
            });

        });

        $("#customerName").autocomplete("../ajax/fetchCustomerNameSuggestion", {
            max: 10, // 查询条数
            autoFill: false, // 是否自动填充输入框
            scroll: false,
            matchContains: true,
            matchCase: true,
            delay: 1000,
            clickFire: false,
            width: $("#customerName").width() + "px",
            extraParams: {
                "businessType": function () {
                    return $("#businesstype").val()
                }
            },
            beforeSearch: function () {
                var businessTypeField = $("#businesstype");
                if (!autoValidator.validate(businessTypeField[0])) {
                    showError(autoValidator.errorMsg());
                    businessTypeField.addClass("error-input");
                    return false;
                }
                return true;
            },
            parse: function (data) {
                var rows = [];
                if (!data.msg || !data.msg.suggestion) {
                    rows.push({
                        data: {
                            "customerId": "0",
                            "customerName": "无搜索结果"
                        },
                        value: "0",
                        result: "无搜索结果"
                    });
                    return rows;
                }
                var suggestions = data.msg.suggestion;
                for (var i = 0; i < suggestions.length; i++) {
                    rows.push({
                        data: suggestions[i],
                        value: suggestions[i].customerId + "",
                        result: suggestions[i].customerName
                    });
                }
                return rows;
            },
            formatItem: function (data, i, n, value) {
                return data.customerName;
            }
        });

        $("#customerName").keydown(function (event) {
            if (event.keyCode == 13) {
                return;
            }
            $("#customerid").val('');
            $("#customerName").flushCache();
        });

        $("#customerName").result(function (event, data, formatted) {
            if (data.customerId == "0") {
                $("#customerName").val('');
                $("#customerid").val('');
                $("#customerName").flushCache();
                return;
            }
            $("#customerName").val(data.customerName);
            $("#customerid").val(data.customerId);
        });

        $('.cancel-action').live('click', function () {
            var payPlanId = $(this).attr("payPlanId");
            if (!payPlanId) {
                showError("请选择要作废的付款计划！");
                return;
            }

            var dialogContent = "<label class='cancel-label'>确认要作废此付款计划？</label>" +
                "<div class='input-append'>" +
                "<input id='cancelReason' type='text' name='cancelReason' placeholder='请填写作废原因' >" +
                "</div>"
            dialog.init("作废付款计划", dialogContent, "确认", function () {
                $.ajax({
                    type: "post",
                    dataType: "json",
                    url: "../ajax/cancelPayPlan",
                    data: {
                        "payPlanId": payPlanId,
                        "cancelReason": $("#cancelReason").val()
                    },
                    success: function (data) {
                        if (data.code == 403) {
                            showError("您没有执行该请求的权限！");
                            return;
                        }
                        if (data.code != 200) {
                            showError("系统异常，请稍后再试！");
                            return;
                        }
                        if (data.msg['actionResult'] == "success") {
                            showTips(data.msg["message"]);
                            $('#search').trigger("click");
                        } else {
                            showError(data.msg["message"]);
                        }

                    }
                });
                dialog.hide();
            });
        });



    });


    function buildSearchParam(param) {
        param.businessType = $('#businesstype').val();
        param.payType = $('#payType').val();
        param.customerId = $('#customerid').val();
        param.planBeginDate = $('#datebegin_val').val();
        param.planEndDate = $('#dateend_val').val();
        param.status = $('#status').val();
        param.addBeginDate = $('#addbegindate_val').val();
        param.addEndDate = $('#addenddate_val').val();
        param.ppIds = $('#ppids').val();
        param.memo = $('#memo').val();
        param.amount = $('#amount').val();
        param.allRecords = true;
    }

    function showError(error) {
        var errorDiv = $(".tips-container .error:first")[0];
        errorDiv.innerHTML = error;
        errorDiv.style.display = 'block';
        setTimeout(hideError, 10000);
    }

    function hideError() {
        var errorDiv = $(".tips-container .error:first")[0];
        errorDiv.innerHTML = "";
        errorDiv.style.display = 'none';
    }

    function showTips(message) {
        var tipsDiv = $(".tips-container .tips:first")[0];
        tipsDiv.innerHTML = message;
        tipsDiv.style.display = 'block';
        setTimeout(hideTips, 10000);
    }

    function hideTips() {
        var tipsDiv = $(".tips-container .tips:first")[0];
        tipsDiv.innerHTML = "";
        tipsDiv.style.display = 'none';
    }

    function changeToDayDateFormat(startTimeInput, endTimeInput){
        if($(startTimeInput).val().length > 10) {
            $(startTimeInput).val($(startTimeInput).val().substring(0, 10));
        }

        if($(endTimeInput).val().length > 10) {
            $(endTimeInput).val($(endTimeInput).val().substring(0, 10));
        }
    }

    function changeToMinuteDateFormat(startTimeInput, endTimeInput){
        if($(startTimeInput).val().length == 10) {
            $(startTimeInput).val($(startTimeInput).val() + " 00:00");
        }

        if($(endTimeInput).val().length == 10) {
            $(endTimeInput).val($(endTimeInput).val()  + " 23:59");
        }
    }

    //应付日期默认值
    function changeDateSelect(){
        var v = $('#select-date').val();
        var dateMap = dateutil.calcDateSpan(v);
        var s = dateMap['s'];
        var e = dateMap['e'];
        $('#datebegin_val').val(s);
        $('#dateend_val').val(e);
        if($("#select-date-switcher").find("i").hasClass("icon-time")){
            changeToMinuteDateFormat($('#datebegin_val'), $('#dateend_val'));
        }
    };

    function changeAddDateSelect(){
        var v = $('#select-add-date').val();
        var dateMap = dateutil.calcDateSpan(v);
        var s = dateMap['s'];
        var e = dateMap['e'];
        $('#addbegindate_val').val(s);
        $('#addenddate_val').val(e);
        if($("#select-add-date-switcher").find("i").hasClass("icon-time")){
            changeToMinuteDateFormat($('#addbegindate_val'), $('#addenddate_val'));
        }
    };


});