function getRelationByPPId(ppId){
            $.ajax({
                type: "POST",
                url: "/prepaidcard/ajax/getBPInfoByPPId",
                data: {
                    ppId: ppId
                }
            }).done(function (data) {
                        if(data.code != 200) {
                            Alert.error(data.msg.message, function(){
                            });
                            return;
                        }
                        if(data.msg.bpInfo != undefined){
                            addBillingPayableToTable(bpInfo, false);
                        }
            

                    });
            $.ajax({
                type: "POST",
                url: "/caiwu/ajax/getPPAndEOInfoByPPId",
                data: {
                    ppId: ppId
                }
            }).done(function (data) {
                            if(data.code != 200) {
                                Alert.error(data.msg.message, function(){
                                });
                                return;
                            }
                            if(data.msg.ppInfo != undefined){
                                addPaymentPlanToTable(data.msg.ppInfo, true);
                            }
                            if(data.msg.eoInfo != undefined){
                                $.each(data.msg.eoInfo, function() {
                                    var eoRecord = this;
                                    addExchangeOrderToTable(eoRecord, false);
                                });
                            }
                    });
            
        }

function getRelationByBPId(bpId) {
            $.ajax({
                type: "POST",
                url: "/prepaidcard/ajax/getBPInfoByBPId",
                data: {
                    bpId: bpId
                }
            }).done(function (data) {
                        if(data.code != 200) {
                            Alert.error(data.msg.message, function(){
                            });
                            return;
                        }
                        var bpInfo = data.msg.bpInfo;
                        var ppId = bpInfo.ppId;
                        $.ajax({
                            type: "POST",
                            url: "../caiwu/ajax/getPPAndEOInfoByPPId",
                            data: {
                                ppId: ppId
                            }
                        }).done(function (data) {
                                    if(data.code != 200) {
                                        Alert.error(data.msg.message, function(){
                                        });
                                        return;
                                    }
                                    addBillingPayableToTable(bpInfo, true);
                                });
                        var ppInfo = data.msg.ppInfo;
                        var eoInfo = data.msg.eoInfo;
                        addPaymentPlanToTable(ppInfo, false);
                        for(var i =0; i < eoInfo.length; ++i){
                            addExchangeOrderToTable(eoInfo[i], false);
                        }
                    });
        }



function getRelationByEOId(eoId, bizCode) {
    $.ajax({
        type: "POST",
        url: "/caiwu/ajax/getPPAndEOInfoByEOId",
        data: {
            exchangeOrderId: eoId
        }
    }).done(function (data) {
        if(data.code != 200) {
            Alert.error(data.msg.message, function(){
            });
            return;
        }
        var ppInfo = data.msg.ppInfo;
        if (!ppInfo) {
            return;
        }

        var ppId = ppInfo.ppId;
        $.ajax({
            type: "POST",
            url: "/prepaidcard/ajax/getBPInfoByPPId",
            data: {
                ppId: ppId
            },
            async: false
        }).done(function (data) {
            if(data.code != 200) {
                Alert.error(data.msg.message, function(){
                });
                return;
            }
            var bpInfo = data.msg.bpInfo;
            if (!bpInfo) {
                return;
            }
            addBillingPayableToTable(bpInfo, false);

        });

        addPaymentPlanToTable(ppInfo, false);
        var eoInfo = data.msg.eoInfo;
        if (!eoInfo) {
            return;
        }
        for (var i = 0; i < eoInfo.length; ++i) {
            addExchangeOrderToTable(eoInfo[i], eoInfo[i].bizCode == bizCode);
        }

    });
}

function getBPStatus(status){
    switch (status) {
        case 1:
            return "初始";
        case 2:
            return "暂停";
        case 3:
            return "待抵扣";
        case 4:
            return "未完全抵扣";
        case 5:
            return "待生成支付计划";
        case 6:
            return "校验通过";
        case 7:
            return "校验不通过";
        case 8:
            return "已生成付款计划";
        case 9:
            return "支付成功";
        case 10:
            return "退票";
        default:
            return "";
    }
}

function getPPStatus(status){
    switch (status) {
        case 1:
            return "初始";
        case 2:
            return "暂停";
        case 3:
            return "待抵扣";
        case 4:
            return "未完全抵扣";
        case 5:
            return "待生成付款单";
        case 6:
            return "校验通过";
        case 7:
            return "校验不通过";
        case 8:
            return "已生成付款单";
        case 9:
            return "支付成功";
        default:
            return "";
    }
}


function getPPStatus(status){
    switch (status) {
        case 1:
            return "初始";
        case 2:
            return "暂停";
        case 3:
            return "待抵扣";
        case 4:
            return "未完全抵扣";
        case 5:
            return "待生成付款单";
        case 6:
            return "校验通过";
        case 7:
            return "校验不通过";
        case 8:
            return "已生成付款单";
        case 9:
            return "支付成功";
        default:
            return "";
    }
}

function getEOStatus(status) {
    switch (status) {
        case 1:
            return "初始";
        case 2:
            return "支付中";
        case 3:
            return "支付成功";
        case 4:
            return "退票";
        default:
            return "";
    }
}


function addExchangeOrderToTable(eoInfo, entry) {
    var eoIdContent =  "<a href='" + eoInfo.url + "'>付款单&nbsp;" + eoInfo.bizCode + "</a>";
    var cssStyle = "eo-row";
    if(entry){
        eoIdContent = "付款单&nbsp;" + eoInfo.bizCode;
        cssStyle = "eo-row entry-row";
    }
    var status = getEOStatus(eoInfo.status);
    var trHtml = "<tr class='" + cssStyle + "'>" +
            "<td class='fs-id'>" + eoIdContent + "</td>" +
            "<td class='fs-amount'>"+ eoInfo.orderAmount.toFixed(2) + "</td>" +
            "<td class='fs-date'>&nbsp;&nbsp;&nbsp;&nbsp;" + eoInfo.addDate + "</td>" +
            "<td class='fs-status'>" + status + "</td>" +
    "</tr>";
    var tobodyEle = $("#relation-table tbody");
    tobodyEle.append(trHtml);
}



function addPaymentPlanToTable(ppInfo, entry) {
    var ppIdContent = "<a href='" + ppInfo.url + "'>付款计划&nbsp;" + ppInfo.ppId + "</a>";
    var cssStyle = "pp-row";
    if(entry){
        ppIdContent = "付款计划&nbsp;" + ppInfo.ppId;
        cssStyle = "pp-row entry-row";
    }
    var status = getPPStatus(ppInfo.status);
    var tobodyEle = $("#relation-table tbody");
    tobodyEle.append("<tr class='" + cssStyle + "'>" +
            "<td class='fs-id'>" + ppIdContent + "</td>" +
            "<td class='fs-amount'>"+ ppInfo.planAmount.toFixed(2) + "</td>" +
            "<td class='fs-date'>&nbsp;&nbsp;&nbsp;&nbsp;" + ppInfo.addDate + "</td>" +
            "<td class='fs-status'>" + status + "</td>" +
            "</tr>");
}

function addBillingPayableToTable(bpInfo, entry) {
    var bpIdContent = "<a href='" + bpInfo.url + "'>结算单&nbsp;" + bpInfo.bpId + "</a>";
    var cssStyle = "bp-row";
    if(entry){
        bpIdContent = "结算单&nbsp;" + bpInfo.bpId;
        cssStyle = "bp-row entry-row";
    }
    var status = getBPStatus(bpInfo.status);
    var tobodyEle = $("#relation-table tbody");
    tobodyEle.append("<tr class='" + cssStyle + "'>" +
            "<td class='fs-id'>" + bpIdContent + "</td>" +
            "<td class='fs-amount'>"+ bpInfo.planAmount.toFixed(2) + "</td>" +
            "<td class='fs-date'>&nbsp;&nbsp;&nbsp;&nbsp;" + bpInfo.planDate + "</td>" +
            "<td class='fs-status'>" + status + "</td>" +
            "</tr>");
}
