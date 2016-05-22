define(function (require, exports, module) {
    var $ = require('jquery');
    require('datepicker');
    require('bootstrap');
    require('upload');
    require('./bootstrap-datetimepicker')($);
    require('./jquery.autocomplete')($);
    var ajax = require('./ajax');
    var list = require("./list");
    var option = require("./option");
    var loading = require("./loading");
    var dialog = require("./dialog");
    var form = require("./form");
    var autoValidator = require("./autovalidator");

    $(document).ready(function () {
        $("#divSearchDate").datetimepicker({
            format: "yyyy-mm-dd",
            autoclose: true,
            language: "zh_CN",
            forceParse: false,
            startView: 2,
            minView:2
        });
        $("#divSearchDate_to").datetimepicker({
            format: "yyyy-mm-dd",
            autoclose: true,
            language: "zh_CN",
            forceParse: false,
            startView: 2,
            minView:2
        });
        $("#add-divEventDate").datetimepicker({
            format: "yyyy-mm-dd",
            autoclose: true,
            language: "zh_CN",
            forceParse: false,
            startView: 2,
            minView:2
        });

        $("#searchDate").val(new Date().format("yyyy-MM-dd"));
        $("#searchDate_to").val(new Date().format("yyyy-MM-dd"));
        $("#add-eventDate").val(new Date().format("yyyy-MM-dd"));

        $('#search').bind('click', function () {
            $(".error-input").removeClass("error-input");
            var correct =  validateParams();
            if(!correct) {
                return;
            }
            var param = collectSearchData();
            list.init("list_model", "tbody_list", "pagination_bar", "", param, "NoRowsTemplate", "search_div", null, 1, function (data) {
                if (data.code != 200) {
                    dialog.init("错误提示", "系统异常,请稍后重试!");
                }
                loading.hide();

            });
        });

        $('#add-adjust').bind('click', function () {
            $(".error-input").removeClass("error-input");
            if(!addValidateData()){
                return;
            }
            form.defaultSubmit("add-ro-form","","",null,function(data){
                if(data.code==200){
                    form.success("账户划转录入成功！");
                    clean();
                    $("#add-ro-dialog").hide();
                } else {
                    form.fail("账户划转录入失败！");
                }

            })
        });

    });

    function clean(){
        $('#add-amount').val("");
        $('#add-businessSource').val("");
        $('#add-fundType').val("");
        $('#add-activityType').val("");
        $('#add-capitalChannel').val("");
        $('#add-businessType').val("");
        $('#add-account').val("");
        $('#add-company').val("");
        $('#add-memo').val("");
    }
    function addValidateData() {
        var eventDate = $('#add-eventDate').val();
        var amount = $('#add-amount').val();
        var fundType = $('#add-fundType').val();
        var capitalChannel = $('#add-capitalChannel').val();
        var businessType = $('#add-businessType').val();
        var dianPingAccountNo = $('#add-account').val();
        var dpCompany = $('#add-company').val();

        if(!eventDate) {
            $('#add-eventDate').addClass('error-input');
            dialog.init("提示", "划转日期不能为空!");
            return false;
        }
        if(!fundType) {
            $('#add-fundType').addClass('error-input');
            dialog.init("提示", "款项类型不能为空!");
            return false;
        }

        if(!capitalChannel) {
            $('#add-capitalChannel').addClass('error-input');
            dialog.init("提示", "划出账户不能为空!");
            return false;
        }

        if(!dianPingAccountNo) {
            $('#add-dp-account').addClass('error-input');
            dialog.init("提示", "划入账户不能为空!");
            return false;
        }

        if(!businessType) {
            $('#add-businessType').addClass('error-input');
            dialog.init("提示", "业务类型不能为空!");
            return false;
        }
        if(!amount) {
            $('#add-amount').addClass('error-input');
            dialog.init("提示", "金额不能为空!");
            return false;
        }
        if(!dpCompany) {
            $('#add-company').addClass('error-input');
            dialog.init("提示", "公司信息不能为空!");
            return false;
        }

        return true;
    }

    function validateParams() {
        if(!$('#searchDate_to').val()) {
            $('#searchDate_to').addClass('error-input');
            showError("请设置查询结束日期");
            return false;
        }
        if(!$('#searchDate').val()) {
            $('#searchDate').addClass('error-input');
            showError("请设置查询开始日期");
            return false;
        }
        return true;
    }
    function showError(error) {
        var errorDiv = $(".tips-container .error:first")[0];
        errorDiv.innerHTML = error;
        errorDiv.style.display = 'block';
        setTimeout(hideError, 3000);
    }
    function hideError() {
        var errorDiv = $(".tips-container .error:first")[0];
        errorDiv.innerHTML = "";
        errorDiv.style.display = 'none';
    }

    function collectSearchData() {
        var businessType = $('#businessType').val();
        var fundType = $('#fundType').val();
        var businessSource = $('#businessSource').val();
        var activityType = $('#activityType').val();
        var searchDate = $('#searchDate').val();
        var searchDate_to = $('#searchDate_to').val();

        var param = "";

        if (!isEmpty(activityType)) {
            param += "activityType=" + activityType + "&";
        }

        if (!isEmpty(businessType)) {
            param += "businessType=" + businessType + "&";
        }

        if (!isEmpty(fundType)) {
            param += "fundType=" + fundType + "&";
        }

        if (!isEmpty(businessSource)) {
            param += "businessSource=" + businessSource + "&";
        }

        if (!isEmpty(searchDate)) {
            param += "withDrawDateFrom=" + searchDate + "&";
        }

        if (!isEmpty(searchDate_to)) {
            param += "withDrawDateTo=" + searchDate_to + "&";
        }

        return param;
    }


    function isEmpty(v) {
        return v == undefined || v == "" || v == null || v == 0;
    }

});
