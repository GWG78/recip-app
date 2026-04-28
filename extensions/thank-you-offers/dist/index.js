"use strict";
(() => {
  // node_modules/preact/dist/preact.module.js
  var n;
  var l;
  var u;
  var t;
  var i;
  var r;
  var o;
  var e;
  var f;
  var c;
  var s;
  var a;
  var h;
  var p = {};
  var v = [];
  var y = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;
  var d = Array.isArray;
  function w(n3, l5) {
    for (var u4 in l5) n3[u4] = l5[u4];
    return n3;
  }
  function g(n3) {
    n3 && n3.parentNode && n3.parentNode.removeChild(n3);
  }
  function _(l5, u4, t4) {
    var i4, r4, o4, e4 = {};
    for (o4 in u4) "key" == o4 ? i4 = u4[o4] : "ref" == o4 ? r4 = u4[o4] : e4[o4] = u4[o4];
    if (arguments.length > 2 && (e4.children = arguments.length > 3 ? n.call(arguments, 2) : t4), "function" == typeof l5 && null != l5.defaultProps) for (o4 in l5.defaultProps) void 0 === e4[o4] && (e4[o4] = l5.defaultProps[o4]);
    return m(l5, e4, i4, r4, null);
  }
  function m(n3, t4, i4, r4, o4) {
    var e4 = { type: n3, props: t4, key: i4, ref: r4, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: null == o4 ? ++u : o4, __i: -1, __u: 0 };
    return null == o4 && null != l.vnode && l.vnode(e4), e4;
  }
  function k(n3) {
    return n3.children;
  }
  function x(n3, l5) {
    this.props = n3, this.context = l5;
  }
  function S(n3, l5) {
    if (null == l5) return n3.__ ? S(n3.__, n3.__i + 1) : null;
    for (var u4; l5 < n3.__k.length; l5++) if (null != (u4 = n3.__k[l5]) && null != u4.__e) return u4.__e;
    return "function" == typeof n3.type ? S(n3) : null;
  }
  function C(n3) {
    if (n3.__P && n3.__d) {
      var u4 = n3.__v, t4 = u4.__e, i4 = [], r4 = [], o4 = w({}, u4);
      o4.__v = u4.__v + 1, l.vnode && l.vnode(o4), z(n3.__P, o4, u4, n3.__n, n3.__P.namespaceURI, 32 & u4.__u ? [t4] : null, i4, null == t4 ? S(u4) : t4, !!(32 & u4.__u), r4), o4.__v = u4.__v, o4.__.__k[o4.__i] = o4, V(i4, o4, r4), u4.__e = u4.__ = null, o4.__e != t4 && M(o4);
    }
  }
  function M(n3) {
    if (null != (n3 = n3.__) && null != n3.__c) return n3.__e = n3.__c.base = null, n3.__k.some(function(l5) {
      if (null != l5 && null != l5.__e) return n3.__e = n3.__c.base = l5.__e;
    }), M(n3);
  }
  function $(n3) {
    (!n3.__d && (n3.__d = true) && i.push(n3) && !I.__r++ || r != l.debounceRendering) && ((r = l.debounceRendering) || o)(I);
  }
  function I() {
    for (var n3, l5 = 1; i.length; ) i.length > l5 && i.sort(e), n3 = i.shift(), l5 = i.length, C(n3);
    I.__r = 0;
  }
  function P(n3, l5, u4, t4, i4, r4, o4, e4, f4, c4, s4) {
    var a4, h5, y5, d5, w5, g4, _4, m4 = t4 && t4.__k || v, b3 = l5.length;
    for (f4 = A(u4, l5, m4, f4, b3), a4 = 0; a4 < b3; a4++) null != (y5 = u4.__k[a4]) && (h5 = -1 != y5.__i && m4[y5.__i] || p, y5.__i = a4, g4 = z(n3, y5, h5, i4, r4, o4, e4, f4, c4, s4), d5 = y5.__e, y5.ref && h5.ref != y5.ref && (h5.ref && D(h5.ref, null, y5), s4.push(y5.ref, y5.__c || d5, y5)), null == w5 && null != d5 && (w5 = d5), (_4 = !!(4 & y5.__u)) || h5.__k === y5.__k ? f4 = H(y5, f4, n3, _4) : "function" == typeof y5.type && void 0 !== g4 ? f4 = g4 : d5 && (f4 = d5.nextSibling), y5.__u &= -7);
    return u4.__e = w5, f4;
  }
  function A(n3, l5, u4, t4, i4) {
    var r4, o4, e4, f4, c4, s4 = u4.length, a4 = s4, h5 = 0;
    for (n3.__k = new Array(i4), r4 = 0; r4 < i4; r4++) null != (o4 = l5[r4]) && "boolean" != typeof o4 && "function" != typeof o4 ? ("string" == typeof o4 || "number" == typeof o4 || "bigint" == typeof o4 || o4.constructor == String ? o4 = n3.__k[r4] = m(null, o4, null, null, null) : d(o4) ? o4 = n3.__k[r4] = m(k, { children: o4 }, null, null, null) : void 0 === o4.constructor && o4.__b > 0 ? o4 = n3.__k[r4] = m(o4.type, o4.props, o4.key, o4.ref ? o4.ref : null, o4.__v) : n3.__k[r4] = o4, f4 = r4 + h5, o4.__ = n3, o4.__b = n3.__b + 1, e4 = null, -1 != (c4 = o4.__i = T(o4, u4, f4, a4)) && (a4--, (e4 = u4[c4]) && (e4.__u |= 2)), null == e4 || null == e4.__v ? (-1 == c4 && (i4 > s4 ? h5-- : i4 < s4 && h5++), "function" != typeof o4.type && (o4.__u |= 4)) : c4 != f4 && (c4 == f4 - 1 ? h5-- : c4 == f4 + 1 ? h5++ : (c4 > f4 ? h5-- : h5++, o4.__u |= 4))) : n3.__k[r4] = null;
    if (a4) for (r4 = 0; r4 < s4; r4++) null != (e4 = u4[r4]) && 0 == (2 & e4.__u) && (e4.__e == t4 && (t4 = S(e4)), E(e4, e4));
    return t4;
  }
  function H(n3, l5, u4, t4) {
    var i4, r4;
    if ("function" == typeof n3.type) {
      for (i4 = n3.__k, r4 = 0; i4 && r4 < i4.length; r4++) i4[r4] && (i4[r4].__ = n3, l5 = H(i4[r4], l5, u4, t4));
      return l5;
    }
    n3.__e != l5 && (t4 && (l5 && n3.type && !l5.parentNode && (l5 = S(n3)), u4.insertBefore(n3.__e, l5 || null)), l5 = n3.__e);
    do {
      l5 = l5 && l5.nextSibling;
    } while (null != l5 && 8 == l5.nodeType);
    return l5;
  }
  function T(n3, l5, u4, t4) {
    var i4, r4, o4, e4 = n3.key, f4 = n3.type, c4 = l5[u4], s4 = null != c4 && 0 == (2 & c4.__u);
    if (null === c4 && null == e4 || s4 && e4 == c4.key && f4 == c4.type) return u4;
    if (t4 > (s4 ? 1 : 0)) {
      for (i4 = u4 - 1, r4 = u4 + 1; i4 >= 0 || r4 < l5.length; ) if (null != (c4 = l5[o4 = i4 >= 0 ? i4-- : r4++]) && 0 == (2 & c4.__u) && e4 == c4.key && f4 == c4.type) return o4;
    }
    return -1;
  }
  function j(n3, l5, u4) {
    "-" == l5[0] ? n3.setProperty(l5, null == u4 ? "" : u4) : n3[l5] = null == u4 ? "" : "number" != typeof u4 || y.test(l5) ? u4 : u4 + "px";
  }
  function F(n3, l5, u4, t4, i4) {
    var r4, o4;
    n: if ("style" == l5) if ("string" == typeof u4) n3.style.cssText = u4;
    else {
      if ("string" == typeof t4 && (n3.style.cssText = t4 = ""), t4) for (l5 in t4) u4 && l5 in u4 || j(n3.style, l5, "");
      if (u4) for (l5 in u4) t4 && u4[l5] == t4[l5] || j(n3.style, l5, u4[l5]);
    }
    else if ("o" == l5[0] && "n" == l5[1]) r4 = l5 != (l5 = l5.replace(f, "$1")), o4 = l5.toLowerCase(), l5 = o4 in n3 || "onFocusOut" == l5 || "onFocusIn" == l5 ? o4.slice(2) : l5.slice(2), n3.l || (n3.l = {}), n3.l[l5 + r4] = u4, u4 ? t4 ? u4.u = t4.u : (u4.u = c, n3.addEventListener(l5, r4 ? a : s, r4)) : n3.removeEventListener(l5, r4 ? a : s, r4);
    else {
      if ("http://www.w3.org/2000/svg" == i4) l5 = l5.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
      else if ("width" != l5 && "height" != l5 && "href" != l5 && "list" != l5 && "form" != l5 && "tabIndex" != l5 && "download" != l5 && "rowSpan" != l5 && "colSpan" != l5 && "role" != l5 && "popover" != l5 && l5 in n3) try {
        n3[l5] = null == u4 ? "" : u4;
        break n;
      } catch (n4) {
      }
      "function" == typeof u4 || (null == u4 || false === u4 && "-" != l5[4] ? n3.removeAttribute(l5) : n3.setAttribute(l5, "popover" == l5 && 1 == u4 ? "" : u4));
    }
  }
  function O(n3) {
    return function(u4) {
      if (this.l) {
        var t4 = this.l[u4.type + n3];
        if (null == u4.t) u4.t = c++;
        else if (u4.t < t4.u) return;
        return t4(l.event ? l.event(u4) : u4);
      }
    };
  }
  function z(n3, u4, t4, i4, r4, o4, e4, f4, c4, s4) {
    var a4, h5, p5, y5, _4, m4, b3, S3, C4, M2, $2, I2, A3, H2, L, T3 = u4.type;
    if (void 0 !== u4.constructor) return null;
    128 & t4.__u && (c4 = !!(32 & t4.__u), o4 = [f4 = u4.__e = t4.__e]), (a4 = l.__b) && a4(u4);
    n: if ("function" == typeof T3) try {
      if (S3 = u4.props, C4 = "prototype" in T3 && T3.prototype.render, M2 = (a4 = T3.contextType) && i4[a4.__c], $2 = a4 ? M2 ? M2.props.value : a4.__ : i4, t4.__c ? b3 = (h5 = u4.__c = t4.__c).__ = h5.__E : (C4 ? u4.__c = h5 = new T3(S3, $2) : (u4.__c = h5 = new x(S3, $2), h5.constructor = T3, h5.render = G), M2 && M2.sub(h5), h5.state || (h5.state = {}), h5.__n = i4, p5 = h5.__d = true, h5.__h = [], h5._sb = []), C4 && null == h5.__s && (h5.__s = h5.state), C4 && null != T3.getDerivedStateFromProps && (h5.__s == h5.state && (h5.__s = w({}, h5.__s)), w(h5.__s, T3.getDerivedStateFromProps(S3, h5.__s))), y5 = h5.props, _4 = h5.state, h5.__v = u4, p5) C4 && null == T3.getDerivedStateFromProps && null != h5.componentWillMount && h5.componentWillMount(), C4 && null != h5.componentDidMount && h5.__h.push(h5.componentDidMount);
      else {
        if (C4 && null == T3.getDerivedStateFromProps && S3 !== y5 && null != h5.componentWillReceiveProps && h5.componentWillReceiveProps(S3, $2), u4.__v == t4.__v || !h5.__e && null != h5.shouldComponentUpdate && false === h5.shouldComponentUpdate(S3, h5.__s, $2)) {
          u4.__v != t4.__v && (h5.props = S3, h5.state = h5.__s, h5.__d = false), u4.__e = t4.__e, u4.__k = t4.__k, u4.__k.some(function(n4) {
            n4 && (n4.__ = u4);
          }), v.push.apply(h5.__h, h5._sb), h5._sb = [], h5.__h.length && e4.push(h5);
          break n;
        }
        null != h5.componentWillUpdate && h5.componentWillUpdate(S3, h5.__s, $2), C4 && null != h5.componentDidUpdate && h5.__h.push(function() {
          h5.componentDidUpdate(y5, _4, m4);
        });
      }
      if (h5.context = $2, h5.props = S3, h5.__P = n3, h5.__e = false, I2 = l.__r, A3 = 0, C4) h5.state = h5.__s, h5.__d = false, I2 && I2(u4), a4 = h5.render(h5.props, h5.state, h5.context), v.push.apply(h5.__h, h5._sb), h5._sb = [];
      else do {
        h5.__d = false, I2 && I2(u4), a4 = h5.render(h5.props, h5.state, h5.context), h5.state = h5.__s;
      } while (h5.__d && ++A3 < 25);
      h5.state = h5.__s, null != h5.getChildContext && (i4 = w(w({}, i4), h5.getChildContext())), C4 && !p5 && null != h5.getSnapshotBeforeUpdate && (m4 = h5.getSnapshotBeforeUpdate(y5, _4)), H2 = null != a4 && a4.type === k && null == a4.key ? q(a4.props.children) : a4, f4 = P(n3, d(H2) ? H2 : [H2], u4, t4, i4, r4, o4, e4, f4, c4, s4), h5.base = u4.__e, u4.__u &= -161, h5.__h.length && e4.push(h5), b3 && (h5.__E = h5.__ = null);
    } catch (n4) {
      if (u4.__v = null, c4 || null != o4) if (n4.then) {
        for (u4.__u |= c4 ? 160 : 128; f4 && 8 == f4.nodeType && f4.nextSibling; ) f4 = f4.nextSibling;
        o4[o4.indexOf(f4)] = null, u4.__e = f4;
      } else {
        for (L = o4.length; L--; ) g(o4[L]);
        N(u4);
      }
      else u4.__e = t4.__e, u4.__k = t4.__k, n4.then || N(u4);
      l.__e(n4, u4, t4);
    }
    else null == o4 && u4.__v == t4.__v ? (u4.__k = t4.__k, u4.__e = t4.__e) : f4 = u4.__e = B(t4.__e, u4, t4, i4, r4, o4, e4, c4, s4);
    return (a4 = l.diffed) && a4(u4), 128 & u4.__u ? void 0 : f4;
  }
  function N(n3) {
    n3 && (n3.__c && (n3.__c.__e = true), n3.__k && n3.__k.some(N));
  }
  function V(n3, u4, t4) {
    for (var i4 = 0; i4 < t4.length; i4++) D(t4[i4], t4[++i4], t4[++i4]);
    l.__c && l.__c(u4, n3), n3.some(function(u5) {
      try {
        n3 = u5.__h, u5.__h = [], n3.some(function(n4) {
          n4.call(u5);
        });
      } catch (n4) {
        l.__e(n4, u5.__v);
      }
    });
  }
  function q(n3) {
    return "object" != typeof n3 || null == n3 || n3.__b > 0 ? n3 : d(n3) ? n3.map(q) : w({}, n3);
  }
  function B(u4, t4, i4, r4, o4, e4, f4, c4, s4) {
    var a4, h5, v4, y5, w5, _4, m4, b3 = i4.props || p, k3 = t4.props, x3 = t4.type;
    if ("svg" == x3 ? o4 = "http://www.w3.org/2000/svg" : "math" == x3 ? o4 = "http://www.w3.org/1998/Math/MathML" : o4 || (o4 = "http://www.w3.org/1999/xhtml"), null != e4) {
      for (a4 = 0; a4 < e4.length; a4++) if ((w5 = e4[a4]) && "setAttribute" in w5 == !!x3 && (x3 ? w5.localName == x3 : 3 == w5.nodeType)) {
        u4 = w5, e4[a4] = null;
        break;
      }
    }
    if (null == u4) {
      if (null == x3) return document.createTextNode(k3);
      u4 = document.createElementNS(o4, x3, k3.is && k3), c4 && (l.__m && l.__m(t4, e4), c4 = false), e4 = null;
    }
    if (null == x3) b3 === k3 || c4 && u4.data == k3 || (u4.data = k3);
    else {
      if (e4 = e4 && n.call(u4.childNodes), !c4 && null != e4) for (b3 = {}, a4 = 0; a4 < u4.attributes.length; a4++) b3[(w5 = u4.attributes[a4]).name] = w5.value;
      for (a4 in b3) w5 = b3[a4], "dangerouslySetInnerHTML" == a4 ? v4 = w5 : "children" == a4 || a4 in k3 || "value" == a4 && "defaultValue" in k3 || "checked" == a4 && "defaultChecked" in k3 || F(u4, a4, null, w5, o4);
      for (a4 in k3) w5 = k3[a4], "children" == a4 ? y5 = w5 : "dangerouslySetInnerHTML" == a4 ? h5 = w5 : "value" == a4 ? _4 = w5 : "checked" == a4 ? m4 = w5 : c4 && "function" != typeof w5 || b3[a4] === w5 || F(u4, a4, w5, b3[a4], o4);
      if (h5) c4 || v4 && (h5.__html == v4.__html || h5.__html == u4.innerHTML) || (u4.innerHTML = h5.__html), t4.__k = [];
      else if (v4 && (u4.innerHTML = ""), P("template" == t4.type ? u4.content : u4, d(y5) ? y5 : [y5], t4, i4, r4, "foreignObject" == x3 ? "http://www.w3.org/1999/xhtml" : o4, e4, f4, e4 ? e4[0] : i4.__k && S(i4, 0), c4, s4), null != e4) for (a4 = e4.length; a4--; ) g(e4[a4]);
      c4 || (a4 = "value", "progress" == x3 && null == _4 ? u4.removeAttribute("value") : null != _4 && (_4 !== u4[a4] || "progress" == x3 && !_4 || "option" == x3 && _4 != b3[a4]) && F(u4, a4, _4, b3[a4], o4), a4 = "checked", null != m4 && m4 != u4[a4] && F(u4, a4, m4, b3[a4], o4));
    }
    return u4;
  }
  function D(n3, u4, t4) {
    try {
      if ("function" == typeof n3) {
        var i4 = "function" == typeof n3.__u;
        i4 && n3.__u(), i4 && null == u4 || (n3.__u = n3(u4));
      } else n3.current = u4;
    } catch (n4) {
      l.__e(n4, t4);
    }
  }
  function E(n3, u4, t4) {
    var i4, r4;
    if (l.unmount && l.unmount(n3), (i4 = n3.ref) && (i4.current && i4.current != n3.__e || D(i4, null, u4)), null != (i4 = n3.__c)) {
      if (i4.componentWillUnmount) try {
        i4.componentWillUnmount();
      } catch (n4) {
        l.__e(n4, u4);
      }
      i4.base = i4.__P = null;
    }
    if (i4 = n3.__k) for (r4 = 0; r4 < i4.length; r4++) i4[r4] && E(i4[r4], u4, t4 || "function" != typeof n3.type);
    t4 || g(n3.__e), n3.__c = n3.__ = n3.__e = void 0;
  }
  function G(n3, l5, u4) {
    return this.constructor(n3, u4);
  }
  function J(u4, t4, i4) {
    var r4, o4, e4, f4;
    t4 == document && (t4 = document.documentElement), l.__ && l.__(u4, t4), o4 = (r4 = "function" == typeof i4) ? null : i4 && i4.__k || t4.__k, e4 = [], f4 = [], z(t4, u4 = (!r4 && i4 || t4).__k = _(k, null, [u4]), o4 || p, p, t4.namespaceURI, !r4 && i4 ? [i4] : o4 ? null : t4.firstChild ? n.call(t4.childNodes) : null, e4, !r4 && i4 ? i4 : o4 ? o4.__e : t4.firstChild, r4, f4), V(e4, u4, f4);
  }
  n = v.slice, l = { __e: function(n3, l5, u4, t4) {
    for (var i4, r4, o4; l5 = l5.__; ) if ((i4 = l5.__c) && !i4.__) try {
      if ((r4 = i4.constructor) && null != r4.getDerivedStateFromError && (i4.setState(r4.getDerivedStateFromError(n3)), o4 = i4.__d), null != i4.componentDidCatch && (i4.componentDidCatch(n3, t4 || {}), o4 = i4.__d), o4) return i4.__E = i4;
    } catch (l6) {
      n3 = l6;
    }
    throw n3;
  } }, u = 0, t = function(n3) {
    return null != n3 && void 0 === n3.constructor;
  }, x.prototype.setState = function(n3, l5) {
    var u4;
    u4 = null != this.__s && this.__s != this.state ? this.__s : this.__s = w({}, this.state), "function" == typeof n3 && (n3 = n3(w({}, u4), this.props)), n3 && w(u4, n3), null != n3 && this.__v && (l5 && this._sb.push(l5), $(this));
  }, x.prototype.forceUpdate = function(n3) {
    this.__v && (this.__e = true, n3 && this.__h.push(n3), $(this));
  }, x.prototype.render = k, i = [], o = "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, e = function(n3, l5) {
    return n3.__v.__b - l5.__v.__b;
  }, I.__r = 0, f = /(PointerCapture)$|Capture$/i, c = 0, s = O(false), a = O(true), h = 0;

  // node_modules/preact/hooks/dist/hooks.module.js
  var t2;
  var r2;
  var u2;
  var i2;
  var o2 = 0;
  var f2 = [];
  var c2 = l;
  var e2 = c2.__b;
  var a2 = c2.__r;
  var v2 = c2.diffed;
  var l2 = c2.__c;
  var m2 = c2.unmount;
  var s2 = c2.__;
  function p2(n3, t4) {
    c2.__h && c2.__h(r2, n3, o2 || t4), o2 = 0;
    var u4 = r2.__H || (r2.__H = { __: [], __h: [] });
    return n3 >= u4.__.length && u4.__.push({}), u4.__[n3];
  }
  function d2(n3) {
    return o2 = 1, h2(D2, n3);
  }
  function h2(n3, u4, i4) {
    var o4 = p2(t2++, 2);
    if (o4.t = n3, !o4.__c && (o4.__ = [i4 ? i4(u4) : D2(void 0, u4), function(n4) {
      var t4 = o4.__N ? o4.__N[0] : o4.__[0], r4 = o4.t(t4, n4);
      t4 !== r4 && (o4.__N = [r4, o4.__[1]], o4.__c.setState({}));
    }], o4.__c = r2, !r2.__f)) {
      var f4 = function(n4, t4, r4) {
        if (!o4.__c.__H) return true;
        var u5 = o4.__c.__H.__.filter(function(n5) {
          return n5.__c;
        });
        if (u5.every(function(n5) {
          return !n5.__N;
        })) return !c4 || c4.call(this, n4, t4, r4);
        var i5 = o4.__c.props !== n4;
        return u5.some(function(n5) {
          if (n5.__N) {
            var t5 = n5.__[0];
            n5.__ = n5.__N, n5.__N = void 0, t5 !== n5.__[0] && (i5 = true);
          }
        }), c4 && c4.call(this, n4, t4, r4) || i5;
      };
      r2.__f = true;
      var c4 = r2.shouldComponentUpdate, e4 = r2.componentWillUpdate;
      r2.componentWillUpdate = function(n4, t4, r4) {
        if (this.__e) {
          var u5 = c4;
          c4 = void 0, f4(n4, t4, r4), c4 = u5;
        }
        e4 && e4.call(this, n4, t4, r4);
      }, r2.shouldComponentUpdate = f4;
    }
    return o4.__N || o4.__;
  }
  function y2(n3, u4) {
    var i4 = p2(t2++, 3);
    !c2.__s && C2(i4.__H, u4) && (i4.__ = n3, i4.u = u4, r2.__H.__h.push(i4));
  }
  function T2(n3, r4) {
    var u4 = p2(t2++, 7);
    return C2(u4.__H, r4) && (u4.__ = n3(), u4.__H = r4, u4.__h = n3), u4.__;
  }
  function j2() {
    for (var n3; n3 = f2.shift(); ) {
      var t4 = n3.__H;
      if (n3.__P && t4) try {
        t4.__h.some(z2), t4.__h.some(B2), t4.__h = [];
      } catch (r4) {
        t4.__h = [], c2.__e(r4, n3.__v);
      }
    }
  }
  c2.__b = function(n3) {
    r2 = null, e2 && e2(n3);
  }, c2.__ = function(n3, t4) {
    n3 && t4.__k && t4.__k.__m && (n3.__m = t4.__k.__m), s2 && s2(n3, t4);
  }, c2.__r = function(n3) {
    a2 && a2(n3), t2 = 0;
    var i4 = (r2 = n3.__c).__H;
    i4 && (u2 === r2 ? (i4.__h = [], r2.__h = [], i4.__.some(function(n4) {
      n4.__N && (n4.__ = n4.__N), n4.u = n4.__N = void 0;
    })) : (i4.__h.some(z2), i4.__h.some(B2), i4.__h = [], t2 = 0)), u2 = r2;
  }, c2.diffed = function(n3) {
    v2 && v2(n3);
    var t4 = n3.__c;
    t4 && t4.__H && (t4.__H.__h.length && (1 !== f2.push(t4) && i2 === c2.requestAnimationFrame || ((i2 = c2.requestAnimationFrame) || w2)(j2)), t4.__H.__.some(function(n4) {
      n4.u && (n4.__H = n4.u), n4.u = void 0;
    })), u2 = r2 = null;
  }, c2.__c = function(n3, t4) {
    t4.some(function(n4) {
      try {
        n4.__h.some(z2), n4.__h = n4.__h.filter(function(n5) {
          return !n5.__ || B2(n5);
        });
      } catch (r4) {
        t4.some(function(n5) {
          n5.__h && (n5.__h = []);
        }), t4 = [], c2.__e(r4, n4.__v);
      }
    }), l2 && l2(n3, t4);
  }, c2.unmount = function(n3) {
    m2 && m2(n3);
    var t4, r4 = n3.__c;
    r4 && r4.__H && (r4.__H.__.some(function(n4) {
      try {
        z2(n4);
      } catch (n5) {
        t4 = n5;
      }
    }), r4.__H = void 0, t4 && c2.__e(t4, r4.__v));
  };
  var k2 = "function" == typeof requestAnimationFrame;
  function w2(n3) {
    var t4, r4 = function() {
      clearTimeout(u4), k2 && cancelAnimationFrame(t4), setTimeout(n3);
    }, u4 = setTimeout(r4, 35);
    k2 && (t4 = requestAnimationFrame(r4));
  }
  function z2(n3) {
    var t4 = r2, u4 = n3.__c;
    "function" == typeof u4 && (n3.__c = void 0, u4()), r2 = t4;
  }
  function B2(n3) {
    var t4 = r2;
    n3.__c = n3.__(), r2 = t4;
  }
  function C2(n3, t4) {
    return !n3 || n3.length !== t4.length || t4.some(function(t5, r4) {
      return t5 !== n3[r4];
    });
  }
  function D2(n3, t4) {
    return "function" == typeof t4 ? t4(n3) : t4;
  }

  // node_modules/@preact/signals-core/dist/signals-core.module.js
  var i3 = Symbol.for("preact-signals");
  function t3() {
    if (!(s3 > 1)) {
      var i4, t4 = false;
      while (void 0 !== h3) {
        var n3 = h3;
        h3 = void 0;
        v3++;
        while (void 0 !== n3) {
          var r4 = n3.o;
          n3.o = void 0;
          n3.f &= -3;
          if (!(8 & n3.f) && a3(n3)) try {
            n3.c();
          } catch (n4) {
            if (!t4) {
              i4 = n4;
              t4 = true;
            }
          }
          n3 = r4;
        }
      }
      v3 = 0;
      s3--;
      if (t4) throw i4;
    } else s3--;
  }
  function n2(i4) {
    if (s3 > 0) return i4();
    s3++;
    try {
      return i4();
    } finally {
      t3();
    }
  }
  var r3 = void 0;
  function o3(i4) {
    var t4 = r3;
    r3 = void 0;
    try {
      return i4();
    } finally {
      r3 = t4;
    }
  }
  var f3;
  var h3 = void 0;
  var s3 = 0;
  var v3 = 0;
  var u3 = 0;
  function e3(i4) {
    if (void 0 !== r3) {
      var t4 = i4.n;
      if (void 0 === t4 || t4.t !== r3) {
        t4 = { i: 0, S: i4, p: r3.s, n: void 0, t: r3, e: void 0, x: void 0, r: t4 };
        if (void 0 !== r3.s) r3.s.n = t4;
        r3.s = t4;
        i4.n = t4;
        if (32 & r3.f) i4.S(t4);
        return t4;
      } else if (-1 === t4.i) {
        t4.i = 0;
        if (void 0 !== t4.n) {
          t4.n.p = t4.p;
          if (void 0 !== t4.p) t4.p.n = t4.n;
          t4.p = r3.s;
          t4.n = void 0;
          r3.s.n = t4;
          r3.s = t4;
        }
        return t4;
      }
    }
  }
  function d3(i4, t4) {
    this.v = i4;
    this.i = 0;
    this.n = void 0;
    this.t = void 0;
    this.W = null == t4 ? void 0 : t4.watched;
    this.Z = null == t4 ? void 0 : t4.unwatched;
    this.name = null == t4 ? void 0 : t4.name;
  }
  d3.prototype.brand = i3;
  d3.prototype.h = function() {
    return true;
  };
  d3.prototype.S = function(i4) {
    var t4 = this, n3 = this.t;
    if (n3 !== i4 && void 0 === i4.e) {
      i4.x = n3;
      this.t = i4;
      if (void 0 !== n3) n3.e = i4;
      else o3(function() {
        var i5;
        null == (i5 = t4.W) || i5.call(t4);
      });
    }
  };
  d3.prototype.U = function(i4) {
    var t4 = this;
    if (void 0 !== this.t) {
      var n3 = i4.e, r4 = i4.x;
      if (void 0 !== n3) {
        n3.x = r4;
        i4.e = void 0;
      }
      if (void 0 !== r4) {
        r4.e = n3;
        i4.x = void 0;
      }
      if (i4 === this.t) {
        this.t = r4;
        if (void 0 === r4) o3(function() {
          var i5;
          null == (i5 = t4.Z) || i5.call(t4);
        });
      }
    }
  };
  d3.prototype.subscribe = function(i4) {
    var t4 = this;
    return m3(function() {
      var n3 = t4.value, o4 = r3;
      r3 = void 0;
      try {
        i4(n3);
      } finally {
        r3 = o4;
      }
    }, { name: "sub" });
  };
  d3.prototype.valueOf = function() {
    return this.value;
  };
  d3.prototype.toString = function() {
    return this.value + "";
  };
  d3.prototype.toJSON = function() {
    return this.value;
  };
  d3.prototype.peek = function() {
    var i4 = r3;
    r3 = void 0;
    try {
      return this.value;
    } finally {
      r3 = i4;
    }
  };
  Object.defineProperty(d3.prototype, "value", { get: function() {
    var i4 = e3(this);
    if (void 0 !== i4) i4.i = this.i;
    return this.v;
  }, set: function(i4) {
    if (i4 !== this.v) {
      if (v3 > 100) throw new Error("Cycle detected");
      this.v = i4;
      this.i++;
      u3++;
      s3++;
      try {
        for (var n3 = this.t; void 0 !== n3; n3 = n3.x) n3.t.N();
      } finally {
        t3();
      }
    }
  } });
  function c3(i4, t4) {
    return new d3(i4, t4);
  }
  function a3(i4) {
    for (var t4 = i4.s; void 0 !== t4; t4 = t4.n) if (t4.S.i !== t4.i || !t4.S.h() || t4.S.i !== t4.i) return true;
    return false;
  }
  function l3(i4) {
    for (var t4 = i4.s; void 0 !== t4; t4 = t4.n) {
      var n3 = t4.S.n;
      if (void 0 !== n3) t4.r = n3;
      t4.S.n = t4;
      t4.i = -1;
      if (void 0 === t4.n) {
        i4.s = t4;
        break;
      }
    }
  }
  function y3(i4) {
    var t4 = i4.s, n3 = void 0;
    while (void 0 !== t4) {
      var r4 = t4.p;
      if (-1 === t4.i) {
        t4.S.U(t4);
        if (void 0 !== r4) r4.n = t4.n;
        if (void 0 !== t4.n) t4.n.p = r4;
      } else n3 = t4;
      t4.S.n = t4.r;
      if (void 0 !== t4.r) t4.r = void 0;
      t4 = r4;
    }
    i4.s = n3;
  }
  function w3(i4, t4) {
    d3.call(this, void 0);
    this.x = i4;
    this.s = void 0;
    this.g = u3 - 1;
    this.f = 4;
    this.W = null == t4 ? void 0 : t4.watched;
    this.Z = null == t4 ? void 0 : t4.unwatched;
    this.name = null == t4 ? void 0 : t4.name;
  }
  w3.prototype = new d3();
  w3.prototype.h = function() {
    this.f &= -3;
    if (1 & this.f) return false;
    if (32 == (36 & this.f)) return true;
    this.f &= -5;
    if (this.g === u3) return true;
    this.g = u3;
    this.f |= 1;
    if (this.i > 0 && !a3(this)) {
      this.f &= -2;
      return true;
    }
    var i4 = r3;
    try {
      l3(this);
      r3 = this;
      var t4 = this.x();
      if (16 & this.f || this.v !== t4 || 0 === this.i) {
        this.v = t4;
        this.f &= -17;
        this.i++;
      }
    } catch (i5) {
      this.v = i5;
      this.f |= 16;
      this.i++;
    }
    r3 = i4;
    y3(this);
    this.f &= -2;
    return true;
  };
  w3.prototype.S = function(i4) {
    if (void 0 === this.t) {
      this.f |= 36;
      for (var t4 = this.s; void 0 !== t4; t4 = t4.n) t4.S.S(t4);
    }
    d3.prototype.S.call(this, i4);
  };
  w3.prototype.U = function(i4) {
    if (void 0 !== this.t) {
      d3.prototype.U.call(this, i4);
      if (void 0 === this.t) {
        this.f &= -33;
        for (var t4 = this.s; void 0 !== t4; t4 = t4.n) t4.S.U(t4);
      }
    }
  };
  w3.prototype.N = function() {
    if (!(2 & this.f)) {
      this.f |= 6;
      for (var i4 = this.t; void 0 !== i4; i4 = i4.x) i4.t.N();
    }
  };
  Object.defineProperty(w3.prototype, "value", { get: function() {
    if (1 & this.f) throw new Error("Cycle detected");
    var i4 = e3(this);
    this.h();
    if (void 0 !== i4) i4.i = this.i;
    if (16 & this.f) throw this.v;
    return this.v;
  } });
  function b(i4, t4) {
    return new w3(i4, t4);
  }
  function _2(i4) {
    var n3 = i4.u;
    i4.u = void 0;
    if ("function" == typeof n3) {
      s3++;
      var o4 = r3;
      r3 = void 0;
      try {
        n3();
      } catch (t4) {
        i4.f &= -2;
        i4.f |= 8;
        p3(i4);
        throw t4;
      } finally {
        r3 = o4;
        t3();
      }
    }
  }
  function p3(i4) {
    for (var t4 = i4.s; void 0 !== t4; t4 = t4.n) t4.S.U(t4);
    i4.x = void 0;
    i4.s = void 0;
    _2(i4);
  }
  function g2(i4) {
    if (r3 !== this) throw new Error("Out-of-order effect");
    y3(this);
    r3 = i4;
    this.f &= -2;
    if (8 & this.f) p3(this);
    t3();
  }
  function S2(i4, t4) {
    this.x = i4;
    this.u = void 0;
    this.s = void 0;
    this.o = void 0;
    this.f = 32;
    this.name = null == t4 ? void 0 : t4.name;
    if (f3) f3.push(this);
  }
  S2.prototype.c = function() {
    var i4 = this.S();
    try {
      if (8 & this.f) return;
      if (void 0 === this.x) return;
      var t4 = this.x();
      if ("function" == typeof t4) this.u = t4;
    } finally {
      i4();
    }
  };
  S2.prototype.S = function() {
    if (1 & this.f) throw new Error("Cycle detected");
    this.f |= 1;
    this.f &= -9;
    _2(this);
    l3(this);
    s3++;
    var i4 = r3;
    r3 = this;
    return g2.bind(this, i4);
  };
  S2.prototype.N = function() {
    if (!(2 & this.f)) {
      this.f |= 2;
      this.o = h3;
      h3 = this;
    }
  };
  S2.prototype.d = function() {
    this.f |= 8;
    if (!(1 & this.f)) p3(this);
  };
  S2.prototype.dispose = function() {
    this.d();
  };
  function m3(i4, t4) {
    var n3 = new S2(i4, t4);
    try {
      n3.c();
    } catch (i5) {
      n3.d();
      throw i5;
    }
    var r4 = n3.d.bind(n3);
    r4[Symbol.dispose] = r4;
    return r4;
  }

  // node_modules/@preact/signals/dist/signals.module.js
  var l4;
  var d4;
  var h4;
  var p4 = "undefined" != typeof window && !!window.__PREACT_SIGNALS_DEVTOOLS__;
  var _3 = [];
  m3(function() {
    l4 = this.N;
  })();
  function g3(i4, r4) {
    l[i4] = r4.bind(null, l[i4] || function() {
    });
  }
  function b2(i4) {
    if (h4) {
      var n3 = h4;
      h4 = void 0;
      n3();
    }
    h4 = i4 && i4.S();
  }
  function y4(i4) {
    var n3 = this, t4 = i4.data, f4 = useSignal(t4);
    f4.value = t4;
    var e4 = T2(function() {
      var i5 = n3, t5 = n3.__v;
      while (t5 = t5.__) if (t5.__c) {
        t5.__c.__$f |= 4;
        break;
      }
      var o4 = b(function() {
        var i6 = f4.value.value;
        return 0 === i6 ? 0 : true === i6 ? "" : i6 || "";
      }), e5 = b(function() {
        return !Array.isArray(o4.value) && !t(o4.value);
      }), a5 = m3(function() {
        this.N = F2;
        if (e5.value) {
          var n4 = o4.value;
          if (i5.__v && i5.__v.__e && 3 === i5.__v.__e.nodeType) i5.__v.__e.data = n4;
        }
      }), v5 = n3.__$u.d;
      n3.__$u.d = function() {
        a5();
        v5.call(this);
      };
      return [e5, o4];
    }, []), a4 = e4[0], v4 = e4[1];
    return a4.value ? v4.peek() : v4.value;
  }
  y4.displayName = "ReactiveTextNode";
  Object.defineProperties(d3.prototype, { constructor: { configurable: true, value: void 0 }, type: { configurable: true, value: y4 }, props: { configurable: true, get: function() {
    return { data: this };
  } }, __b: { configurable: true, value: 1 } });
  g3("__b", function(i4, n3) {
    if ("string" == typeof n3.type) {
      var r4, t4 = n3.props;
      for (var o4 in t4) if ("children" !== o4) {
        var f4 = t4[o4];
        if (f4 instanceof d3) {
          if (!r4) n3.__np = r4 = {};
          r4[o4] = f4;
          t4[o4] = f4.peek();
        }
      }
    }
    i4(n3);
  });
  g3("__r", function(i4, n3) {
    i4(n3);
    if (n3.type !== k) {
      b2();
      var r4, o4 = n3.__c;
      if (o4) {
        o4.__$f &= -2;
        if (void 0 === (r4 = o4.__$u)) o4.__$u = r4 = (function(i5, n4) {
          var r5;
          m3(function() {
            r5 = this;
          }, { name: n4 });
          r5.c = i5;
          return r5;
        })(function() {
          var i5;
          if (p4) null == (i5 = r4.y) || i5.call(r4);
          o4.__$f |= 1;
          o4.setState({});
        }, "function" == typeof n3.type ? n3.type.displayName || n3.type.name : "");
      }
      d4 = o4;
      b2(r4);
    }
  });
  g3("__e", function(i4, n3, r4, t4) {
    b2();
    d4 = void 0;
    i4(n3, r4, t4);
  });
  g3("diffed", function(i4, n3) {
    b2();
    d4 = void 0;
    var r4;
    if ("string" == typeof n3.type && (r4 = n3.__e)) {
      var t4 = n3.__np, o4 = n3.props;
      if (t4) {
        var f4 = r4.U;
        if (f4) for (var e4 in f4) {
          var u4 = f4[e4];
          if (void 0 !== u4 && !(e4 in t4)) {
            u4.d();
            f4[e4] = void 0;
          }
        }
        else {
          f4 = {};
          r4.U = f4;
        }
        for (var a4 in t4) {
          var c4 = f4[a4], v4 = t4[a4];
          if (void 0 === c4) {
            c4 = w4(r4, a4, v4);
            f4[a4] = c4;
          } else c4.o(v4, o4);
        }
        for (var s4 in t4) o4[s4] = t4[s4];
      }
    }
    i4(n3);
  });
  function w4(i4, n3, r4, t4) {
    var o4 = n3 in i4 && void 0 === i4.ownerSVGElement, f4 = c3(r4), e4 = r4.peek();
    return { o: function(i5, n4) {
      f4.value = i5;
      e4 = i5.peek();
    }, d: m3(function() {
      this.N = F2;
      var r5 = f4.value.value;
      if (e4 !== r5) {
        e4 = void 0;
        if (o4) i4[n3] = r5;
        else if (null != r5 && (false !== r5 || "-" === n3[4])) i4.setAttribute(n3, r5);
        else i4.removeAttribute(n3);
      } else e4 = void 0;
    }) };
  }
  g3("unmount", function(i4, n3) {
    if ("string" == typeof n3.type) {
      var r4 = n3.__e;
      if (r4) {
        var t4 = r4.U;
        if (t4) {
          r4.U = void 0;
          for (var o4 in t4) {
            var f4 = t4[o4];
            if (f4) f4.d();
          }
        }
      }
      n3.__np = void 0;
    } else {
      var e4 = n3.__c;
      if (e4) {
        var u4 = e4.__$u;
        if (u4) {
          e4.__$u = void 0;
          u4.d();
        }
      }
    }
    i4(n3);
  });
  g3("__h", function(i4, n3, r4, t4) {
    if (t4 < 3 || 9 === t4) n3.__$f |= 2;
    i4(n3, r4, t4);
  });
  x.prototype.shouldComponentUpdate = function(i4, n3) {
    if (this.__R) return true;
    var r4 = this.__$u, t4 = r4 && void 0 !== r4.s;
    for (var o4 in n3) return true;
    if (this.__f || "boolean" == typeof this.u && true === this.u) {
      var f4 = 2 & this.__$f;
      if (!(t4 || f4 || 4 & this.__$f)) return true;
      if (1 & this.__$f) return true;
    } else {
      if (!(t4 || 4 & this.__$f)) return true;
      if (3 & this.__$f) return true;
    }
    for (var e4 in i4) if ("__source" !== e4 && i4[e4] !== this.props[e4]) return true;
    for (var u4 in this.props) if (!(u4 in i4)) return true;
    return false;
  };
  function useSignal(i4, n3) {
    return T2(function() {
      return c3(i4, n3);
    }, []);
  }
  var q2 = function(i4) {
    queueMicrotask(function() {
      queueMicrotask(i4);
    });
  };
  function x2() {
    n2(function() {
      var i4;
      while (i4 = _3.shift()) l4.call(i4);
    });
  }
  function F2() {
    if (1 === _3.push(this)) (l.requestAnimationFrame || q2)(x2);
  }

  // node_modules/@shopify/ui-extensions/build/esm/preact.mjs
  var shopify2 = globalThis.shopify;
  if (shopify2 && typeof shopify2.setSignals === "function") {
    shopify2.setSignals(d3);
  }

  // extensions/thank-you-offers/src/index.js
  function resolveAppBaseUrl() {
    const explicit = typeof globalThis !== "undefined" ? globalThis.APP_BASE_URL : null;
    if (explicit) return explicit;
    try {
      const search = globalThis?.location?.search || "";
      const params = new URLSearchParams(search);
      const devParam = params.get("dev");
      if (devParam) {
        const decoded = decodeURIComponent(devParam);
        if (decoded.startsWith("http://") || decoded.startsWith("https://")) {
          return decoded.replace(/\/extensions\/?$/, "");
        }
      }
    } catch (_err) {
    }
    return "https://recip-app-5alg.onrender.com";
  }
  var APP_BASE_URL = resolveAppBaseUrl();
  function readSignal(value) {
    if (value && typeof value === "object") {
      if ("value" in value) return value.value;
      if ("current" in value) return value.current;
    }
    return value;
  }
  function normalizeDomain(value) {
    return String(value || "").toLowerCase().trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
  function resolveShopDomain(shopRef) {
    const shop = readSignal(shopRef);
    const candidates = [
      shop?.myshopifyDomain,
      shop?.shopDomain,
      shop?.domain,
      shop?.permanentDomain,
      readSignal(shop?.myshopifyDomain),
      readSignal(shop?.shopDomain),
      readSignal(shop?.domain),
      readSignal(shop?.permanentDomain)
    ];
    for (const candidate of candidates) {
      const normalized = normalizeDomain(readSignal(candidate));
      if (normalized && normalized.includes(".myshopify.com")) {
        return normalized;
      }
    }
    return null;
  }
  async function trackImpression({ offerId, orderId, fromShopId, toShopId }) {
    try {
      await fetch(`${APP_BASE_URL}/api/events/impression`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId, orderId, fromShopId, toShopId })
      });
    } catch (err) {
      console.warn("[track] impression failed", err);
    }
  }
  function OfferCard({
    offerId,
    brand,
    description,
    offer,
    logoUrl,
    orderId,
    fromShopDomain,
    fromShopId,
    toShopDomain,
    toShopId
  }) {
    const [cardState, setCardState] = d2("initial");
    const [discountCode, setDiscountCode] = d2(null);
    const [errorMessage, setErrorMessage] = d2(null);
    const [logoReady, setLogoReady] = d2(false);
    y2(() => {
      if (orderId && fromShopId && toShopId) {
        trackImpression({ offerId, orderId, fromShopId, toShopId });
      }
    }, [offerId, orderId, fromShopId, toShopId]);
    y2(() => {
      setLogoReady(false);
      if (!logoUrl) return;
      fetch(logoUrl, { method: "HEAD" }).then((res) => {
        if (res.ok) setLogoReady(true);
      }).catch(() => {
      });
    }, [logoUrl]);
    const handleFirstCtaClick = async (e4) => {
      if (e4?.preventDefault) e4.preventDefault();
      setCardState("revealing");
      setErrorMessage(null);
      try {
        const params = new URLSearchParams({
          offerId,
          toShopDomain,
          fromShopDomain: fromShopDomain || "",
          orderId: orderId || ""
        });
        const response = await fetch(`${APP_BASE_URL}/api/activate-code?${params.toString()}`, {
          method: "GET",
          headers: { Accept: "application/json" }
        });
        const data = await response.json();
        if (!response.ok || !data?.code) {
          throw new Error(data?.error || "Failed to activate code");
        }
        setDiscountCode(data.code);
        setCardState("revealed");
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "An error occurred");
        setCardState("error");
      }
    };
    const redirectUrl = discountCode && toShopDomain ? `https://${toShopDomain}/discount/${discountCode}?redirect=/collections/all` : null;
    return _(
      "s-stack",
      { gap: "base", padding: "base", border: "base", borderRadius: "base", inlineSize: "fill" },
      _(
        "s-grid",
        { gridTemplateColumns: "64px 1fr", gap: "base", alignItems: "center" },
        _(
          "s-box",
          {
            border: "base",
            borderRadius: "base",
            background: "base",
            padding: "none",
            inlineSize: "64px",
            blockSize: "64px",
            overflow: "hidden"
          },
          logoReady ? _("s-image", {
            src: logoUrl,
            alt: `${brand} logo`,
            inlineSize: "fill",
            aspectRatio: "1/1",
            objectFit: "contain"
          }) : _(
            "s-box",
            { padding: "small", inlineSize: "fill", blockSize: "fill" },
            _("s-text", { type: "strong" }, (brand || "?").slice(0, 1).toUpperCase())
          )
        ),
        _(
          "s-stack",
          { gap: "none" },
          _("s-heading", null, brand),
          _("s-text", { color: "subdued" }, offer)
        )
      ),
      _("s-text", { color: "subdued" }, description),
      cardState !== "initial" && cardState !== "revealing" ? _(
        "s-stack",
        { gap: "small" },
        _("s-text", { color: "subdued" }, "Your discount code"),
        _(
          "s-box",
          { padding: "small", border: "base", borderRadius: "base", background: "subdued" },
          _(
            "s-stack",
            { gap: "none", alignItems: "center" },
            _("s-text", null, discountCode)
          )
        ),
        cardState === "revealed" ? _(
          "s-stack",
          { gap: "small" },
          _("a", { href: redirectUrl, style: "display:block;width:100%;padding:12px 0;background:#2c6ecb;color:#fff;text-align:center;border-radius:4px;font-weight:600;text-decoration:none;box-sizing:border-box;font-size:14px;" }, "Shop now"),
          _("s-text", { color: "subdued" }, "Code applied automatically at checkout")
        ) : null
      ) : null,
      cardState === "revealing" ? _("s-box", { padding: "small" }, _("s-text", { color: "subdued" }, "Generating your discount code...")) : null,
      cardState === "error" ? _("s-box", { padding: "small" }, _("s-text", { tone: "warning" }, `Error: ${errorMessage || "Failed to load code"}`)) : null,
      cardState === "initial" || cardState === "error" ? _(
        "s-button",
        {
          kind: cardState === "initial" ? "primary" : "secondary",
          onClick: handleFirstCtaClick,
          inlineSize: "fill"
        },
        cardState === "initial" ? "Unlock offer" : "Try again"
      ) : null
    );
  }
  function App() {
    const orderApi = typeof shopify !== "undefined" ? shopify.order : null;
    const shopApi = typeof shopify !== "undefined" ? shopify.shop : null;
    const orderId = T2(() => {
      const order = readSignal(orderApi);
      return order?.id ? String(readSignal(order.id)) : null;
    }, [orderApi]);
    const fromShopDomain = T2(() => {
      const resolved = resolveShopDomain(shopApi);
      const fallback = normalizeDomain(globalThis.location?.hostname || "");
      const domain = resolved || (fallback.includes(".myshopify.com") ? fallback : null);
      console.log("[thank-you-offers] fromShopDomain:", domain, "shopApi:", readSignal(shopApi), "location.hostname:", globalThis.location?.hostname || "");
      return domain;
    }, [shopApi]);
    const [offersState, setOffersState] = d2([]);
    const [sourceShopId, setSourceShopId] = d2(null);
    y2(() => {
      async function loadOffers() {
        const requestedShop = normalizeDomain(fromShopDomain || "");
        console.log("[thank-you-offers] loadOffers requestedShop:", requestedShop, "base:", APP_BASE_URL);
        if (!requestedShop) {
          setOffersState([]);
          setSourceShopId(null);
          return;
        }
        try {
          const res = await fetch(`${APP_BASE_URL}/api/offers?shop=${encodeURIComponent(requestedShop)}`);
          const data = await res.json();
          setOffersState(Array.isArray(data?.offers) ? data.offers : []);
          setSourceShopId(data?.sourceShopId || null);
        } catch (err) {
          console.warn("Failed to load offers", err);
          setOffersState([]);
          setSourceShopId(null);
        }
      }
      loadOffers();
    }, [fromShopDomain]);
    return _(
      "s-stack",
      { gap: "base" },
      _("s-text", { emphasis: true }, "Recommended for you"),
      offersState.length === 0 ? _("s-text", { appearance: "subdued" }, "No partner offers available yet") : null,
      _(
        "s-grid",
        { gap: "base", gridTemplateColumns: "1fr 1fr" },
        offersState.map(
          (offerItem) => _(OfferCard, {
            key: offerItem.offerId,
            offerId: offerItem.offerId,
            brand: offerItem.brand,
            description: offerItem.description,
            offer: offerItem.offer,
            logoUrl: offerItem.logoUrl,
            orderId,
            fromShopDomain,
            fromShopId: sourceShopId,
            toShopDomain: offerItem.toShopDomain,
            toShopId: offerItem.toShopId
          })
        )
      )
    );
  }
  function renderThankYouOffers() {
    J(_(App), document.body);
  }
})();
