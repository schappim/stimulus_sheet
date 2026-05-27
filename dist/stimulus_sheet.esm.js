var P = Object.defineProperty;
var R = (e, t, s) => t in e ? P(e, t, { enumerable: !0, configurable: !0, writable: !0, value: s }) : e[t] = s;
var c = (e, t, s) => R(e, typeof t != "symbol" ? t + "" : t, s);
import { Controller as b, Application as q } from "@hotwired/stimulus";
const u = /* @__PURE__ */ new Map();
function j(e, t) {
  e && u.set(e, t);
}
function z(e, t) {
  e && u.get(e) === t && u.delete(e);
}
function o(e) {
  return e && u.get(e) || null;
}
function S() {
  return Array.from(u.keys());
}
const A = "data-ss-portal-slot";
function G(e, t) {
  if (!e || !t || typeof document > "u" || !document.body || (e.setAttribute(A, t), e.parentElement === document.body)) return;
  const s = document.body.querySelector(
    `:scope > [${A}="${K(t)}"]`
  );
  s && s !== e && s.remove(), document.body.appendChild(e);
}
function K(e) {
  return typeof CSS < "u" && typeof CSS.escape == "function" ? CSS.escape(e) : String(e).replace(/[^a-zA-Z0-9_-]/g, (t) => `\\${t}`);
}
const Z = 6, Y = 0.4, B = 0.55, J = 40;
function Q(e) {
  let t = !1, s = !1, i = null, l = 0, d = 0, k = 0, T = 0, f = !1, E = !1;
  function h() {
    t = !1, s = !1, i = null, f = !1, E = !1;
  }
  function L(n) {
    const a = window.getComputedStyle(n).transform;
    if (!a || a === "none") return 0;
    try {
      return new DOMMatrix(a).m42;
    } catch {
      const r = a.match(/matrix\(\s*[^,]+,\s*[^,]+,\s*[^,]+,\s*[^,]+,\s*[^,]+,\s*([-\d.]+)\)/);
      return r ? Number(r[1]) : 0;
    }
  }
  function x(n) {
    if (e.getState() === "closed" || !e.sheetEl || !e.sheetEl.contains(n.target) || n.button != null && n.button !== 0) return;
    const a = e.handleEl && e.handleEl.contains(n.target);
    if (e.getState() === "full" && !a) {
      if (!e.scrollEl || e.scrollEl.scrollTop > 0) return;
      f = !0;
    } else
      f = !1;
    t = !0, s = !1, i = n.pointerId, l = n.clientY, k = Date.now(), d = L(e.sheetEl), T = window.innerHeight;
  }
  function O(n) {
    if (!t || i != null && n.pointerId !== i) return;
    const a = n.clientY - l;
    if (!s && Math.abs(a) < Z) return;
    if (f && !E) {
      if (a < -5) {
        h();
        return;
      }
      if (a > 8) E = !0;
      else return;
    }
    if (!s) {
      s = !0, e.sheetEl.style.transition = "none";
      try {
        e.sheetEl.setPointerCapture(i);
      } catch {
      }
    }
    let r = d + a;
    if (r < 0 && (r = 0), e.sheetEl.style.transform = `translateY(${r}px)`, e.backdropEl) {
      const p = T * 0.9, m = p - r, g = Math.max(0, Math.min(1, m / p));
      e.backdropEl.style.background = `rgba(0,0,0,${g * 0.35})`;
    }
    n.cancelable && n.preventDefault();
  }
  function H(n) {
    if (!t || i != null && n.pointerId !== i) return;
    try {
      e.sheetEl.releasePointerCapture?.(n.pointerId);
    } catch {
    }
    if (!s) {
      h();
      return;
    }
    const a = n.clientY - l, r = T * 0.9, p = Date.now() - (k || Date.now()), m = a / Math.max(p, 1), g = L(e.sheetEl), C = r * B;
    if (m < -Y)
      e.onSnap("full");
    else if (m > Y)
      e.onSnap(d < C * 0.5 ? "half" : "closed");
    else {
      const N = r * 0.5;
      g > N ? e.onSnap("closed") : g > C * 0.5 ? e.onSnap("half") : e.onSnap("full");
    }
    e.backdropEl && (e.backdropEl.style.background = ""), h();
  }
  function I(n) {
    t && (i != null && n.pointerId !== i || (e.backdropEl && (e.backdropEl.style.background = ""), h()));
  }
  function M() {
    e.sheetEl && (e.sheetEl.addEventListener("pointerdown", x, { passive: !0 }), e.sheetEl.addEventListener("pointermove", O, { passive: !1 }), e.sheetEl.addEventListener("pointerup", H, { passive: !0 }), e.sheetEl.addEventListener("pointercancel", I, { passive: !0 }));
  }
  function $() {
    e.sheetEl && (e.sheetEl.removeEventListener("pointerdown", x), e.sheetEl.removeEventListener("pointermove", O), e.sheetEl.removeEventListener("pointerup", H), e.sheetEl.removeEventListener("pointercancel", I), h());
  }
  return { attach: M, detach: $, reset: h, HALF_OFFSET: B, CLOSE_OVERSHOOT: J };
}
const V = "ss-sheet-open";
function U() {
  typeof document > "u" || !document.body || document.body.classList.add(V);
}
function D({ anyStillOpen: e } = {}) {
  typeof document > "u" || !document.body || e || document.body.classList.remove(V);
}
function W(e) {
  if (typeof requestAnimationFrame == "function") {
    const s = requestAnimationFrame(e);
    return () => cancelAnimationFrame(s);
  }
  const t = setTimeout(e, 16);
  return () => clearTimeout(t);
}
const X = 380, _ = "transform .35s cubic-bezier(.32,.72,0,1)";
class y extends b {
  initialize() {
    this._state = "closed", this._hideTimer = null, this._cancelOpenFrame = null, this._drag = null;
  }
  connect() {
    this.element.classList.add("ss-sheet-wrapper"), this.hasSheetTarget && (this.sheetTarget.classList.add("ss-sheet"), this._parkClosed(!1)), this.hasBackdropTarget && this.backdropTarget.classList.add("ss-sheet-backdrop"), this.hasHandleTarget && this.handleTarget.classList.add("ss-sheet-handle"), this.hasScrollTarget && this.scrollTarget.classList.add("ss-sheet-scroll"), this.portalValue && G(this.element, this._slot()), j(this._sheetId(), this), this.element.sheetApi = this._buildApi(), this.hasSheetTarget && (this._drag = Q({
      element: this.element,
      sheetEl: this.sheetTarget,
      handleEl: this.hasHandleTarget ? this.handleTarget : null,
      scrollEl: this.hasScrollTarget ? this.scrollTarget : null,
      backdropEl: this.hasBackdropTarget ? this.backdropTarget : null,
      getState: () => this._state,
      onSnap: (t) => this._snap(t)
    }), this._drag.attach()), this._dispatch("connected"), this.openOnConnectValue && (this._cancelOpenFrame = W(() => {
      this._cancelOpenFrame = null, this.open({ expanded: this.initialExpandedValue });
    }));
  }
  disconnect() {
    this._hideTimer && (clearTimeout(this._hideTimer), this._hideTimer = null), this._cancelOpenFrame && (this._cancelOpenFrame(), this._cancelOpenFrame = null), this._drag?.detach?.(), this._drag = null, z(this._sheetId(), this), this._state !== "closed" && D({ anyStillOpen: F(this) }), delete this.element.sheetApi, this._dispatch("disconnected");
  }
  /* ---------------- Stimulus actions ---------------- */
  open(t) {
    const s = ee(t, "expanded", this.initialExpandedValue);
    this._openInternal({ expanded: s });
  }
  close() {
    this._state !== "closed" && this._closeInternal();
  }
  expand() {
    this._state !== "closed" && this._snap("full");
  }
  half() {
    this._state !== "closed" && this._snap("half");
  }
  toggle(t) {
    this._state === "closed" ? this.open(t) : this.close();
  }
  /* ---------------- internal state machine ---------------- */
  _openInternal({ expanded: t }) {
    if (!this.hasSheetTarget) return;
    this._hideTimer && (clearTimeout(this._hideTimer), this._hideTimer = null);
    const s = this.sheetTarget, i = s.offsetHeight || window.innerHeight * 0.9;
    s.style.transition = "none", s.style.transform = `translateY(${i + 40}px)`, s.style.visibility = "visible", this.hasBackdropTarget && (this.backdropTarget.style.visibility = "visible"), s.offsetHeight, s.style.transition = _, t ? (s.style.transform = "translateY(0px)", s.classList.remove("ss-sheet-half"), s.classList.add("ss-sheet-full"), this._state = "full") : (s.style.transform = `translateY(${i * (this.halfOffsetValue / 100)}px)`, s.classList.remove("ss-sheet-full"), s.classList.add("ss-sheet-half"), this._state = "half"), this.hasBackdropTarget && this.backdropTarget.classList.add("ss-sheet-backdrop-visible"), U(), this._dispatch("opened", { state: this._state });
  }
  _closeInternal() {
    if (!this.hasSheetTarget) return;
    const t = this.sheetTarget, s = t.offsetHeight || window.innerHeight * 0.9;
    t.style.transition = _, t.style.transform = `translateY(${s + 40}px)`, this.hasBackdropTarget && this.backdropTarget.classList.remove("ss-sheet-backdrop-visible"), this._state = "closed", this._hideTimer && clearTimeout(this._hideTimer), this._hideTimer = setTimeout(() => {
      t.style.visibility = "hidden", this.hasBackdropTarget && (this.backdropTarget.style.visibility = "hidden"), this._hideTimer = null;
    }, X), D({ anyStillOpen: F(this) }), this._drag?.reset?.(), this._dispatch("closed");
  }
  _snap(t) {
    if (!this.hasSheetTarget) return;
    if (t === "closed") return this._closeInternal();
    const s = this.sheetTarget;
    if (s.style.transition = _, t === "full")
      s.style.transform = "translateY(0px)", s.classList.add("ss-sheet-full"), s.classList.remove("ss-sheet-half"), this._state = "full";
    else {
      const i = s.offsetHeight || window.innerHeight * 0.9;
      s.style.transform = `translateY(${i * (this.halfOffsetValue / 100)}px)`, s.classList.add("ss-sheet-half"), s.classList.remove("ss-sheet-full"), this._state = "half";
    }
    this._drag?.reset?.(), this._dispatch("snap", { state: this._state });
  }
  _parkClosed(t) {
    const s = this.sheetTarget;
    s.style.transition = t ? _ : "none", s.style.transform = "translateY(120vh)", s.style.visibility = "hidden", this.hasBackdropTarget && (this.backdropTarget.style.visibility = "hidden");
  }
  /* ---------------- helpers ---------------- */
  _sheetId() {
    return this.idValue || this.element.id || "";
  }
  _slot() {
    return this._sheetId() || `ss-anon-${this.element.dataset.ssSlotSeq || (this.element.dataset.ssSlotSeq = Math.random().toString(36).slice(2, 9))}`;
  }
  _dispatch(t, s = {}) {
    this.element.dispatchEvent(new CustomEvent(`sheet:${t}`, {
      bubbles: !0,
      detail: { id: this._sheetId(), sheet: this, ...s }
    }));
  }
  _buildApi() {
    return {
      open: (t) => this.open(t),
      close: () => this.close(),
      expand: () => this.expand(),
      half: () => this.half(),
      toggle: (t) => this.toggle(t),
      state: () => this._state,
      isOpen: () => this._state !== "closed",
      element: this.element,
      sheetElement: this.hasSheetTarget ? this.sheetTarget : null
    };
  }
}
c(y, "targets", ["sheet", "backdrop", "handle", "scroll"]), c(y, "values", {
  id: { type: String, default: "" },
  portal: { type: Boolean, default: !1 },
  halfOffset: { type: Number, default: 55 },
  // percent of sheet height
  openOnConnect: { type: Boolean, default: !1 },
  initialExpanded: { type: Boolean, default: !1 },
  dismissable: { type: Boolean, default: !0 }
  // false → backdrop click doesn't close
});
function F(e) {
  for (const t of S()) {
    const s = o(t);
    if (!(!s || s === e) && s._state && s._state !== "closed")
      return !0;
  }
  return !1;
}
function ee(e, t, s) {
  if (!e) return s;
  if (typeof Event < "u" && e instanceof Event) {
    const i = e.params || {};
    return Object.prototype.hasOwnProperty.call(i, t) ? i[t] === !0 || i[t] === "true" : s;
  }
  return typeof e == "object" && Object.prototype.hasOwnProperty.call(e, t) ? !!e[t] : s;
}
class w extends b {
  open(t) {
    this._invoke("open", t);
  }
  close(t) {
    this._invoke("close", t);
  }
  toggle(t) {
    this._invoke("toggle", t);
  }
  _invoke(t, s) {
    const i = this.idValue || this.element.dataset.sheetId || "", l = o(i);
    if (!l) {
      console.warn(`[stimulus_sheet] trigger could not find sheet id="${i}". Mounted ids:`, S());
      return;
    }
    const d = { expanded: this.expandedValue };
    t === "open" ? l.open(d) : t === "close" ? l.close() : l.toggle(d), s && typeof s.preventDefault == "function" && this.element.tagName === "A" && s.preventDefault();
  }
}
c(w, "values", {
  id: { type: String, default: "" },
  expanded: { type: Boolean, default: !1 }
});
class v extends b {
  show(t) {
    if (this._isNative()) {
      this._send("show", {
        id: this.idValue,
        sections: this.sectionsValue
      }), t && typeof t.preventDefault == "function" && t.preventDefault();
      return;
    }
    const s = o(this.idValue);
    s && s.open({ expanded: this.expandedValue });
  }
  _isNative() {
    return typeof document > "u" ? !1 : document.documentElement.dataset.hotwireNative === "true" ? !0 : typeof window > "u" ? !1 : !!(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers["hotwire-native"]);
  }
  _send(t, s) {
    document.dispatchEvent(new CustomEvent("hotwire-native:bridge", {
      detail: { component: "sheet", name: t, payload: s }
    }));
  }
}
c(v, "values", {
  id: { type: String, default: "" },
  sections: { type: Array, default: [] },
  expanded: { type: Boolean, default: !1 }
});
function te(e) {
  const t = e ?? q.start();
  return t.register("sheet", y), t.register("sheet-trigger", w), t.register("bridge-sheet", v), t;
}
function se(e, t) {
  o(e)?.open(t);
}
function ie(e) {
  o(e)?.close();
}
function ne(e, t) {
  o(e)?.toggle(t);
}
function ae(e) {
  const t = o(e);
  return !!(t && t._state && t._state !== "closed");
}
const re = {
  start: te,
  open: se,
  close: ie,
  toggle: ne,
  isOpen: ae,
  getSheet: o,
  listSheetIds: S,
  SheetController: y,
  SheetTriggerController: w,
  BridgeSheetController: v
};
typeof window < "u" && !window.__stimulusSheetStarted && (window.__stimulusSheetStarted = !0, window.StimulusSheet = re);
export {
  v as BridgeSheetController,
  y as SheetController,
  w as SheetTriggerController,
  ie as close,
  re as default,
  o as getSheet,
  ae as isOpen,
  S as listSheetIds,
  se as open,
  te as start,
  ne as toggle
};
//# sourceMappingURL=stimulus_sheet.esm.js.map
