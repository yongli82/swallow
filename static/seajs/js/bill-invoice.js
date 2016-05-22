define(function(require, exports, module) {
    var $ = require('jquery');
    require('datepicker');
    require('bootstrap');
    require('upload');
    require('./jquery.autocomplete')($);
    var list = require("./list");
    var form = require("./form");
    var option = require("./option");
    var loading = require("./loading");
    var dialog = require("./dialog");
    var date = require("./date");
    var autoValidator = require("./autovalidator");

    $(document).ready(function () {
        list.empty("invoice_list", "NoRowsTemplate");

        option.ajaxWithCallback("q-businessType", "/settle/ajax/loadBusinessTypeOptionByPermission", "", "option", 0, "post", function(){
            businessTypeChanged($("#q-businessType").val())
        });
        option.ajax("q-status", "/settle/ajax/loadInvoiceStatusOption", "", "option", 0);
        option.ajax("q-operationType", "/settle/ajax/loadOperationTypeOption", "", "option", 0);
        option.ajax("q-invoiceType", "/settle/ajax/loadInvoiceTypeOption", "", "option", 0);

        $('#q-invoice-begin-time').datepicker({format: 'yyyy-mm-dd'});
        $('#q-invoice-end-time').datepicker({format: 'yyyy-mm-dd'});
        $('#q-release-begin-time').datepicker({format: 'yyyy-mm-dd'});
        $('#q-release-end-time').datepicker({format: 'yyyy-mm-dd'});

        fetchSupportAutoInvoiceCompany();

        function businessTypeChanged(businessTypeVal) {
            /*
            if (businessTypeVal == 1) {
                $('#q-companyId').html("<option value='0'>请选择开票公司</option>");
                $('#q-companyId').append("<option value='2'>汉海上海</option>");
                $('#q-companyId').append("<option value='7'>互诚上海</option>");
                $('#q-companyId').val(0);
            } else if (businessTypeVal == 5) {
                option.ajax("q-companyId", "/settle/ajax/loadInvoiceCompanyOptionInQuery", "businessType=" + businessTypeVal, "option", 0);
            } else if (businessTypeVal == 2) {
                $('#q-companyId').html("<option value='0'>请选择开票公司</option>");
                $('#q-companyId').append("<option value='2'>汉海上海</option>");
                $('#q-companyId').append("<option value='5'>汉诚上海</option>");
                $('#q-companyId').append("<option value='7'>互诚上海</option>");
                $('#q-companyId').val(0);
            } else if (businessTypeVal == 6) {
                $('#q-companyId').html("<option value='0'>请选择开票公司</option>");
                $('#q-companyId').append("<option value='2'>汉海上海</option>");
                $('#q-companyId').append("<option value='7'>互诚上海</option>");
                $('#q-companyId').val(0);
            } else if (businessTypeVal == 11) {
                $('#q-companyId').html("<option value='7'>互诚上海</option>");
                $('#q-companyId').val(0);
            }
            else {
                $('#q-companyId').html("<option value='0'>请选择开票公司</option>");
            }
            */

            option.ajax("q-companyId", "/settle/ajax/loadCompanyListByBusiness", "serviceType=allowInvoice&businessType=" + businessTypeVal, "option", 0);

            $("#q-cityName").val("");
            $("#q-cityId").val("");
            $("#q-cityName").flushCache();
            $('#q-businessType').removeClass("error-input");
        }

        $('#q-businessType').on('change', function () {
            var businessTypeVal = $(this).val();
            businessTypeChanged(businessTypeVal)
        });

        $('#q-companyId').on('change', function(){

        });


        $("#q-cityName").autocomplete("../ajax/fetchCityNameSuggestion",{
            max: 10, // 查询条数
            autoFill: false, // 是否自动填充输入框
            scroll: false,
            matchContains: true,
            matchCase: true,
            delay: 1000,
            clickFire: false,
            width: $("#q-cityName").width() + "px",
            extraParams: {
                "cityName": function () {
                    return encodeURIComponent($("#q-cityName").val());
                }
            },
            beforeSearch: function () {
                var businessTypeField = $("#q-businessType");
                if (!autoValidator.validate(businessTypeField[0])) {
                    showError(autoValidator.errorMsg());
                    businessTypeField.addClass("error-input");
                    return false;
                }
                return true;
            },
            parse: function(data){
                var rows = [];
                if (!data.msg || !data.msg.suggestion) {
                    rows.push({
                        data: {
                            "cityId": "0",
                            "cityName": "无搜索结果"
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
                        value: suggestions[i].cityId + "",
                        result: suggestions[i].cityName
                    });
                }
                return rows;
            },

            formatItem: function(data, i, n, value) {
                return data.cityName;
            }
        });

        $("#q-cityName").keydown(function (event) {
            if (event.keyCode == 13) {
                return;
            }
            $("#q-cityId").val('');
            $("#q-cityName").flushCache();
        });

        $("#q-cityName").result(function (event, data, formatted) {
            if (data.cityId == "0") {
                $("#q-cityName").val('');
                $("#q-cityId").val('');
                $("#q-cityName").flushCache();
                return;
            }
            $("#q-cityName").val(data.cityName);
            $("#q-cityId").val(data.cityId);
        });

        $('#search').on('click', function () {
            var cityName = $("#q-cityName").val();
            var cityId = $("#q-cityId").val();
            if (cityName && (!cityId || cityId == "0")) {
                showError("请选择有效的客户名");
                $("#q-cityName").addClass("error-input");
                return;
            }

            list.init("list_model", "invoice_list", "pagination_bar", "", "", "NoRowsTemplate", "ro-search-form", null, 1,  function(data) {
                $(".recordCount").html(data.invoiceModel.recordCount);
                $(".totalAmount").html(data.totalAmount);
                var businessType = $('#q-businessType').val();
                var companyId = $('#q-companyId').val();

                var channels = supportedInvoiceChannel(businessType, companyId);
                var allowAutoInvoice =  channels["allowAutoInvoice"];
                var allowManualInvoice =  channels["allowManualInvoice"];

                $('#invoice-export-result').hide();
                $('#invoice-submit').hide();
                $('#invoice-export').hide();
                $('#btn-invoice-import').hide();

                if (data.status == 1) {
                    if (allowAutoInvoice) {
                        $('#invoice-export-result').show();
                        $('#invoice-submit').show();
                    }
                    if (allowManualInvoice){
                        $('#invoice-export-result').show();
                        $('#invoice-export').show();
                    }
                } else if (data.status == 2) {
                    if (allowAutoInvoice) {
                        $('#invoice-export-result').show();
                    }

                    if (allowManualInvoice){
                        $('#invoice-export-result').show();
                        $('#btn-invoice-import').show();
                    }
                } else {
                    if (allowAutoInvoice) {
                        $('#invoice-export-result').show();
                    }
                    if (allowManualInvoice){
                        $('#invoice-export-result').show();
                    }
                }
                ENV.data._allRecords = false;
                $('#select-all-in-page').attr('checked', false);
                $('#select-all-pageinfo').hide();
                $('#select-cur-pageinfo').hide();
            });
        });

        $('#select-all-in-page').bind('click', function () {
            var checked = $('#select-all-in-page')[0].checked;
            $.each($('.selected-invoice'), function (index, el) {
                $(el).attr('checked', checked);
            });

            if (checked) {
                $('#select-all-pageinfo').show();
            } else {
                $('#select-all-pageinfo').hide();
            }
            ENV.data._allRecords = false;
        });

        //选择所有
        $('#select-all-page').bind('click', function () {
            ENV.data._allRecords = true;
            $('#select-all-pageinfo').hide();
            $('#select-cur-pageinfo').show();
        });

        //取消勾选
        $('#select-cur-page').bind('click', function () {
            ENV.data._allRecords = false;
            $('#select-cur-pageinfo').hide();
            $('#select-all-pageinfo').hide();
            $('#select-all-in-page').attr('checked', false);
            $.each($('.selected-invoice'), function (index, el) {
                $(el).attr('checked', false);
            });
        });

        $('#invoice-export').click(function() {
            loading.show();
            var param = {};
            param.allRecords = ENV.data._allRecords;

            var ids = [];
            $.each($('.selected-invoice'), function (index, el) {
                var recJqObj = $(el)
                if (recJqObj[0].checked) {
                    ids.push(recJqObj.attr("invoiceId"));
                }
            });
            if (ids.length === 0) {
                loading.hide();
                dialog.init("开票导出", "请勾选需要导出的记录！");
                return false;
            }

            var url = ""
            if (!ENV.data._allRecords) {
                url="/settle/ajax/exportInvoice?invoiceIds="+ids.join(',') + "&updateStatus=true";
            } else {
                url = "/settle/ajax/exportAllInvoice?"
                    + "businessType=" + $('#q-businessType').val()
                    + "&cityId=" + $('#q-cityId').val()
                    + "&companyId=" + $('#q-companyId').val()
                    + "&status=" + $('#q-status').val()
                    + "&operationType=" + $('#q-operationType').val()
                    + "&invoiceType=" + $('#q-invoiceType').val()
                    + "&invoiceDateBegin=" + $('#q-invoice-begin-time').val()
                    + "&invoiceDateEnd=" + $('#q-invoice-end-time').val()
                    + "&invoiceTaxNos=" + $('#q-invoiceTaxNos').val()
                    + "&releaseDateBegin=" + $('#q-release-begin-time').val()
                    + "&releaseDateEnd=" + $('#q-release-end-time').val()
                    + "&memo=" + $('#q-memo').val()
                    + "&updateStatus=true";
            }

            window.open(url,'_blank');
            loading.hide();
            setTimeout(function(){
                $('#q-status').val(2);
                $('#search').trigger("click");
            }, 3000);

        });

        $('#invoice-export-result').click(function() {
            loading.show();
            var param = {};
            param.allRecords = ENV.data._allRecords;

            var ids = [];
            $.each($('.selected-invoice'), function (index, el) {
                var recJqObj = $(el)
                if (recJqObj[0].checked) {
                    ids.push(recJqObj.attr("invoiceId"));
                }
            });
            if (ids.length === 0) {
                loading.hide();
                dialog.init("开票导出", "请勾选需要导出的记录！");
                return false;
            }

            var url = "";
            if (!ENV.data._allRecords) {
                url="/settle/ajax/exportInvoice?invoiceIds="+ids.join(',');
            } else {
                url = "/settle/ajax/exportAllInvoice?"
                    + "businessType=" + $('#q-businessType').val()
                    + "&cityId=" + $('#q-cityId').val()
                    + "&companyId=" + $('#q-companyId').val()
                    + "&status=" + $('#q-status').val()
                    + "&operationType=" + $('#q-operationType').val()
                    + "&invoiceType=" + $('#q-invoiceType').val()
                    + "&invoiceDateBegin=" + $('#q-invoice-begin-time').val()
                    + "&invoiceDateEnd=" + $('#q-invoice-end-time').val()
                    + "&invoiceTaxNos=" + $('#q-invoiceTaxNos').val()
                    + "&releaseDateBegin=" + $('#q-release-begin-time').val()
                    + "&releaseDateEnd=" + $('#q-release-end-time').val()
                    + "&memo=" + $('#q-memo').val();
            }

            window.open(url,'_blank');
            loading.hide();
        });

        $('#invoice-submit').click(function() {
            loading.show();
            var param = {};
            param.allRecords = ENV.data._allRecords;

            var ids = [];
            $.each($('.selected-invoice'), function (index, el) {
                var recJqObj = $(el);
                if (recJqObj[0].checked) {
                    ids.push(recJqObj.attr("invoiceId"));
                }
            });
            if (ids.length === 0) {
                loading.hide();
                dialog.init("开票提交", "请勾选需要提交的记录！");
                return false;
            }

            var url = "";
            if (!ENV.data._allRecords) {
                url="/settle/ajax/submitByIds?invoiceIds="+ids.join(',');
            } else {
                url = "/settle/ajax/submitBySearchCondition?"
                    + "businessType=" + $('#q-businessType').val()
                    + "&cityId=" + $('#q-cityId').val()
                    + "&companyId=" + $('#q-companyId').val()
                    + "&status=" + $('#q-status').val()
                    + "&operationType=" + $('#q-operationType').val()
                    + "&invoiceType=" + $('#q-invoiceType').val()
                    + "&invoiceDateBegin=" + $('#q-invoice-begin-time').val()
                    + "&invoiceDateEnd=" + $('#q-invoice-end-time').val()
                    + "&invoiceTaxNos=" + $('#q-invoiceTaxNos').val()
                    + "&releaseDateBegin=" + $('#q-release-begin-time').val()
                    + "&releaseDateEnd=" + $('#q-release-end-time').val()
                    + "&memo=" + $('#q-memo').val();
            }

            $.ajax({
                type: "post",
                dataType: "json",
                url: url,
                success: function (data) {
                    if (data.code == 403) {
                        errorForUpload("您没有执行该请求的权限！");
                        return;
                    }
                    if (data.code != 200) {
                        errorForUpload("系统异常，请稍后再试！");
                        return;
                    }
                    dialog.init("提交开票成功", "成功提交" + data.msg.count + "条");
                    $('#q-status').val(2)
                    $('#search').trigger("click");
                },
                complete:function(){
                    loading.hide();

                }
            });


        });

        $("#chooseFile").on("click", function(){
            $("#import-file").trigger("click")
        });

        $("#import-file").on('change', function (event, files, label) {
            $('input[name="upload-file"]').val(this.value);
        });

        $('#import-file').fileupload({
            url: "../ajax/importInvoice",
            dataType: 'json',
            add: function (e, data) {
                // 删除之前注册的事件处理，防止重复提交
                $('#confirm-import').unbind("click");
                $('#confirm-import').click(function () {
                    var uploadFileField = $("input[name='upload-file']");
                    if (!autoValidator.validate(uploadFileField[0])) {
                        errorForUpload(autoValidator.errorMsg());
                        uploadFileField.addClass("error-input");
                        return;
                    }
                    uploadFileField.removeClass("error-input");
                    $('#import-invoice').modal('hide');
                    loading.show();
                    data.submit();
                });
            },
            done: function (e, data) {
                $("input[name='upload-file']").val("");
                loading.hide();
                var failedResultElem = $("#import-invoice-result .failed-result");
                failedResultElem.empty();
                var successResultElem = $("#import-invoice-result .success-result");
                successResultElem.empty();
                if (data.result.code == 403) {
                    failedResultElem.html("<span class=\"fail-msg\">您没有执行该操作的权限</span>");
                    $('#import-invoice-result').modal('show');
                    return;
                }
                if (data.result.code != 200) {
                    failedResultElem.html("<span class=\"fail-msg\">系统异常，请稍后再试</span>");
                    $('#import-invoice-result').modal('show');
                    return;
                }
                if (data.result.invalidFileMsg) {
                    failedResultElem.html("<span class=\"fail-msg\">" + data.result.invalidFileMsg + "</span>");
                    $('#import-invoice-result').modal('show');
                    return;
                }

                if (data.result.msg.totalCount > 0) {
                    successResultElem.html(
                            "导入成功<span class=\"number-char\">" +
                            data.result.msg.totalCount +
                            "</span>条，总金额<span class=\"number-char\">" +
                            data.result.msg.totalAmount +
                            "</span>元。");

                }

                var checkErrorFields = {
                    "emptyFieldRows": "字段为空",
                    "invalidAmountRows": "金额格式错误",
                    "invalidInvoiceIdRows": "开票ID错误",
                    "invalidTaxNoRows": "金税发票错误",
                    "invalidReverseTaxNoRows": "冲销发票错误",
                    "invalidDateRows": "开票日期错误",
                    "duplicateRows": "字段重复",
                    "duplicateInvoiceTaxNo": "金税发票号重复",
                    "duplicateReverseTaxNo": "冲销发票号重复",
                    "updateFailedRows": "导入失败"
                };
                var errHtml = "";
                for (errField in checkErrorFields) {
                    if (data.result.msg[errField]) {
                        errHtml += generateErrHtml(data.result.msg[errField], checkErrorFields[errField]);
                    }
                }
                if (errHtml.length > 0) {
                    failedResultElem.html("<div class='fail-msg' style='font-weight:bold'>导入失败记录</div><br>" + errHtml);
                    $('#import-invoice-result').modal('show');
                } else {
                    $('#import-invoice-result').modal('show');
                    setTimeout(function () {
                        $('#q-status').val(3)
                        $('#search').trigger("click");
                    }, 3000);
                }
            }
        });


        $('#q-select-invoice-time').on('change', function () {
            changeInvoiceTimeSelect();
        });

        $('#q-select-release-time').on('change', function () {
            changeReleaseTimeSelect();
        });

        $(".edit-express").live('click', function() {
            var invoiceID = $(this).attr("invoice-id");
            var expressNo = $(this).attr("express-no");
            if (!invoiceID) {
                errorForUpload("请选择要修改快递单号的发票！");
                return;
            }

            var dialogContent = "<label class='express-label'>请填写快递单号:</label>" +
                "<div class='input-append'>" +
                "<input value='" + expressNo +
                "' id='new-express' type='text' name='expressNo' placeholder='请注意无需输入空格' />" +
                "</div>";

            dialog.init("修改快递单号", dialogContent, "确认", function () {
                $.ajax({
                    type: "post",
                    dataType: "json",
                    url: "/settle/ajax/updateExpressNo",
                    data: {
                        "invoiceID": invoiceID,
                        "expressNo": $("#new-express").val()
                    },
                    success: function (data) {
                        if (data.code == 403) {
                            errorForUpload("您没有执行该请求的权限！");
                            return;
                        }
                        if (data.code != 200) {
                            errorForUpload("系统异常，请稍后再试！");
                            return;
                        }
                        if (data.msg['actionResult'] == "success") {
                            showTips(data.msg["message"]);
                            $('#search').trigger("click");
                        } else {
                            errorForUpload(data.msg["message"]);
                        }

                    }
                });
                dialog.hide();
            });
        });

        $('.cancel-action').live('click', function () {
            var invoiceId = $(this).attr("invoice-id");
            if (!invoiceId) {
                errorForUpload("请选择要作废的发票！");
                return;
            }

            var invoiceStatus = $(this).attr("invoice-status");

            var dialogContent = "<label class='cancel-label'>确认要作废此发票？</label>" +
                "<div class='well'>" +
                    "<p>发票状态: " + $(this).attr("invoice-status-string") + "</p>" +
                    "<p>发票抬头: " + $(this).attr("invoice-title") + "</p>" +
                    "<p>发票金额: " + $(this).attr("invoice-amount") + "</p>" +
                    "<p>金税发票号: " + $(this).attr("invoice-tax-no") + "</p>" +
                "</div>" +
                "<div class='input-append'>" +
                    "<input id='cancelReason' type='text' name='cancelReason' placeholder='请填写作废原因' >" +
                "</div>";
            dialog.init("作废发票", dialogContent, "确认", function () {
                $.ajax({
                    type: "post",
                    dataType: "json",
                    url: "/settle/ajax/cancelInvoice",
                    data: {
                        "invoiceId": invoiceId,
                        "preStatus": invoiceStatus,
                        "cancelReason": $("#cancelReason").val()
                    },
                    success: function (data) {
                        if (data.code == 403) {
                            errorForUpload("您没有执行该请求的权限！");
                            return;
                        }
                        if (data.code != 200) {
                            errorForUpload("系统异常，请稍后再试！");
                            return;
                        }
                        if (data.msg['actionResult'] == "success") {
                            showTips(data.msg["message"]);
                            $('#search').trigger("click");
                        } else {
                            errorForUpload(data.msg["message"]);
                        }

                    }
                });
                dialog.hide();
            });
        });
    });

    var autoInvoiceCompany = {};

    function fetchSupportAutoInvoiceCompany() {
        $.ajax({
            type: "GET",
            dataType: "json",
            url: "../ajax/fetchSupportAutoInvoiceCompany",
            success: function (data) {
                if (data.code != 200) {
                    return;
                }
                var company = data.msg['company'];
                if (company) {
                    autoInvoiceCompany = JSON.parse(company);
                }
            }
        });
    }

    function isSupportAutoInvoice(businessType, companyId) {
        //var key = "P" + businessType + "C" + companyId;
        //return autoInvoiceCompany.hasOwnProperty(key)
        var isSupport = false;
        $.ajax({
            async: false,
            type: "POST",
            dataType: "json",
            url: "/settle/ajax/loadCompanyBusinessInfo",
            data: {"businessType": businessType, "companyId": companyId},
            success: function (data) {
                if (data.code != 200) {
                    return;
                }
                var result  = data.msg['result'];
                console.log(result);
                if(result){
                    isSupport = (result["allowAutoInvoice"] == "1");
                }
            }
        });

        console.log("isSupportAutoInvoice=" + isSupport);
        return isSupport;
    }

    function supportedInvoiceChannel(businessType, companyId) {
        var channel = {
            "allowAutoInvoice": false,
            "allowManualInvoice": false
        };
        $.ajax({
            async: false,
            type: "POST",
            dataType: "json",
            url: "/settle/ajax/loadCompanyBusinessInfo",
            data: {"businessType": businessType, "companyId": companyId},
            success: function (data) {
                if (data.code != 200) {
                    return;
                }
                var result  = data.msg['result'];
                console.log(result);
                if(result){
                    channel["allowAutoInvoice"] = (result["allowAutoInvoice"] == "1");
                    channel["allowManualInvoice"] = (result["allowManualInvoice"] == "1");
                }
            }
        });

        console.log("channel=" + channel);
        return channel;
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

    function generateErrHtml(errItems, title) {
        var errorContent = "<span class='fail-msg'>" + title + "</span>";
        errorContent += "<table class='table result-table'><tbody>";
        for (var i = 0; i < errItems.length; ++i) {
            errorContent += "<tr><td>" + errItems[i] + "</td></tr>";
        }
        errorContent += "</tbody></table>";
        return errorContent;
    }

    function changeInvoiceTimeSelect(){
        var dateMap = initDateMap();
        var v = $('#q-select-invoice-time').val();
        var s = dateMap[v || '0']['s'];
        var e = dateMap[v || '0']['e'];
        $('#q-invoice-begin-time').val(s);
        $('#q-invoice-end-time').val(e);
    }

    function changeReleaseTimeSelect(){
        var dateMap = initDateMap();
        var v = $('#q-select-release-time').val();
        var s = dateMap[v || '0']['s'];
        var e = dateMap[v || '0']['e'];
        $('#q-release-begin-time').val(s);
        $('#q-release-end-time').val(e);
    }

    function errorForUpload(error) {
        var errorDiv = $(".tips-container .error:first")[0];
        errorDiv.innerHTML = error;
        errorDiv.style.display = 'block';
        setTimeout(hideErrorForUpload, 10000);
    }

    function hideErrorForUpload() {
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

    function initDateMap(){
        var now = new Date();
        var dateMap = {
            '99': {
                s: '',
                e: ''
            },
            '0': {
                s: '',
                e: now.defaultFormat()
            },
            '1': {
                s: now.defaultFormat(),
                e: now.defaultFormat()
            },
            '2': {
                s: now.pre(1).defaultFormat(),
                e: now.pre(1).defaultFormat()
            },
            '3': {
                s: now.pre(2).defaultFormat(),
                e: now.pre(2).defaultFormat()
            }
        };
        return dateMap;
    };
});