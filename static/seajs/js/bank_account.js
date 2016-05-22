/**
 * Created by yangyongli on 3/29/16.
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
        option.ajax("q-bank-name", "/settle/ajax/loadCompanyBankNameList", "", "msg.option", "");

        option.ajax("bankAccount-companyId", "/settle/ajax/loadCompanyList", "", "option", 0);

        $("#bankAccount-companyId").change(function(){
            var companyName = $("#bankAccount-companyId").find("option:selected").text();
            if($("#bankAccount-companyId").val() == 0){
                companyName = "";
            }
            $("#bankAccount-companyName").val(companyName);
        });


        $("#btn-add-account").click(function(){
            form.clean("submit-account-form");
            $("#bankAccount-companyId").val(0);
            $("#submit-account-form").attr("form_url", "/settle/ajax/createBankAccount");
        });


        $('#submit-account-button').bind('click', function () {
            $('#submit-account-button').attr("disabled","true");
            var isValid = form.defaultSubmit("submit-account-form","","",null,function(data){
                if(data.code==200){
                    form.success("提交成功！");
                    form.clean("submit-account-form");
                    $("#edit-account-dialog").modal('hide');
                    show_list();
                } else {
                    var message = "提交失败！";
                    try{
                        message = data.msg.message;
                    }catch(e){}
                    form.fail(message);
                }
                $('#submit-account-button').removeAttr("disabled");
            });

            if(!isValid){
                $('#submit-bean-button').removeAttr("disabled");
            }

        });
    });

    function show_list() {
        list.init("list_model", "bank_account_list", "pagination_bar", "", "", "NoRowsTemplate", "search-container", null, 1, function (data) {
            $(".edit-action").click(function(){
                    var record_id = $(this).attr("data-record-id");
                    ajax.post("/settle/ajax/loadBankAccount", {"recordId": record_id}, function(data) {
                        console.log(data);
                        var bankAccount = data.bankAccount;
                        form.clean("submit-account-form");
                        $("#submit-account-form .form_value").each(function(index, item){
                            var name = $(item).attr("name");
                            var value = eval(name);
                            $(item).val(value);
                        });

                        $('#submit-account-button').removeAttr("disabled");

                        $("#submit-account-form").attr("form_url", "/settle/ajax/updateBankAccount");

                        $("#edit-account-dialog").modal('show');
                    });
                }
            );
        });
    }
});
