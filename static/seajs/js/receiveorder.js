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

    var suggestionSize = 20;

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
        $('#bankReceiveTime-cntr').hide();
        list.empty("receiveorder_list", "NoRowsTemplate");
        option.ajax("businessType", "/exchange/ajax/loadProductLionOption", "", "option", 0);
        option.ajaxWithCallback("payChannel", "/exchange/ajax/loadReceiveOrderPayChannelOption", "", "option", 0, "post", function () {
            $("#payChannel option:eq(0)").text("请选择收款方式")
        });
        option.ajax("q-businessType", "/exchange/ajax/loadProductLionOption", "", "option", 0);
        option.ajax("q-payChannel", "/exchange/ajax/loadReceiveOrderPayChannelOption", "", "option", 0);
        option.ajax("q-status", "/exchange/ajax/loadROStatusOption", "", "option", 0);

        $('#m-receiveTime').datepicker({format: 'yyyy-mm-dd'});
        $('#bankReceiveTime').datepicker({format: 'yyyy-mm-dd'});
        $('#bankReceiveTime').val(date.trans(new Date().getTime(),"yyyy-MM-dd"));

        $('#q-br-begin-time').datepicker({format: 'yyyy-mm-dd'});
        $('#q-br-end-time').datepicker({format: 'yyyy-mm-dd'});
        $('#q-receive-begin-time').datepicker({format: 'yyyy-mm-dd'});
        $('#q-receive-end-time').datepicker({format: 'yyyy-mm-dd'});

        $('#q-businessType').bind('change', function () {
            if($('#q-businessType').val() == 0){
                $('#q-bankId').html("<option value='0'>请选择收款银行账户</option>");
                $('#q-receiveType').html("<option value='0'>请选择业务类型</option>");
            } else {
                option.ajax("q-bankId", "/exchange/ajax/loadReceiveBankOptionInQuery", "businessType=" + $('#q-businessType').val(), "option", 0);
                option.ajax("q-receiveType", "/exchange/ajax/loadReceiveTypeOptionInQuery", "businessType=" + $('#q-businessType').val(), "option", 0);
            }
            $("#q-customerName").val("");
            $("#q-customerId").val("");
            $("#q-customerName").flushCache();
            $('#q-businessType').removeClass("error-input");
        });

        $("#q-customerName").autocomplete("../ajax/fetchCustomerNameSuggestion", {
            max: suggestionSize, // 查询条数
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


        $('#payChannel').bind('change', function () {
           if($('#payChannel').val()==3){
               $('#bankReceiveTime-cntr').show();
               $('#bankReceiveTime').addClass('form_value');
           } else {
               $('#bankReceiveTime-cntr').hide();
               $('#bankReceiveTime').removeClass('form_value');
           }
        });
        $('#businessType').bind('change', function () {
            if($('#businessType').val()==0){
                $('#bankId').html("<option value='0'>请选择收款银行账户</option>");
                $('#receiveType').html("<option value='0'>请选择业务类型</option>");
            } else {
                option.ajaxWithCallback("bankId", "/exchange/ajax/loadReceiveBankOption", "businessType=" + $('#businessType').val(), "option", 0, "post", function(){
                    var optionSize = $("#bankId option").size();
                    if (optionSize > 1) {
                        $("#bankId option:eq(0)").text("请选择收款银行账户")
                    }
                    // 如果只有一项，则直接选择
                    if (optionSize == 2) {
                        $("#bankId").val($("#bankId option:eq(1)").val());
                    }
                });
                option.ajaxWithCallback("receiveType", "/exchange/ajax/loadReceiveTypeOptionByPL", "businessType=" + $('#businessType').val(), "option", 0, "post", function(){
                    var optionSize = $("#receiveType option").size();
                    if (optionSize > 1) {
                        $("#receiveType option:eq(0)").text("请选择收款类型")
                    }

                    // 如果只有一项，则直接选择
                    if (optionSize == 2) {
                        $("#receiveType").val($("#receiveType option:eq(1)").val());
                        $("#receiveType").trigger("change");
                    }
                    if (optionSize == 1) {
                        $("#receiveType").trigger("change");
                    }
                    // 如果是团购，则默认选中电汇
                    if ($('#businessType').val() == 1) {
                        $('#payChannel').val(3);
                        $('#payChannel').trigger("change");
                    }
                });
                //手工录入，如果是团购，合同号非必填
                if ($('#businessType').val() == 1) {
                    $("#ro-add-bizContent").html("");
                    $("#bizContent").removeAttr("validate");
                    $("#biz-content-label").text("合同号");
                } else if ($('#businessType').val() == 5) {
                    $("#ro-add-bizContent").html("*");
                    $("#bizContent").attr("validate","+");
                    $("#biz-content-label").text("合同号");
                }
            }
            $("#customerName").val("");
            $("#customerId").val("");
            $("#customerName").flushCache();
            $('#businessType').removeClass("error-input");
        });



        $("#receiveType").on("change", function(){
            var businessType = $('#businessType').val();
            var receiveType = $(this).val();
            // 团购保底款
            if (businessType == 1 && receiveType == 5) {
                $("#biz-content-label").text("保底单号");
                $("#ro-add-bizContent").html("*");
                $("#bizContent").removeAttr("validate");
                $("#bizContent").hide();
                $("#bizContent-select").attr("validate", "ne[0]");
                $("#bizContent-select").show();
            } else {
                if (businessType == 5) {
                    $("#ro-add-bizContent").html("*");
                } else {
                    $("#ro-add-bizContent").html("");
                }
                $("#bizContent").remove("validate");
                $("#bizContent").val("");
                $("#bizContent").show();
                $("#bizContent-select").removeAttr("validate");
                $("#bizContent-select").hide();
                $("#biz-content-label").text("合同号");
            }
        });
        $("#bizContent-select").on("change", function(){
            $("#bizContent").val($(this).val());
            var option = $(this).find("option:selected");
            var leftAmount = option.attr("left-amount");
            if (leftAmount) {
                $("#receiveAmount").val(leftAmount)
            }
        });

//        $('#customerName').bind('click', function () {});
        $('#bankId').bind('change', function () {});
        $('#add-ro').bind('click', function () {
            var customerIdInput = $("#customerId");
            if (!autoValidator.validate(customerIdInput[0])) {
                errorForUpload(autoValidator.errorMsg());
                customerIdInput.addClass("error-input");
                $("#customerName").addClass("error-input");
                return;
            }
            var applicationId = $("#applicationId");
            if (applicationId.val()) {
                if ($("#receiveType").val() == 0) {
                    errorForUpload("请选择收款类型！");
                    $("#receiveType").addClass("error-input");
                    return;
                }
                if ($("#receiveAmount").val() == 0) {
                    errorForUpload("请填写收款金额！");
                    $("#receiveAmount").addClass("error-input");
                    return;
                }
                if ($("#bizContent").val() == 0) {
                    errorForUpload("请填写合同号！");
                    $("#bizContent").addClass("error-input");
                    return;
                }
                if ($("#customerId").val() == 0) {
                    errorForUpload("请输入有效的客户名！");
                    $("#customerName").addClass("error-input");
                    return;
                }
            }

            form.defaultSubmit("add-ro-form","","",null,function(data){
                   if(data.code==200){
                       form.success("收款单录入成功！");
                       form.clean("add-ro-form");
                       $("#customerName").removeAttr("readonly")
                       $("#customerName").removeClass("input-readonly")

                       $('#bankId').html("<option value='0'>请选择收款银行账户</option>");
                       $('#receiveType').html("<option value='0'>请选择业务类型</option>");
                       $('#businessType').val(0);
                       $('#payChannel').val(0);
                       $('#bankReceiveTime').val(date.trans(new Date().getTime(),"yyyy-MM-dd"));
                       $('#bankReceiveTime-cntr').hide();
                       $("#add-ro-dialog").modal('hide');
                       $("#bizContent-select").empty();
                       $("#bizContent-select").hide();
                       $("#bizContent").val("");
                       $("#bizContent").show();
                   } else {
                       form.fail("收款单录入失败！");
                   }

               })
        });

        $('#modify-ro').bind('click',function() {
            var customerName = $("#m-customerName").val();
            var customerId = $("#m-customerId").val();
            if (customerName && (customerId == "" || customerId == "0")) {
                errorForUpload("请选择有效的客户名");
                $("#m-customerName").addClass("error-input");
                return;
            }

            var applicationId = $("#m-applicationId").val();
            if (applicationId) {
                if ($("#m-receiveType").val() == 0) {
                    errorForUpload("请选择收款类型！");
                    $("#m-receiveType").addClass("error-input");
                    return;
                }
                if ($("#m-bizContent").val() == 0) {
                    errorForUpload("请填写合同号！");
                    $("#m-bizContent").addClass("error-input");
                    return;
                }
                if ($("#m-customerId").val() == 0) {
                    errorForUpload("请输入有效的客户名！");
                    $("#m-customerName").addClass("error-input");
                    return;
                }
            }

            if ($("#m-receiveType").val() != 0
                && $("#m-receiveTime").val() != ""
                && $("#m-customerId").val() != ""
                && $("#m-customerId").val() != "0" ) {
                //团购收款单修改，对合同号不做验证
                var busi = $("#m-businessType").text();
                if (($("#m-businessType").text() == "广告"&& $("#m-bizContent").val() != "")||
                    $("#m-businessType").text() == "团购") {
                    dialog.init("提交确认","您将确认收款","确认",function(){
                        form.paramSubmit("modify-ro-form", "", "status=2", null, function (data) {
                            if (data.code == 200) {
                                form.success("收款单修改成功并已提交！");
                                form.clean("modify-ro-form");
                                $('#m-receiveType').val(0);
                                $("#modify-ro-dialog").modal('hide');
                                $("#search").trigger("click");
                            } else {
                                form.fail("收款单修改与提交失败！");
                            }
                        });
                        dialog.hide();
                    });
                }
                else {
                    form.paramSubmit("modify-ro-form", "", "status=1", null, function (data) {
                        if (data.code == 200) {
                            form.success("收款单修改成功！");
                            form.clean("modify-ro-form");
                            $('#m-receiveType').val(0);
                            $("#modify-ro-dialog").modal('hide');
                            $("#search").trigger("click");
                        } else {
                            form.fail("收款单修改失败！");
                        }
                        $("#m-customerName").removeAttr("readonly")
                        $("#m-customerName").removeClass("input-readonly")
                    });
                }
            } else {
                form.paramSubmit("modify-ro-form", "", "status=1", null, function (data) {
                    if (data.code == 200) {
                        form.success("收款单修改成功！");
                        form.clean("modify-ro-form");
                        $('#m-receiveType').val(0);
                        $("#modify-ro-dialog").modal('hide');
                        $("#search").trigger("click");
                    } else {
                        form.fail("收款单修改失败！");
                    }
                    $("#m-customerName").removeAttr("readonly")
                    $("#m-customerName").removeClass("input-readonly")
                });
            }
        });
        $("#m-bizContent").change(function(){
            var businessType = businessNameType[$("#m-businessType").text()];
            var bizContent = $(this).val()
            if (bizContent) {
                ajax.post("/exchange/ajax/fetchCustomerInfo", {
                    "businessType": businessType,
                    "bizContent": bizContent
                }, function(data){
                    if (data.code != 200) {
                        showError("获取客户信息失败");
                        return;
                    }
                    if (!data.msg || !data.msg.customerInfoBean) {
                        showError("获取客户信息失败");
                        return;
                    }

                    var customerId = data.msg.customerInfoBean.customerId;
                    var customerName = data.msg.customerInfoBean.customerName;
                    if (customerId > 0) {
                        $("#m-customerName").val(customerName);
                        $("#m-customerId").val(customerId);
                        $("#m-customerName").attr("readonly", "readonly");
                        $("#m-customerName").addClass("input-readonly");
                    }
                })
            }
        });
        $("#m-bizContent").keydown(function(){
            $("#m-customerName").removeAttr("readonly")
            $("#m-customerName").removeClass("input-readonly")
        });

        $("#bizContent").change(function () {
            var businessTypeField = $("#businessType");
            if (!autoValidator.validate(businessTypeField[0])) {
                showError(autoValidator.errorMsg());
                businessTypeField.addClass("error-input");
                return;
            }

            var bizContent = $(this).val()
            if (bizContent) {
                ajax.post("/exchange/ajax/fetchCustomerInfo", {
                    "businessType": businessTypeField.val(),
                    "bizContent": bizContent
                }, function (data) {
                    if (data.code != 200) {
                        showError("获取客户信息失败");
                        return;
                    }
                    if (!data.msg || !data.msg.customerInfoBean) {
                        showError("获取客户信息失败");
                        return;
                    }

                    var customerId = data.msg.customerInfoBean.customerId;
                    var customerName = data.msg.customerInfoBean.customerName;
                    if (customerId > 0) {
                        $("#customerName").val(customerName);
                        $("#customerId").val(customerId);
                        $("#customerName").attr("readonly", "readonly");
                        $("#customerName").addClass("input-readonly");
                    }
                })
            }
        });

        $("#bizContent").keydown(function () {
            $("#customerName").removeAttr("readonly")
            $("#customerName").removeClass("input-readonly")
        });

        $("#applicationId").change(function () {
            var businessTypeField = $("#businessType");
            if (!autoValidator.validate(businessTypeField[0])) {
                showError(autoValidator.errorMsg());
                businessTypeField.addClass("error-input");
                return;
            }

            var applicationId = $(this).val()
            if (applicationId) {
                ajax.post("/exchange/ajax/loadReceiveOrderInfo", {
                    "businessType": businessTypeField.val(),
                    "applicationId": applicationId
                }, function (data) {
                    if (data.code != 200) {
                        showError("获取收款通知信息失败！");
                        return;
                    }
                    if (!data.msg || !data.msg.receiveInfo) {
                        showError("获取收款通知信息失败！");
                        return;
                    }

                    var customerId = data.msg.receiveInfo.customerId;
                    var customerName = data.msg.receiveInfo.customerName;
                    var receiveAmount = data.msg.receiveInfo.receiveAmount;
                    var payChannel = data.msg.receiveInfo.payChannel;
                    var bizContent = data.msg.receiveInfo.bizContent;
                    var bankId = data.msg.receiveInfo.bankId;
                    var payTime = data.msg.receiveInfo.payTime;
                    if (customerName) {
                        $("#customerName").val(customerName);
                        $("#customerId").val(customerId);
                        $("#customerName").attr("readonly", "readonly");
                        $("#customerName").addClass("input-readonly");
                    }
                    $("#receiveAmount").val(receiveAmount);
                    $("#bizContent").val(bizContent);
                    $("#payChannel").val(payChannel);
                    $("#payChannel").trigger("change");
                    $("#bankReceiveTime").val(payTime);
                    $("#bankId").val(bankId);
                })
            }
        });
        $("#applicationId").keydown(function () {
            $("#customerName").removeAttr("readonly")
            $("#customerName").removeClass("input-readonly")
        });

        $("#m-applicationId").change(function () {
            var businessType = businessNameType[$("#m-businessType").text()]
            var applicationId = $(this).val()
            if (applicationId) {
                ajax.post("/exchange/ajax/loadReceiveOrderInfo", {
                    "businessType": businessType,
                    "applicationId": applicationId
                }, function (data) {
                    if (data.code != 200) {
                        showError("获取收款通知信息失败！");
                        return;
                    }
                    if (!data.msg || !data.msg.receiveInfo) {
                        showError("获取收款通知信息失败！");
                        return;
                    }

                    var customerId = data.msg.receiveInfo.customerId;
                    var customerName = data.msg.receiveInfo.customerName;
                    var bizContent = data.msg.receiveInfo.bizContent;
                    if (customerName) {
                        $("#m-customerName").val(customerName);
                        $("#m-customerId").val(customerId);
                        $("#m-customerName").attr("readonly", "readonly");
                        $("#m-customerName").addClass("input-readonly");
                    }
                    $("#m-bizContent").val(bizContent);
                })
            }
        });
        $("#m-applicationId").keydown(function () {
            $("#m-customerName").removeAttr("readonly")
            $("#m-customerName").removeClass("input-readonly")
        });

        $('#search').bind('click', function () {
            var customerName = $("#q-customerName").val();
            var customerId = $("#q-customerId").val();
            if (customerName && (!customerId || customerId == "0")) {
                showError("请选择有效的客户名");
                $("#q-customerName").addClass("error-input");
                return;
            }

            if (!$('#q-br-begin-time').val() && !$('#q-br-end-time').val()
                && !$('#q-receive-begin-time').val() && !$('#q-receive-end-time').val()){
                showError("请设置到款日期或系统入账日期");
                $("#q-br-begin-time").addClass("error-input");
                return;
            }

            list.init("list_model", "receiveorder_list", "pagination_bar", "", "", "NoRowsTemplate", "ro-search-form", null, 1,  function(data) {
                $(".recordCount").html(data.receiveOrderModel.recordCount);
                $(".totalAmount").html(data.totalAmount);
                $("#order-export").show();
                $('.modify-link').bind('click', function () {
                    form.clean("modify-ro-form");
                    form.load("modify-ro-form","roId="+this.getAttribute('roId'),"","receiveOrder",function(data){
                        option.ajaxWithCallback("m-receiveType", "/exchange/ajax/loadReceiveTypeOptionInQuery", "businessType=" + data.receiveOrderData.businessType, "option", data.receiveOrderData.receiveType,null,function(data){
                            if (!$("#m-receiveTime").val()) {
                                $("#m-receiveTime").val(new Date().format("yyyy-MM-dd"));
                            }

                            var optionSize = $("#m-receiveType option").size();
                            if (optionSize > 1) {
                                $("#m-receiveType option:eq(0)").text("请选择收款类型")
                            }

                            // 如果只有一项，则直接选择
                            if (optionSize == 2) {
                                $("#m-receiveType").val($("#m-receiveType option:eq(1)").val());
                            }


                            if($("#m-shopId").html() == "0"){
                                $("#m-shopId").html("");
                            }
                            $("#modify-ro-dialog").modal('show');
                        });
                    });
                });

                $('.confirm-link').bind('click', function () {
                    //list.empty("ronotify_list","NoNotifiesTemplate");
                    document.getElementById("ronotify_list").setAttribute("roId",this.getAttribute('roId'));
                    document.getElementById("rnorder_list").setAttribute("roId",this.getAttribute('roId'));
                    //收款单列表，其实只有一个数据，放弃list库，重新写js代码
                    /*list.init("rnorderlist_model","rnorder_list",null,"","roId="+this.getAttribute('roId'),
                        null,null,null,null,function(data){});*/
                    myList("rnorderlist_model","rnorder_list","roId="+this.getAttribute('roId'),null,null);
                    //收款通知列表
                    //list.init("ronotifylist_model","ronotify_list",null,"","roMatcherId="+this.getAttribute('roId'),"NoNotifiesTemplate",null,null,null,function(data){
                    myList("ronotifylist_model","ronotify_list","roMatcherId="+this.getAttribute('roId'),"NoNotifiesTemplate",function(data){
                        $("#ro-notify-dialog").modal('show');
                        $('.rorn-confirm-link').bind('click', function () {
                            ajax.post("/exchange/ajax/confirmNotify","roId="+document.getElementById("ronotify_list").getAttribute("roId")+"&rnId="+this.getAttribute("rnId"),function(data){
                                if(data.code == 200){
                                    $("#ro-notify-dialog").modal('hide');
                                    $('#search').trigger('click');
                                } else {
                                    dialog.init("关联失败","关联收款通知失败，请刷新重试或联系系统管理员");
                                }
                            });
                        });
                        $('.rorn-cancel-link').bind('click', function () {
                            var _this = this;
                            ajax.post("/exchange/ajax/rornCancelLink","roMatcherId="+document.getElementById("ronotify_list").getAttribute("roId")+"&rnId="+this.getAttribute("rnId"),function(data){
                                if(data.code == 200){
                                    var index=_this.parentNode.parentNode.rowIndex - 1;
                                    document.getElementById('ronotify_list').deleteRow(index);
                                } else {
                                    dialog.init("取消关联失败","取消关联收款通知失败，请刷新重试或联系系统管理员");
                                }
                            });
                        });
                    });
                    //给收款单赋值   页面传值的方式被否决了，需要从后台读取
                    /*$("#rn_roId").text(this.getAttribute('roId'));
                    $("#rn_customerName").text(this.getAttribute('customerName'));
                    $("#rn_receiveAmount").text(this.getAttribute('receiveAmount'));
                    $("#rn_receiveTime").text(this.getAttribute('receiveTime'));
                    $("#rn_payerName").text(this.getAttribute('payerName'));
                    $("#rn_receiveType").text(this.getAttribute('receiveType'));
                    $("#rn_bizContent").text(this.getAttribute('bizContent'));
                    $("#rn_payChannel").text(this.getAttribute('payChannel'));
                    $("#rn_memo").text(this.getAttribute('memo'));*/
                });

                $(".ro-show").popover({
                    trigger: 'click',
                    placement: 'left',
                    animation: true,
                    html: true,
                    title: "银行帐号信息",
                    content: function () {
                        return "<tr><th style='text-align:left; min-width:70px;'>银行交易流水：</th><td style='text-align:left'>" + $(this).attr('tradeNo') +
                            "</td></tr><tr><th style='text-align:left; min-width:60px;'>付款方账号：</th><td style='text-align:left'>" + $(this).attr('payerAccountNo') +
                            "</td></tr><tr><th style='text-align:left; min-width:70px;'>付款方开户行：</th><td style='text-align:left'>" + $(this).attr('payerBankName') +
                            "</td></tr><tr><th style='text-align:left; min-width:60px;'>备注：</th><td style='text-align:left'>" + $(this).attr('memoInfo') + "</td></tr>" +
                            "</td></tr><tr><th style='text-align:left; min-width:60px;'>收款通知ID：</th><td style='text-align:left'>" + $(this).attr('applicationId') + "</td></tr>"
                    }
                });

                $(".cancel-link").bind('click', function(){
                    var roId = $(this).attr("roId");
                    if (roId) {
                        dialog.init("收款单", "您将作废该收款单", "确认", function () {
                            ajax.post("/exchange/ajax/cancelReceiveOrder", "roId=" + roId, function () {
                                $('#search').trigger("click");
                                form.success("收款单作废成功");
                            })
                            dialog.hide();
                        });
                    }
                });
            });
        });

        $('#order-export').bind('click', function(){
            var param = "businessType=" + $("#q-businessType").val();
            param += "&customerId=" + $("#q-customerId").val();
            param += "&receiveType=" + $("#q-receiveType").val();
            param += "&payChannel=" + $("#q-payChannel").val();
            param += "&bankReceiveTimeBegin=" + $("#q-br-begin-time").val();
            param += "&bankReceiveTimeEnd=" + $("#q-br-end-time").val();
            param += "&receiveTimeBegin=" + $("#q-receive-begin-time").val();
            param += "&receiveTimeEnd=" + $("#q-receive-end-time").val();
            param += "&status=" + $("#q-status").val();
            param += "&bankId=" + $("#q-bankId").val();
            param += "&amount=" + $("#q-amount").val();

            var url = "orderexport?" + param;
            window.open(url, "_blank");

            setTimeout(function(){
                $('#search').trigger("click");
            }, 3000);
        });

        $('#q-select-br-time').bind('change', function () {
            changeBRTimeSelect();
        });

        $('#q-select-receive-time').bind('change', function () {
            changeReceiveTimeSelect();
        });

        option.ajax("tt-import-bankId", "/exchange/ajax/loadAllReceiveBankOption", "", "option", 0);

        $("#choose-file").on("click", function () {
            $("#import-file").trigger("click")
        });

        $("#import-file").on('change', function (event, files, label) {
            $('input[name="upload-file"]').val(this.value);
        });

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

        $('#import-file').fileupload({
            url: "../ajax/importTelTransfer",
            dataType: 'json',
            add: function (e, data) {
                // 移除之前的事件处理，防止重复提交
                $('#confirm-import').unbind("click");
                $('#confirm-import').click(function () {
                    var bankSelectInput = $("#tt-import-bankId");
                    if (!autoValidator.validate(bankSelectInput[0])) {
                        errorForUpload(autoValidator.errorMsg());
                        bankSelectInput.addClass("error-input");
                        return;
                    }
                    var uploadFileField = $("#upload-file-input");
                    if (!autoValidator.validate(uploadFileField[0])) {
                        errorForUpload(autoValidator.errorMsg());
                        uploadFileField.addClass("error-input");
                        return;
                    }
                    bankSelectInput.removeClass("error-input");
                    uploadFileField.removeClass("error-input");
                    $('#import-tel-transfer').modal('hide');
                    loading.show();
                    data.formData = {"bankId": bankSelectInput.val()};
                    data.submit();
                });
            },
            done: function (e, data) {
                $("input[name='upload-file']").val("");
                $("#tt-import-bankId").val("0");
                loading.hide();
                var failedResultElem = $("#tel-transfer-result .failed-result");
                failedResultElem.empty();
                var successResultElem = $("#tel-transfer-result .success-result");
                successResultElem.empty();
                if (data.result.code != 200) {
                    failedResultElem.html("<span class=\"fail-msg\">系统异常，请稍后再试</span>");
                    $('#tel-transfer-result').modal('show');
                    return;
                }
                if (data.result.invalidFileMsg) {
                    failedResultElem.html("<span class=\"fail-msg\">" + data.result.invalidFileMsg + "</span>");
                    $('#tel-transfer-result').modal('show');
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
                    "invalidDateRows": "日期格式错误",
                    "invalidAmountRows": "金额格式错误",
                    "duplicateIdRows": "重复的交易流水号",
                    "duplicateTradNoRows": "添加收款单失败",
                    "emptyFieldRows": "字段为空",
                    "negativeOrZeroAmountRows": "金额必须大于0"
                };
                var errHtml = "";
                for (errField in checkErrorFields) {
                    if (data.result.msg[errField]) {
                        errHtml += generateErrHtml(data.result.msg[errField], checkErrorFields[errField]);
                    }
                }
                if (errHtml.length > 0) {
                    failedResultElem.html("<div class='fail-msg' style='font-weight:bold'>导入失败记录</div><br>" + errHtml);
                }
                $('#tel-transfer-result').modal('show');
//                $('#search').trigger("click");
            }
        });

        $("#customerName").autocomplete("../ajax/fetchCustomerNameSuggestion", {
            max: suggestionSize, // 查询条数
            autoFill: false, // 是否自动填充输入框
            scroll: false,
            matchContains: true,
            matchCase: true,
            delay: 1000,
            clickFire: false,
            width: $("#customerName").width() + "px",
            extraParams: {
                "businessType": function() {
                    return $("#businessType").val()
                }
            },
            beforeSearch: function () {
                var businessType = $("#businessType").val();
                return businessType != 0;
            },
            parse: function (data) {
                var rows = [];
                if (!data.msg) {
                    return rows;
                }
                var suggestions = data.msg.suggestion;
                if (!suggestions) {
                    if ($("#businessType").val() != 0) {
                        rows.push({
                            data: {
                                "customerId": "0",
                                "customerName": "无搜索结果"
                            },
                            value: "0",
                            result: "无搜索结果"
                        });
                    }
                    return rows;
                }
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

        $("#customerName").keydown(function(){
            var businessTypeField = $("#businessType");
            if (!autoValidator.validate(businessTypeField[0])) {
                showError(autoValidator.errorMsg());
                businessTypeField.addClass("error-input");
            }
        });

        $("#customerName").result(function (event, data, formatted) {
            if (data.customerId == "0") {
                $("#customerName").val('');
                $("#customerId").val('');
                $("#customerName").flushCache();
                return;
            }
            $("#customerName").val(data.customerName);
            $("#customerId").val(data.customerId);


            var businessType = $('#businessType').val();
            var receiveType = $("#receiveType").val();
            // 团购保底
            if (businessType == 1 && receiveType == 5) {
                $.ajax({
                    type: "POST",
                    url: "/exchange/ajax/findGuaranteeInfoByCustomerId",
                    dataType: 'json',
                    data: {
                        "customerId": data.customerId
                    },
                    success: function (data) {
                         if (data.code == 200) {
                             $("#bizContent-select").empty();
                             $("#bizContent-select").append("<option value='0'>请选择保底单号</option>");
                             $("#bizContent-select").val(0);
                             var guaranteeInfos = data.msg.guarantee;
                             if (guaranteeInfos) {
                                 for (var i = 0; i < guaranteeInfos.length; ++i) {
                                     var guaranteeInfo = guaranteeInfos[i];
                                     var option = "<option value='" + guaranteeInfo.guaranteeBillId + "' left-amount='" + guaranteeInfo.leftAmount + "'>" +
                                                    guaranteeInfo.guaranteeBillId + "(未归还金额:" + guaranteeInfo.leftAmount + ")" +
                                                  "</option>";
                                     $("#bizContent-select").append(option)
                                 }

                             }
                         }
                    }
                });
            }
        });



        var businessNameType = {
            "团购": 1,
            "预约预订": 2,
            "结婚亲子": 3,
            "储值卡": 4,
            "广告": 5,
            "默认": 0
        }

        // 修改收款单
        $("#m-customerName").autocomplete("../ajax/fetchCustomerNameSuggestion", {
            max: suggestionSize, // 查询条数
            autoFill: false, // 是否自动填充输入框
            scroll: false,
            matchContains: true,
            matchCase: true,
            delay: 1000,
            clickFire: false,
            width: $("#m-customerName").width() + "px",
            extraParams: {
                "businessType": function() {
                    return businessNameType[$("#m-businessType").text()];
                }
            },
            parse: function (data) {
                var rows = [];
                if (!data.msg) {
                    return rows;
                }
                var suggestions = data.msg.suggestion;
                if (!suggestions) {
                    rows.push({
                        data: {
                            "customerId": "0",
                            "customerName": "无搜索结果"
                        },
                        value: "0",
                        result: "无搜索结果"
                    });
                    $("#m-customerName").flushCache();
                    return rows;
                }
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

        $("#m-customerName").keydown(function () {
            $("#m-customerId").val('');
        });

        $("#m-customerName").result(function (event, data, formatted) {
            if (data.customerId == "0") {
                $("#m-customerName").val('');
                $("#m-customerId").val('');
                $("#m-customerName").flushCache();
                return;
            }
            $("#m-customerName").val(data.customerName);
            $("#m-customerId").val(data.customerId);
        });
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

    function changeReceiveTimeSelect(){
        var dateMap = initDateMap();
        var v = $('#q-select-receive-time').val();
        var s = dateMap[v || '0']['s'];
        var e = dateMap[v || '0']['e'];
        $('#q-receive-begin-time').val(s);
        $('#q-receive-end-time').val(e);
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

    function myList(model, tableId,param,emptyId,callback) {
        if (param == null) {
            param = "";
        }
        var params = "";
        var table = document.getElementById(tableId);
        var tableUrl = table.getAttribute("table_url");
        if (table.getAttribute("sort_property") != "" && table.getAttribute("sort_property") != null) {
            params += "&" + table.getAttribute("sort_property") + "=" + table.getAttribute("sort_type");
        }
        if (param != "") {
            params += "&" + param;
        }
        var namespace = "";
        if (table.getAttribute("namespace") != ''
            && table.getAttribute("namespace") != null) {
            namespace = "." + table.getAttribute("namespace");
        }
        if (table.hasAttribute("page_size")) {
            params += "&pageSize=" + table.getAttribute("page_size");
        }
        ajax.post(tableUrl, encodeURI(params), function (data) {
            var pageModel = eval("data" + namespace);
            var messageList;
            if(pageModel){
                messageList = pageModel.records;
            }
            var i = 0;
            table.innerHTML = "";

            if (messageList && messageList.length > 0) {
                $('#' + model).tmpl(pageModel).appendTo('#' + tableId);
            } else {
                $('#'+emptyId).tmpl(pageModel).appendTo('#' + tableId);
                $("#"+pageId).hide();
            }
            if (callback) {
                callback(data);
            }
        },function(){
        });
    }
});