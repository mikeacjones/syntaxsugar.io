(window.webpackJsonp=window.webpackJsonp||[]).push([[10],{"/b8u":function(e,t,a){var n=a("STAE");e.exports=n&&!Symbol.sham&&"symbol"==typeof Symbol.iterator},"33Wh":function(e,t,a){var n=a("yoRg"),r=a("eDl+");e.exports=Object.keys||function(e){return n(e,r)}},"6LWA":function(e,t,a){var n=a("xrYK");e.exports=Array.isArray||function(e){return"Array"==n(e)}},A2ZE:function(e,t,a){var n=a("HAuM");e.exports=function(e,t,a){if(n(e),void 0===t)return e;switch(a){case 0:return function(){return e.call(t)};case 1:return function(a){return e.call(t,a)};case 2:return function(a,n){return e.call(t,a,n)};case 3:return function(a,n,r){return e.call(t,a,n,r)}}return function(){return e.apply(t,arguments)}}},"G+Rx":function(e,t,a){var n=a("0GbY");e.exports=n("document","documentElement")},I1XU:function(e,t,a){},"N+g0":function(e,t,a){var n=a("g6v/"),r=a("m/L8"),c=a("glrk"),i=a("33Wh");e.exports=n?Object.defineProperties:function(e,t){c(e);for(var a,n=i(t),o=n.length,l=0;o>l;)r.f(e,a=n[l++],t[a]);return e}},RNIs:function(e,t,a){var n=a("tiKp"),r=a("fHMY"),c=a("m/L8"),i=n("unscopables"),o=Array.prototype;null==o[i]&&c.f(o,i,{configurable:!0,value:r(null)}),e.exports=function(e){o[i][e]=!0}},STAE:function(e,t,a){var n=a("0Dky");e.exports=!!Object.getOwnPropertySymbols&&!n((function(){return!String(Symbol())}))},XbcX:function(e,t,a){"use strict";var n=a("I+eb"),r=a("or9q"),c=a("ewvW"),i=a("UMSQ"),o=a("HAuM"),l=a("ZfDv");n({target:"Array",proto:!0},{flatMap:function(e){var t,a=c(this),n=i(a.length);return o(e),(t=l(a,0)).length=r(t,a,a,n,0,1,e,arguments.length>1?arguments[1]:void 0),t}})},ZfDv:function(e,t,a){var n=a("hh1v"),r=a("6LWA"),c=a("tiKp")("species");e.exports=function(e,t){var a;return r(e)&&("function"!=typeof(a=e.constructor)||a!==Array&&!r(a.prototype)?n(a)&&null===(a=a[c])&&(a=void 0):a=void 0),new(void 0===a?Array:a)(0===t?0:t)}},bDsS:function(e,t,a){"use strict";var n=a("q1tI"),r=a.n(n),c=a("Wbzz"),i=a("zpb6");a("o8WY");t.a=function(e){var t=e.title,a=e.category,n=e.url,o=e.updated,l=e.summary;return r.a.createElement("div",{className:"LabCard"},r.a.createElement(c.a,{to:"/lab-content/"+n,className:"LabCard-link"}),r.a.createElement("div",{className:"LabCard-header"},r.a.createElement("div",{className:"LabCard-updated"},"Updated ",o.substring(0,10)),r.a.createElement("div",{className:"LabCard-title"},t)),r.a.createElement("div",{className:"LabCard-body"},l),r.a.createElement("div",{className:"LabCard-footer"},a&&a.map((function(e){return r.a.createElement(c.a,{to:"/labs/"+Object(i.createTagSlug)(e),className:"chip tag-link"},e)}))))}},c9m3:function(e,t,a){a("RNIs")("flatMap")},eROg:function(e,t,a){"use strict";a.r(t);a("XbcX"),a("c9m3");var n=a("q1tI"),r=a.n(n),c=a("7oih"),i=a("EYWl"),o=a("Wbzz"),l=a("bDsS"),s=a("zpb6");a("I1XU");t.default=function(e){var t=e.data,a=e.pageContext;return r.a.createElement(c.a,null,r.a.createElement(i.a,{title:"Guided Labs",description:"Guided labs which walk you through a specific concept / task"}),r.a.createElement("div",{className:"post-view-header"},r.a.createElement("div",{className:"post-view-title"},r.a.createElement("h1",null,"Guided Labs"),r.a.createElement("h3",null,"Categories:"),r.a.createElement("div",{className:"category-tags"},r.a.createElement(o.a,{to:"/labs",className:"chip tag-link",activeClassName:"active",partiallyActive:!0},"All Labs"),t.allCategories.edges.flatMap((function(e){return e.node.childJson.category})).filter((function(e,t,a){return a.indexOf(e)===t})).map((function(e){return r.a.createElement(o.a,{to:"/labs/"+Object(s.createTagSlug)(e),className:"tag-link chip",activeClassName:"active",partiallyActive:!0},e)}))))),r.a.createElement("div",{className:"LabCards"},t.allFile.edges.map((function(e){var t=e.node;return r.a.createElement(l.a,Object.assign({},t.childJson,{key:t.url}))})),r.a.createElement("div",{className:"LabCard",style:{visibility:"hidden"}}),r.a.createElement("div",{className:"LabCard",style:{visibility:"hidden"}})),r.a.createElement("div",{className:"paging-links"},(a.nextPagePath||a.previousPagePath)&&r.a.createElement(r.a.Fragment,null,a.previousPagePath?r.a.createElement(o.a,{to:a.previousPagePath},"Previous"):r.a.createElement(o.a,{className:"disabled"},"Previous"),a.nextPagePath?r.a.createElement(o.a,{to:a.nextPagePath},"Next"):r.a.createElement(o.a,{className:"disabled"},"Next"))))}},fHMY:function(e,t,a){var n,r=a("glrk"),c=a("N+g0"),i=a("eDl+"),o=a("0BK2"),l=a("G+Rx"),s=a("zBJ4"),u=a("93I0"),p=u("IE_PROTO"),d=function(){},m=function(e){return"<script>"+e+"<\/script>"},f=function(){try{n=document.domain&&new ActiveXObject("htmlfile")}catch(r){}var e,t;f=n?function(e){e.write(m("")),e.close();var t=e.parentWindow.Object;return e=null,t}(n):((t=s("iframe")).style.display="none",l.appendChild(t),t.src=String("javascript:"),(e=t.contentWindow.document).open(),e.write(m("document.F=Object")),e.close(),e.F);for(var a=i.length;a--;)delete f.prototype[i[a]];return f()};o[p]=!0,e.exports=Object.create||function(e,t){var a;return null!==e?(d.prototype=r(e),a=new d,d.prototype=null,a[p]=e):a=f(),void 0===t?a:c(a,t)}},o8WY:function(e,t,a){},or9q:function(e,t,a){"use strict";var n=a("6LWA"),r=a("UMSQ"),c=a("A2ZE"),i=function(e,t,a,o,l,s,u,p){for(var d,m=l,f=0,v=!!u&&c(u,p,3);f<o;){if(f in a){if(d=v?v(a[f],f,t):a[f],s>0&&n(d))m=i(e,t,d,r(d.length),m,s-1)-1;else{if(m>=9007199254740991)throw TypeError("Exceed the acceptable array length");e[m]=d}m++}f++}return m};e.exports=i},tiKp:function(e,t,a){var n=a("2oRo"),r=a("VpIT"),c=a("UTVS"),i=a("kOOl"),o=a("STAE"),l=a("/b8u"),s=r("wks"),u=n.Symbol,p=l?u:u&&u.withoutSetter||i;e.exports=function(e){return c(s,e)||(o&&c(u,e)?s[e]=u[e]:s[e]=p("Symbol."+e)),s[e]}},zpb6:function(e,t){e.exports.createTagSlug=function(e){return e.replace(new RegExp("(\\s|_|-)+","gmi"),"-")}}}]);
//# sourceMappingURL=component---src-templates-labs-js-09cf2edc43ce79b60fd7.js.map