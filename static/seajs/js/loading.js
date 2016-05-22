//loading effect
define(function(require, exports, module) {
    var $=require("jquery");
    var $mask;
    module.exports={

        show:function(){
            if(!$mask) {
                var maskHtml = '<div class="modal-backdrop">' +
                    '</div>' +
                    '<div class="alert" id="loading">' +
                    '加载中...' +
                    '</div>';
                $mask = $(maskHtml).prependTo(document.body);
            }
            $mask.show();
        },

        hide:function(){
            if($mask) {
                $mask.hide();
            }
        }
    }
});