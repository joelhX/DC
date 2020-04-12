/*!
 * froala_editor v2.8.1 (https://www.froala.com/wysiwyg-editor)
 * License https://froala.com/wysiwyg-editor/terms/
 * Copyright 2014-2018 Froala Labs
 */

function (i) {
    "function" == typeof define && define.amd ? define(["jquery"], i) : "object" == typeof module && module.exports ? module.exports = function (e, t) { return t === undefined && (t = "undefined" != typeof window ? require("jquery") : require("jquery")(e)), i(t) } : i(window.jQuery)
} (function (C) {
    C.extend(C.FE.POPUP_TEMPLATES, { "file.insert": "[_BUTTONS_][_UPLOAD_LAYER_][_PROGRESS_BAR_]" }), C.extend(C.FE.DEFAULTS, { fileUpload: !0, fileUploadURL: "http121s://i.froala.com/upload", fileUploadParam: "file", fileUploadParams: {}, fileUploadToS3: !1, fileUploadMethod: "POST", fileMaxSize: 10485760, fileAllowedTypes: ["*"], fileInsertButtons: ["fileBack", "|"], fileUseSelectedText: !1 }), C.FE.PLUGINS.file = function (l) { var r, f = 2, p = 3, d = 4, s = 5, u = 6, i = {}; function c() { var e = l.popups.get("file.insert"); e || (e = S()), e.find(".fr-layer.fr-active").removeClass("fr-active").addClass("fr-pactive"), e.find(".fr-file-progress-bar-layer").addClass("fr-active"), e.find(".fr-buttons").hide(), n(l.language.translate("Uploading"), 0) } function o(e) { var t = l.popups.get("file.insert"); t && (t.find(".fr-layer.fr-pactive").addClass("fr-active").removeClass("fr-pactive"), t.find(".fr-file-progress-bar-layer").removeClass("fr-active"), t.find(".fr-buttons").show(), e && (l.events.focus(), l.popups.hide("file.insert"))) } function n(e, t) { var i = l.popups.get("file.insert"); if (i) { var r = i.find(".fr-file-progress-bar-layer"); r.find("h3").text(e + (t ? " " + t + "%" : "")), r.removeClass("fr-error"), t ? (r.find("div").removeClass("fr-indeterminate"), r.find("div > span").css("width", t + "%")) : r.find("div").addClass("fr-indeterminate") } } function v(e, t, i) { l.edit.on(), l.events.focus(!0), l.selection.restore(), l.opts.fileUseSelectedText && l.selection.text().length && (t = l.selection.text()), l.html.insert('<a href="' + e + '" target="_blank" id="fr-inserted-file" class="fr-file">' + t + "</a>"); var r = l.$el.find("#fr-inserted-file"); r.removeAttr("id"), l.popups.hide("file.insert"), l.undo.saveStep(), E(), l.events.trigger("file.inserted", [r, i]) } function g(e) { var t = this.status, i = this.response, r = this.responseXML, o = this.responseText; try { if (l.opts.fileUploadToS3) if (201 == t) { var n = function (e) { try { var t = C(e).find("Location").text(), i = C(e).find("Key").text(); return !1 === l.events.trigger("file.uploadedToS3", [t, i, e], !0) ? (l.edit.on(), !1) : t } catch (r) { return b(d, e), !1 } }(r); n && v(n, e, i || r) } else b(d, i || r); else if (200 <= t && t < 300) { var a = function (e) { try { if (!1 === l.events.trigger("file.uploaded", [e], !0)) return l.edit.on(), !1; var t = JSON.parse(e); return t.link ? t : (b(f, e), !1) } catch (i) { return b(d, e), !1 } }(o); a && v(a.link, e, i || o) } else b(p, i || o) } catch (s) { b(d, i || o) } } function h() { b(d, this.response || this.responseText || this.responseXML) } function m(e) { if (e.lengthComputable) { var t = e.loaded / e.total * 100 | 0; n(l.language.translate("Uploading"), t) } } function b(e, t) { l.edit.on(), function (e) { c(); var t = l.popups.get("file.insert").find(".fr-file-progress-bar-layer"); t.addClass("fr-error"); var i = t.find("h3"); i.text(e), l.events.disableBlur(), i.focus() }(l.language.translate("Something went wrong. Please try again.")), l.events.trigger("file.error", [{ code: e, message: i[e] }, t]) } function y() { l.edit.on(), o(!0) } function a(e) { if (void 0 !== e && 0 < e.length) { if (!1 === l.events.trigger("file.beforeUpload", [e])) return !1; var t, i = e[0]; if (i.size > l.opts.fileMaxSize) return b(s), !1; if (l.opts.fileAllowedTypes.indexOf("*") < 0 && l.opts.fileAllowedTypes.indexOf(i.type.replace(/file\//g, "")) < 0) return b(u), !1; if (l.drag_support.formdata && (t = l.drag_support.formdata ? new FormData : null), t) { var r; if (!1 !== l.opts.fileUploadToS3) for (r in t.append("key", l.opts.fileUploadToS3.keyStart + (new Date).getTime() + "-" + (i.name || "untitled")), t.append("success_action_status", "201"), t.append("X-Requested-With", "xhr"), t.append("Content-Type", i.type), l.opts.fileUploadToS3.params) l.opts.fileUploadToS3.params.hasOwnProperty(r) && t.append(r, l.opts.fileUploadToS3.params[r]); for (r in l.opts.fileUploadParams) l.opts.fileUploadParams.hasOwnProperty(r) && t.append(r, l.opts.fileUploadParams[r]); t.append(l.opts.fileUploadParam, i); var o = l.opts.fileUploadURL; l.opts.fileUploadToS3 && (o = l.opts.fileUploadToS3.uploadURL ? l.opts.fileUploadToS3.uploadURL : "https://" + l.opts.fileUploadToS3.region + ".amazonaws.com/" + l.opts.fileUploadToS3.bucket); var n = l.core.getXHR(o, l.opts.fileUploadMethod); n.onload = function () { g.call(n, i.name) }, n.onerror = h, n.upload.onprogress = m, n.onabort = y, c(); var a = l.popups.get("file.insert"); a && a.off("abortUpload").on("abortUpload", function () { 4 != n.readyState && n.abort() }), n.send(t) } } } function U() { o() } function S(e) { if (e) return l.popups.onHide("file.insert", U), !0; var t; l.opts.fileUpload || l.opts.fileInsertButtons.splice(l.opts.fileInsertButtons.indexOf("fileUpload"), 1), t = '<div class="fr-buttons">' + l.button.buildList(l.opts.fileInsertButtons) + "</div>"; var i = ""; l.opts.fileUpload && (i = '<div class="fr-file-upload-layer fr-layer fr-active" id="fr-file-upload-layer-' + l.id + '"><strong>' + l.language.translate("Drop file") + "</strong><br>(" + l.language.translate("or click") + ')<div class="fr-form"><input type="file" name="' + l.opts.fileUploadParam + '" accept="/*" tabIndex="-1" aria-labelledby="fr-file-upload-layer-' + l.id + '" role="button"></div></div>'); var r, o = { buttons: t, upload_layer: i, progress_bar: '<div class="fr-file-progress-bar-layer fr-layer"><h3 tabIndex="-1" class="fr-message">Uploading</h3><div class="fr-loader"><span class="fr-progress"></span></div><div class="fr-action-buttons"><button type="button" class="fr-command fr-dismiss" data-cmd="fileDismissError" tabIndex="2" role="button">OK</button></div></div>' }, n = l.popups.create("file.insert", o); return r = n, l.events.$on(r, "dragover dragenter", ".fr-file-upload-layer", function () { return C(this).addClass("fr-drop"), !1 }, !0), l.events.$on(r, "dragleave dragend", ".fr-file-upload-layer", function () { return C(this).removeClass("fr-drop"), !1 }, !0), l.events.$on(r, "drop", ".fr-file-upload-layer", function (e) { e.preventDefault(), e.stopPropagation(), C(this).removeClass("fr-drop"); var t = e.originalEvent.dataTransfer; t && t.files && (r.data("instance") || l).file.upload(t.files) }, !0), l.helpers.isIOS() && l.events.$on(r, "touchstart", '.fr-file-upload-layer input[type="file"]', function () { C(this).trigger("click") }), l.events.$on(r, "change", '.fr-file-upload-layer input[type="file"]', function () { this.files && (r.data("instance") || l).file.upload(this.files), C(this).val("") }, !0), n } function e(e) { l.node.hasClass(e, "fr-file") } function t(e) { var t = e.originalEvent.dataTransfer; if (t && t.files && t.files.length) { var i = t.files[0]; if (i && "undefined" != typeof i.type) { if (i.type.indexOf("image") < 0) { if (!l.opts.fileUpload) return e.preventDefault(), e.stopPropagation(), !1; l.markers.remove(), l.markers.insertAtPoint(e.originalEvent), l.$el.find(".fr-marker").replaceWith(C.FE.MARKERS), l.popups.hideAll(); var r = l.popups.get("file.insert"); return r || (r = S()), l.popups.setContainer("file.insert", l.$sc), l.popups.show("file.insert", e.originalEvent.pageX, e.originalEvent.pageY), c(), a(t.files), e.preventDefault(), e.stopPropagation(), !1 } } else i.type.indexOf("image") < 0 && (e.preventDefault(), e.stopPropagation()) } } function E() { var e, t = Array.prototype.slice.call(l.el.querySelectorAll("a.fr-file")), i = []; for (e = 0; e < t.length; e++)i.push(t[e].getAttribute("href")); if (r) for (e = 0; e < r.length; e++)i.indexOf(r[e].getAttribute("href")) < 0 && l.events.trigger("file.unlink", [r[e]]); r = t } return i[1] = "File cannot be loaded from the passed link.", i[f] = "No link in upload response.", i[p] = "Error during file upload.", i[d] = "Parsing response failed.", i[s] = "File is too large.", i[u] = "File file type is invalid.", i[7] = "Files can be uploaded only to same domain in IE 8 and IE 9.", { _init: function () { l.events.on("drop", t), l.events.$on(l.$win, "keydown", function (e) { var t = e.which, i = l.popups.get("file.insert"); i && t == C.FE.KEYCODE.ESC && i.trigger("abortUpload") }), l.events.on("destroy", function () { var e = l.popups.get("file.insert"); e && e.trigger("abortUpload") }), l.events.on("link.beforeRemove", e), l.$wp && (E(), l.events.on("contentChanged", E)), S(!0) }, showInsertPopup: function () { var e = l.$tb.find('.fr-command[data-cmd="insertFile"]'), t = l.popups.get("file.insert"); if (t || (t = S()), o(), !t.hasClass("fr-active")) if (l.popups.refresh("file.insert"), l.popups.setContainer("file.insert", l.$tb), e.is(":visible")) { var i = e.offset().left + e.outerWidth() / 2, r = e.offset().top + (l.opts.toolbarBottom ? 10 : e.outerHeight() - 10); l.popups.show("file.insert", i, r, e.outerHeight()) } else l.position.forSelection(t), l.popups.show("file.insert") }, upload: a, insert: v, back: function () { l.events.disableBlur(), l.selection.restore(), l.events.enableBlur(), l.popups.hide("file.insert"), l.toolbar.showInline() }, hideProgressBar: o } }, C.FE.DefineIcon("insertFile", { NAME: "file-o", FA5NAME: "file" }), C.FE.RegisterCommand("insertFile", { title: "Upload File", undo: !1, focus: !0, refreshAfterCallback: !1, popup: !0, callback: function () { this.popups.isVisible("file.insert") ? (this.$el.find(".fr-marker").length && (this.events.disableBlur(), this.selection.restore()), this.popups.hide("file.insert")) : this.file.showInsertPopup() }, plugin: "file" }), C.FE.DefineIcon("fileBack", { NAME: "arrow-left" }), C.FE.RegisterCommand("fileBack", { title: "Back", undo: !1, focus: !1, back: !0, refreshAfterCallback: !1, callback: function () { this.file.back() }, refresh: function (e) { this.opts.toolbarInline ? (e.removeClass("fr-hidden"), e.next(".fr-separator").removeClass("fr-hidden")) : (e.addClass("fr-hidden"), e.next(".fr-separator").addClass("fr-hidden")) } }), C.FE.RegisterCommand("fileDismissError", { title: "OK", callback: function () { this.file.hideProgressBar(!0) } })
});