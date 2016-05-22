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
    var ajax = require("./ajax");
    var dialog = require("./dialog");
    var date = require("./date");
    var autoValidator = require("./autovalidator");
    $(document).ready(function () {
        /**
         * 这段js是用来处理点击页面其他部分让popover消失
         */
        $('body').on('click', function (e) {
            $('[data-toggle="popover"]').each(function() {
                if (!$(this).is(e.target)
                    && $(this).has(e.target).length === 0
                    && $('.popover').has(e.target).length === 0) {
                    $(this).popover('hide');
                }
            });
        });
        list.empty("receiveorder_list", "NoRowsTemplate");
        //加载各种select
        option.ajax("q-businessType", "/exchange/ajax/loadProductLionOption", "", "option", 0);
        option.ajax("q-payChannel", "/exchange/ajax/loadReceiveOrderPayChannelOption", "", "option", 0);
        option.ajax("q-status", "/exchange/ajax/loadRNStatusOption", "", "option", 0);

        //银行账号随业务类型变化而变化
        $('#q-businessType').bind('change', function () {
            if($('#q-businessType').val()==0){
                $('#q-bankId').html("<option value='0'>请选择收款银行账户</option>");
            } else {
                option.ajax("q-bankId", "/exchange/ajax/loadReceiveBankOptionInQuery", "businessType=" + $('#q-businessType').val(), "option", 0);
            }
            $("#q-customerName").val("");
            $("#q-customerId").val("");
            $("#q-customerName").flushCache();
            $('#q-businessType').removeClass("error-input");
        });

        //init datepicker
        $('#q-br-begin-time').datepicker({format: 'yyyy-mm-dd'});
        $('#q-br-end-time').datepicker({format: 'yyyy-mm-dd'});

        //客户名提示
        $("#q-customerName").autocomplete("../ajax/fetchCustomerNameSuggestion", {
            max: 10, // 查询条数
            autoFill: false, // 是否自动填充输入框
            scroll: false,
            matchContains: true,
            matchCase: true,
            delay: 1000,
            clickFire: false,
            width: $("#q-customerName").width() + "px",
            extraParams: {
                "businessType": function () {
                    return $("#q-businessType").val()
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

        $("#q-customerName").keydown(function (event) {
            if (event.keyCode == 13) {
                return;
            }
            $("#q-customerId").val('');
            $("#q-customerName").flushCache();
        });

        $("#q-customerName").result(function (event, data, formatted) {
            if (data.customerId == "0") {
                $("#q-customerName").val('');
                $("#q-customerId").val('');
                $("#q-customerName").flushCache();
                return;
            }
            $("#q-customerName").val(data.customerName);
            $("#q-customerId").val(data.customerId);
        });


        //绑定search按钮
        $('#search').bind('click', function () {
            var customerName = $("#q-customerName").val();
            var customerId = $("#q-customerId").val();
            if (customerName && (!customerId || customerId == "0")) {
                showError("请选择有效的客户名");
                $("#q-customerName").addClass("error-input");
                return;
            }

            if (!$('#q-br-begin-time').val() && !$('#q-br-end-time').val()){
                showError("请设置打款日期");
                $("#q-br-begin-time").addClass("error-input");
                return;
            }

            list.init("list_model", "receivenotify_list", "pagination_bar", "", "", "NoRowsTemplate", "rn-search-form", null, 1,  function(data) {
                $(".recordCount").html(data.receiveNotifyModel.recordCount);
                $(".totalAmount").html(data.totalAmount);
                $(".rn-show").popover({
                    trigger: 'click',
                    placement: 'left',
                    animation: true,
                    html: true,
                    title: "收款单信息",
                    content: function () {
                        return "<tr><th style='text-align:left; min-width:70px;'>收款单ID：</th><td style='text-align:left'>" + $(this).attr('roMatchId')  + "</td></tr>"
                    }
                });

                //备注显示的优化，采用popover
                $(".memo-show").popover({
                    trigger: 'click',
                    placement: 'top',
                    animation: true,
                    html: true,
                    title: "备注信息",
                    content: function () {
                        return "<td style='text-align:left'>" + $(this).attr('memo')  + "</td></tr>"
                    }
                });
                $('.confirm-link').bind('click', function () {
                    var rnId = $(this).attr("rnid")
                    if (rnId) {
                        dialog.init("收款通知", "您将确认该收款通知", "确认", function () {
                            ajax.post("/exchange/ajax/confirmReceiveNotify", "rnId=" + rnId, function () {
                                $('#search').trigger("click");
                            })
                            dialog.hide();
                        });
                    }
                });
                $('.reject-link').bind('click', function () {
                    var rnId = $(this).attr("rnid")
                    if (rnId) {
                        var bodyHtml = "<table>" +
                            "<tr><td>您将驳回该收款通知</td></tr>" +
                            "<tr><td>驳回理由：<input type=\"text\" id=\"rejectReason\" class=\"form_value\"></td></tr>"
                            "</table>"
                        dialog.init("收款通知", bodyHtml, "确认", function () {
                            var rejectReason = $('#rejectReason').val();
                            ajax.post("/exchange/ajax/rejectReceiveNotify", "rnId=" + rnId + "&rejectReason=" + rejectReason, function () {
                                $('#search').trigger("click");
                            })
                            dialog.hide();
                            form.success('收款通知已驳回');
                        });

                    }
                });

                $("#receivenotify-export").show();
            });
        });

        //导出按钮
        $("#receivenotify-export").bind("click", function(){
            //check param
            var customerName = $("#q-customerName").val();
            var customerId = $("#q-customerId").val();
            if (customerName && (!customerId || customerId == "0")) {
                showError("请选择有效的客户名");
                $("#q-customerName").addClass("error-input");
                return;
            }

            if (!$('#q-br-begin-time').val() && !$('#q-br-end-time').val()){
                showError("请设置打款日期");
                $("#q-br-begin-time").addClass("error-input");
                return;
            }

            var url = "/exchange/ajax/receiveNotifyExport?";
            var param = "";

            param += "businessType=" + $("#q-businessType").val();
            param += "&customerId=" + $("#q-customerId").val();
            param += "&payChannel=" + $("#q-payChannel").val();
            param += "&receiveAmount=" + $("#q-receiveAmount").val();
            param += "&bankId=" + $("#q-bankId").val();
            param += "&status=" + $("#q-status").val();
            param += "&receiveTimeBegin=" + $("#q-br-begin-time").val();
            param += "&receiveTimeEnd=" + $("#q-br-end-time").val();

            url = encodeURI(url + param);
            window.open(url,"_blank" );
        });

        $('#q-select-br-time').bind('change', function () {
            changeBRTimeSelect();
        });

        var businessNameType = {
            "团购": 1,
            "预约预订": 2,
            "结婚亲子": 3,
            "储值卡": 4,
            "广告": 5,
            "默认": 0
        }
    });


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

    function changeBRTimeSelect(){
        var dateMap = initDateMap();
        var v = $('#q-select-br-time').val();
        var s = dateMap[v || '0']['s'];
        var e = dateMap[v || '0']['e'];
        $('#q-br-begin-time').val(s);
        $('#q-br-end-time').val(e);
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