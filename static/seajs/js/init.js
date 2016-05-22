var ENV = {
    debug: true
};
ENV.data = {};
seajs.use('nav');
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-33919587-17']);
_gaq.push(['_setDomainName', '${domain}']);
_gaq.push(['_setAllowHash', false]);
var dpga = function (key) {
    _gaq.push(['_trackPageview', key || ''])
}
var pageTracker = {_trackPageview: dpga};
window.onload = function () {
    var pathName=window.document.location.pathname;
    var projectName=pathName.substring(0,pathName.substr(1).indexOf('/')+1);
    if(projectName == "/caiwu" || projectName == "/exchange"){
        projectName = "/settle";
    }
    var navChildren = document.getElementsByClassName("nav")[0].children;
    var isNavFound = false;
    for(var i=0;i<navChildren.length;i++){
        for(var j=0;j<navChildren[i].children.length;j++){
            if(navChildren[i].children[j].tagName != null && navChildren[i].children[j].tagName.toLowerCase() == "a" && navChildren[i].children[j].href.indexOf(projectName)!=-1) {
                navChildren[i].className += " active";
                isNavFound = true;
                break;
            }
        }
        if(isNavFound){
            break;
        }
    }

    var leftChildren = document.getElementsByClassName("leaf");
    var isLeftFound = false;
    for(var i=0;i<leftChildren.length;i++){
        for(var j=0;j<leftChildren[i].children.length;j++){
            if(leftChildren[i].children[j].tagName != null && leftChildren[i].children[j].tagName.toLowerCase() == "a" && leftChildren[i].children[j].href.indexOf(pathName)!=-1){
                leftChildren[i].className += " active";
                isLeftFound = true;
                break;
            }
        }
        if(isLeftFound){
            break;
        }
    }
}