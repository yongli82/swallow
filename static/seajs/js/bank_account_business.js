/**
 * Created by yangyongli on 3/31/16.
 */

define(function(require, exports, module) {
    var $ = require('jquery');
    require('datepicker');
    require('bootstrap');
    require('./jquery.autocomplete')($);
    require('./bootstrap-datetimepicker')($);

    var ajax = require('./ajax');
    var list = require("./list");
    var option = require("./option");
    var loading = require("./loading");
    var dialog = require("./dialog");
    var form = require("./form");
    var pub = require("./public");
    var dateutil = require("./date");

    $(document).ready(function() {
        show_list();

        $("#btn-search").click(function(){
            show_list();
        });


        option.ajax("q-company-id", "/settle/ajax/loadCompanyList", "", "option", 0);
        option.ajax("q-business-type", "/settle/ajax/loadBusinessTypeOption", "", "option", 0);
        option.ajax("q-account-id", "/settle/ajax/loadBankAccountList", "", "option", 0);

        option.ajax("bean-companyId", "/settle/ajax/loadCompanyList", "", "option", 0);
        option.ajax("bean-businessType", "/settle/ajax/loadBusinessTypeOption", "", "option", 0);
        option.ajax("bean-accountId", "/settle/ajax/loadBankAccountList", "", "option", 0);

        $("#bean-companyId").change(function(){
            var companyName = $("#bean-companyId").find("option:selected").text();
            if($("#bean-companyId").val() == 0){
                companyName = "";
            }
            $("#bean-companyName").val(companyName);
        });

        $("#bean-accountId").change(function(){
            var accountName = $("#bean-accountId").find("option:selected").text();
            if($("#bean-accountId").val() == 0){
                accountName = "";
            }
            $("#bean-accountName").val(accountName);
        });


        $("#btn-add-bean").click(function(){
            form.clean("submit-bean-form");
            $("#bean-companyId").val(0);
            $("#bean-businessType").val(0);
            $("#bean-accountId").val(0);
            $("#submit-bean-form").attr("form_url", "/settle/ajax/createBankAccountBusiness");
        });


        $('#submit-bean-button').bind('click', function () {
            $('#submit-bean-button').attr("disabled","true");
            var isValid = form.defaultSubmit("submit-bean-form","","",null,function(data){
                if(data.code==200){
                    form.success("提交成功！");
                    form.clean("submit-bean-form");
                    $("#edit-bean-dialog").modal('hide');
                    show_list();
                } else {
                    form.fail("提交失败！");
                }
                $('#submit-bean-button').removeAttr("disabled");
            });
            if(!isValid){
                $('#submit-bean-button').removeAttr("disabled");
            }
        });
    });

    function show_list() {
        list.init("list_model", "record_list", "pagination_bar", "", "", "NoRowsTemplate", "search-container", null, 1, function (data) {

            $(".tb-businessType").each(function(index, item){
                var businessType = $(item).text();
                try {
                    var businessTypeName = data.businessTypeMap[parseInt(businessType)];
                    if (businessTypeName) {
                        $(item).text(businessTypeName);
                    }
                } catch (e) {
                }
            });

            $(".edit-action").click(function(){
                    var record_id = $(this).attr("data-record-id");
                    ajax.post("/settle/ajax/loadBankAccountBusiness", {"recordId": record_id}, function(data) {
                        console.log(data);
                        var bean = data.bean;
                        form.clean("submit-bean-form");
                        $("#submit-bean-form .form_value").each(function(index, item){
                            var name = $(item).attr("name");
                            var value = eval(name);

                            if($(item).attr("type") == "checkbox"){
                                if(value == "1"){
                                    $(item).attr("checked", true);
                                }else{
                                    $(item).removeAttr("checked");
                                }
                            }else {
                                $(item).val(value);
                            }
                        });

                        $("#submit-bean-form").attr("form_url", "/settle/ajax/updateBankAccountBusiness");
                        $('#submit-bean-button').removeAttr("disabled");
                        $("#edit-bean-dialog").modal('show');
                    });
                }
            );

            $('.delete-action').click('click', function () {
                var record_id = $(this).attr("data-record-id");
                if (!record_id) {
                    errorForUpload("请选择删除的设置！");
                    return;
                }

                var dialogContent = "<label class='cancel-label'>确认要删除该设置吗？</label>" +
                    "<div class='well'>" +
                    "<p>公司: " + $(this).parent().parent().find(".tb-companyName").text() + "</p>" +
                    "<p>银行账户: " + $(this).parent().parent().find(".tb-accountName").text() + "</p>" +
                    "<p>业务类型: " + $(this).parent().parent().find(".tb-businessType").text() + "</p>" +
                    "</div>";
                dialog.init("删除设置", dialogContent, "确认", function () {
                    $.ajax({
                        type: "post",
                        dataType: "json",
                        url: "/settle/ajax/deleteBankAccountBusiness",
                        data: {
                            "bean.id": record_id
                        },
                        success: function (data) {
                            if (data.code == 403) {
                                form.fail("您没有执行该请求的权限！");
                                return;
                            }
                            if (data.code != 200) {
                                form.fail("系统异常，请稍后再试！");
                                return;
                            }
                            form.success("删除成功！");
                            show_list();
                        }
                    });
                    dialog.hide();
                });
            });
        });
    }
});

