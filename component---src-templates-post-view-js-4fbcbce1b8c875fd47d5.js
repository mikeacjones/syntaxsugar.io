(window.webpackJsonp=window.webpackJsonp||[]).push([[7],{"A2+M":function(t,e,n){var r=n("X8hv");t.exports={MDXRenderer:r}},Bnag:function(t,e){t.exports=function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}},EbDI:function(t,e){t.exports=function(t){if("undefined"!=typeof Symbol&&Symbol.iterator in Object(t))return Array.from(t)}},Ijbi:function(t,e,n){var r=n("WkPL");t.exports=function(t){if(Array.isArray(t))return r(t)}},RIqP:function(t,e,n){var r=n("Ijbi"),o=n("EbDI"),c=n("ZhPi"),a=n("Bnag");t.exports=function(t){return r(t)||o(t)||c(t)||a()}},SksO:function(t,e){function n(e,r){return t.exports=n=Object.setPrototypeOf||function(t,e){return t.__proto__=e,t},n(e,r)}t.exports=n},WkPL:function(t,e){t.exports=function(t,e){(null==e||e>t.length)&&(e=t.length);for(var n=0,r=new Array(e);n<e;n++)r[n]=t[n];return r}},X8hv:function(t,e,n){var r=n("sXyB"),o=n("RIqP"),c=n("lSNA"),a=n("8OQS");function i(t,e){var n=Object.keys(t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(t);e&&(r=r.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),n.push.apply(n,r)}return n}function u(t){for(var e=1;e<arguments.length;e++){var n=null!=arguments[e]?arguments[e]:{};e%2?i(Object(n),!0).forEach((function(e){c(t,e,n[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(n)):i(Object(n)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(n,e))}))}return t}var l=n("q1tI"),f=n("7ljp").mdx,s=n("BfwJ").useMDXScope;t.exports=function(t){var e=t.scope,n=t.children,c=a(t,["scope","children"]),i=s(e),p=l.useMemo((function(){if(!n)return null;var t=u({React:l,mdx:f},i),e=Object.keys(t),c=e.map((function(e){return t[e]}));return r(Function,["_fn"].concat(o(e),[""+n])).apply(void 0,[{}].concat(o(c)))}),[n,e]);return l.createElement(p,u({},c))}},ZhPi:function(t,e,n){var r=n("WkPL");t.exports=function(t,e){if(t){if("string"==typeof t)return r(t,e);var n=Object.prototype.toString.call(t).slice(8,-1);return"Object"===n&&t.constructor&&(n=t.constructor.name),"Map"===n||"Set"===n?Array.from(t):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?r(t,e):void 0}}},b48C:function(t,e){t.exports=function(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Date.prototype.toString.call(Reflect.construct(Date,[],(function(){}))),!0}catch(t){return!1}}},hrJf:function(t,e,n){},lSNA:function(t,e){t.exports=function(t,e,n){return e in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}},sXyB:function(t,e,n){var r=n("SksO"),o=n("b48C");function c(e,n,a){return o()?t.exports=c=Reflect.construct:t.exports=c=function(t,e,n){var o=[null];o.push.apply(o,e);var c=new(Function.bind.apply(t,o));return n&&r(c,n.prototype),c},c.apply(null,arguments)}t.exports=c},y5fq:function(t,e,n){"use strict";n.r(e);var r=n("q1tI"),o=n.n(r),c=(n("hrJf"),n("A2+M")),a=n("7oih");e.default=function(t){var e=t.data,n=t.pageContext,r=e.mdx,i=r.frontmatter,u=r.body;n.previous,n.next;return o.a.createElement(a.a,null,o.a.createElement("div",{className:"post-view"},o.a.createElement("div",{className:"post-view-header"},o.a.createElement("div",{className:"post-view-title"},o.a.createElement("h1",null,i.title)),o.a.createElement("div",{className:"post-view-date"},null!==(null==i?void 0:i.date)&&o.a.createElement(o.a.Fragment,null,"Written on ",i.date.substring(0,10)))),o.a.createElement("div",{className:"post-view-content"},o.a.createElement(c.MDXRenderer,null,u))))}}}]);
//# sourceMappingURL=component---src-templates-post-view-js-4fbcbce1b8c875fd47d5.js.map