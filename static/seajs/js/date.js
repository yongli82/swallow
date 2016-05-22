//some operation for date

define(function(require,exports,module){

    module.exports= {
        //Used to be called JSONDateToJSDate, format date into suitable form.
        trans : function (jsondate, format) {
            if (jsondate == null)return"";
            var date = new Date(+/\d+/.exec(jsondate)[0]);
            return date.format(format);
        },

        toDate:function(date){
            if(date==null||date==""){
                return new Date().minValue();
            }
            var result = date.match(/^(\d{1,4})(-|\/)(\d{1,2})\2(\d{1,2})$/);
            return new Date(result[1], result[3] - 1, result[4]);
        },

        toDateTime:function(date, isEnd){
            if(date==null||date==""){
                return new Date().minValue();
            }
            var result = date.match(/^(\d{1,4})(-|\/)(\d{1,2})\2(\d{1,2})\s*(?:(\d{1,2}):(\d{1,2}))?$/);
            var hour = result[5] == null ? (isEnd ? 23 : 0) : result[5];
            var min = result[6] == null ? (isEnd ? 59 : 0) : result[6];
            return new Date(result[1], result[3] - 1, result[4], hour, min);
        },

        correct : function (date) {
            var result = date.match(/^(\d{1,4})(-|\/)(\d{1,2})\2(\d{1,2})$/);
            if (result == null)
                return false;
            var d = new Date(result[1], result[3] - 1, result[4]);
            return (d.getFullYear() == result[1] && (d.getMonth() + 1) == result[3] && d.getDate() == result[4]);
        },

        correct_time : function (date) {
            var result = date.match(/^(\d{1,4})(-|\/)(\d{1,2})\2(\d{1,2})\s*(?:(\d{1,2}):(\d{1,2}))?$/);
            if (result == null)
                return false;
            var hour = result[5] == null ? 0 : result[5];
            var min = result[6] == null ? 0 : result[6];
            var d = new Date(result[1], result[3] - 1, result[4], hour, min);
            return (d.getFullYear() == result[1]
            && (d.getMonth() + 1) == result[3]
            && d.getDate() == result[4]
            && d.getHours() == hour
            && d.getMinutes() == min);
        },
        calcDateSpan: function(label){
            var now = new Date();
            var start = null;
            var end = null;
            if (!label || "none" == label){
                //self customize
            }else if("until_today" == label){
                end = now;
            }else if("today" == label){
                start = now;
                end = now;
            }else if("this_month" == label){
                start = new Date(new Date().setMonth(now.getMonth(), 1));
                end = now;
            }else if(label.indexOf("before_") == 0 || label.indexOf("in_") == 0){
                var ops = label.split("_");
                var span_type = ops[0];
                var span_value = parseInt(ops[1]);
                var span_unit = ops[2];
                if("day" == span_unit){
                    start = now.pre(span_value);
                }else if ("month" == span_unit){
                    start = now.premonth(span_value);
                }else{
                    alert("unsupported span_unit");
                }

                if("in" == span_type){
                    end = now;
                }else if ("before" == span_type){
                    end = start;
                }else{
                    alert("unsupported span_type");
                }
            }

            var dateMap = {
                "s" : (start? start.format("yyyy-MM-dd"): ""),
                "e" : (end? end.format("yyyy-MM-dd"): "")
            }
            return dateMap;
        }
    }
});

//Date format....
Date.prototype.format = function(fmt){
    var o = {
        "M+" : this.getMonth()+1,                 //月份
        "d+" : this.getDate(),                    //日
        "h+" : this.getHours(),                   //小时
        "m+" : this.getMinutes(),                 //分
        "s+" : this.getSeconds(),                 //秒
        "q+" : Math.floor((this.getMonth()+3)/3), //季度
        "S"  : this.getMilliseconds()             //毫秒
    };
    if(/(y+)/.test(fmt))
        fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));
    for(var k in o)
        if(new RegExp("("+ k +")").test(fmt))
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
    return fmt;
};

Date.prototype.defaultFormat = function(){
    return this.format("yyyy-MM-dd");
};

Date.prototype.pre = function(day){
    var ODT = 24*60*60*1000;
    var now = new Date();
    var nowTime = now.getTime();
    return new Date(nowTime - day*ODT);
};

Date.prototype.premonth = function(month){
    var now = new Date();
    var pre_month = now.setMonth(now.getMonth() - month);
    return new Date(pre_month);
};

Date.prototype.later = function(day){
    var ODT = 24*60*60*1000;
    var now = new Date();
    var nowTime = now.getTime();
    return new Date(nowTime + day*ODT);
};

Date.prototype.minValue=function(){
    return new Date(0);
};

Date.prototype.isValid=function(value,fmt){
    var date=value.replace(/(^\s+|\s+$)/g,'');
    if(date==''){
        return true;
    }
};
