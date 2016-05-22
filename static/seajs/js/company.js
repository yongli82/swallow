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

    $(document).ready(function () {
        showlist();

        // 增加提交
        $('#submit-company-add').bind('click', function() {
            $('#submit-company-add').attr("disabled","true");
            $('#submit-company-edit').removeAttr("disabled");
            var isValid = form.defaultSubmit("add-company-form","","",null,function(data){
                if(data.code == 200){
                    form.success("提交成功！");
                    form.clean("add-company-form");
                    $("#add-company-dialog").modal('hide');
                    show_list();
                } else {
                    var message = "提交失败！";
                    try{
                        message = data.msg.message;
                    }catch(e){}
                    form.fail(message);
                }
                $('#submit-company-add').removeAttr("disabled");
            });
            if(!isValid){
                $('#submit-company-add').removeAttr("disabled");
            }
            $('#btn-refresh-company').trigger('click');
        });

        // 编辑提交
        $('#submit-company-edit').bind('click', function() {
            $('#submit-company-edit').attr("disabled","true");
            var isValid = form.defaultSubmit("edit-company-form","","",null,function(data){
                if(data.code == 200){
                    form.success("提交成功！");
                    form.clean("edit-company-form");
                    $("#edit-company-dialog").modal('hide');
                    show_list();
                } else {
                    var message = "提交失败！";
                    try{
                        message = data.msg.message;
                    }catch(e){}
                    form.fail(message);
                }
                $('#submit-company-edit').removeAttr("disabled");
                showlist();
            });
            if(!isValid){
                $('#submit-company-edit').removeAttr("disabled");
            }

        });

        // 重新加载公司
        $('#btn-refresh-company').bind('click', function() {
           showlist();
        });
    });

    function showlist() {
        list.init("list_model", "company_list", "pagination_bar", "", "", "NoRowsTemplate", null, null, 1, function (data) {
            $(".edit-action").click(function(){
                    $('#submit-company-edit').removeAttr("disabled");
                    var record_id = $(this).attr("data-record-id");
                    var param = "recordId=" + record_id + "&";
                    ajax.post("/settle/ajax/loadCompany", param, function(data) {
                        console.log(data);
                        var company = data.company;
                        form.clean("edit-company-form");
                        $(".form_value").each(function(){
                            var name = $(this).attr("name");
                            var value = eval(name);
                            $(this).val(value);
                        });

                        $('#submit-company-edit').removeAttr("disabled");
                        $("#edit-company-dialog").modal('show');
                    });
                }
            );
        });
    }

});
