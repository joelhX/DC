/*!
 * froala_editor v2.8.1 (https://www.froala.com/wysiwyg-editor)
 * License https://froala.com/wysiwyg-editor/terms/
 * Copyright 2014-2018 Froala Labs
 */

! function (t) {
  'function' == typeof define && define.amd ? define(['jquery'], t) : 'object' == typeof module && module.exports ? module.exports = function (e, a) {
    return a === undefined && (a = 'undefined' != typeof window ? require('jquery') : require('jquery')(e)), t(a)
  } : t(window.jQuery)
}(function (O) {
  if (O.extend(O.FE.DEFAULTS, {
      imageManagerLoadURL: 'https://i.froala.com/load-files',
      imageManagerLoadMethod: 'get',
      imageManagerLoadParams: {},
      imageManagerPreloader: null,
      imageManagerDeleteURL: '',
      imageManagerDeleteMethod: 'post',
      imageManagerDeleteParams: {},
      imageManagerPageSize: 12,
      imageManagerScrollOffset: 20,
      imageManagerToggleTags: !0
    }), O.FE.PLUGINS.imageManager = function (o) {
      var g, l, r, i, n, d, s, f, m, u, c, h = 'image_manager',
        e = 10,
        p = 11,
        v = 12,
        M = 13,
        w = 14,
        b = 15,
        C = 21,
        L = 22,
        t = {}

      function y () {
        var e = O(window).outerWidth()
        return e < 768 ? 2 : e < 1200 ? 3 : 4
      }

      function D () {
        n.empty()
        for (var e = 0; e < c; e++) n.append('<div class="fr-list-column"></div>')
      }

      function I () {
        if (m < s.length && (n.outerHeight() <= r.outerHeight() + o.opts.imageManagerScrollOffset || r.scrollTop() + o.opts.imageManagerScrollOffset > n.outerHeight() - r.outerHeight())) {
          f++
          for (var e = o.opts.imageManagerPageSize * (f - 1); e < Math.min(s.length, o.opts.imageManagerPageSize * f); e++) a(s[e])
        }
      }

      function a (i) {
        var n = new Image,
          s = O('<div class="fr-image-container fr-empty fr-image-' + u++ + '" data-loading="' + o.language.translate('Loading') + '.." data-deleting="' + o.language.translate('Deleting') + '..">')
        T(!1), n.onload = function () {
          s.height(Math.floor(s.width() / n.width * n.height))
          var t = O('<img/>')
          if (i.thumb) t.attr('src', i.thumb)
          else {
            if (U(w, i), !i.url) return U(b, i), !1
            t.attr('src', i.url)
          }
          if (i.url && t.attr('data-url', i.url), i.tag)
            if (l.find('.fr-modal-more.fr-not-available').removeClass('fr-not-available'), l.find('.fr-modal-tags').show(), 0 <= i.tag.indexOf(',')) {
              for (var e = i.tag.split(','), a = 0; a < e.length; a++) e[a] = e[a].trim(), 0 === d.find('a[title="' + e[a] + '"]').length && d.append('<a role="button" title="' + e[a] + '">' + e[a] + '</a>')
              t.attr('data-tag', e.join())
            } else 0 === d.find('a[title="' + i.tag.trim() + '"]').length && d.append('<a role="button" title="' + i.tag.trim() + '">' + i.tag.trim() + '</a>'), t.attr('data-tag', i.tag.trim())
          for (var r in i.name && t.attr('alt', i.name), i) i.hasOwnProperty(r) && 'thumb' != r && 'url' != r && 'tag' != r && t.attr('data-' + r, i[r])
          s.append(t).append(O(o.icon.create('imageManagerDelete')).addClass('fr-delete-img').attr('title', o.language.translate('Delete'))).append(O(o.icon.create('imageManagerInsert')).addClass('fr-insert-img').attr('title', o.language.translate('Insert'))), d.find('.fr-selected-tag').each(function (e, a) {
            k(t, a.text) || s.hide()
          }), t.on('load', function () {
            s.removeClass('fr-empty'), s.height('auto'), m++, E(x(parseInt(t.parent().attr('class').match(/fr-image-(\d+)/)[1], 10) + 1)), T(!1), m % o.opts.imageManagerPageSize == 0 && I()
          }), o.events.trigger('imageManager.imageLoaded', [t])
        }, n.onerror = function () {
          m++, s.remove(), E(x(parseInt(s.attr('class').match(/fr-image-(\d+)/)[1], 10) + 1)), U(e, i), m % o.opts.imageManagerPageSize == 0 && I()
        }, n.src = i.thumb || i.url, P().append(s)
        console.log(s)
      }

      function P () {
        var r, i
        return n.find('.fr-list-column').each(function (e, a) {
            var t = O(a)
            0 === e ? (i = t.outerHeight(), r = t) : t.outerHeight() < i && (i = t.outerHeight(), r = t)
          }), r
      }

      function x (e) {
        e === undefined && (e = 0)
        for (var a = [], t = u - 1; e <= t; t--) {
          var r = n.find('.fr-image-' + t)
          r.length && (a.push(r), O('<div id="fr-image-hidden-container">').append(r), n.find('.fr-image-' + t).remove())
        }
        return a
      }

      function E (e) {
        for (var a = e.length - 1; 0 <= a; a--) P().append(e[a])
      }

      function T (e) {
        if (e === undefined && (e = !0), !g.is(':visible')) return !0
        var a = y()
        if (a != c) {
          c = a
          var t = x()
          D(), E(t)
        }
        o.modals.resize(h), e && I()
      }

      function q (e) {
        var a = {},
          t = e.data()
        for (var r in t) t.hasOwnProperty(r) && 'url' != r && 'tag' != r && (a[r] = t[r])
        return a
      }

      function S (e) {
        var a = O(e.currentTarget).siblings('img'),
          t = g.data('instance') || o,
          r = g.data('current-image')
        if (o.modals.hide(h), t.image.showProgressBar(), r) r.data('fr-old-src', r.attr('src')), r.trigger('click')
        else {
          t.events.focus(!0), t.selection.restore()
          var i = t.position.getBoundingRect(),
            n = i.left + i.width / 2 + O(o.doc).scrollLeft(),
            s = i.top + i.height + O(o.doc).scrollTop()
          t.popups.setContainer('image.insert', o.$sc), t.popups.show('image.insert', n, s)
        }
        t.image.insert(a.data('url'), !1, q(a), r)
      }

      function R (e) {
        var t = O(e.currentTarget).siblings('img'),
          a = o.language.translate('Are you sure? Image will be deleted.')
        confirm(a) && (o.opts.imageManagerDeleteURL ? !1 !== o.events.trigger('imageManager.beforeDeleteImage', [t]) && (t.parent().addClass('fr-image-deleting'), O.ajax({
          method: o.opts.imageManagerDeleteMethod,
          url: o.opts.imageManagerDeleteURL,
          data: O.extend(O.extend({
            src: t.attr('src')
          }, q(t)), o.opts.imageManagerDeleteParams),
          crossDomain: o.opts.requestWithCORS,
          xhrFields: {
            withCredentials: o.opts.requestWithCredentials
          },
          headers: o.opts.requestHeaders
        }).done(function (e) {
          o.events.trigger('imageManager.imageDeleted', [e])
          var a = x(parseInt(t.parent().attr('class').match(/fr-image-(\d+)/)[1], 10) + 1)
          t.parent().remove(), E(a), g.find('#fr-modal-tags > a').each(function () {
            0 === g.find('#fr-image-list [data-tag*="' + O(this).text() + '"]').length && O(this).removeClass('fr-selected-tag').hide()
          }), H(), T(!0)
        }).fail(function (e) {
          U(C, e.response || e.responseText)
        })) : U(L))
      }

      function U (e, a) {
        10 <= e && e < 20 ? i.hide() : 20 <= e && e < 30 && O('.fr-image-deleting').removeClass('fr-image-deleting'), o.events.trigger('imageManager.error', [{
          code: e,
          message: t[e]
        }, a])
      }

      function F () {
        var e = l.find('.fr-modal-head-line').outerHeight(),
          a = d.outerHeight()
        l.toggleClass('fr-show-tags'), l.hasClass('fr-show-tags') ? (l.css('height', e + a), d.find('a').css('opacity', 1)) : (l.css('height', e), d.find('a').css('opacity', 0))
      }

      function H () {
        var e = d.find('.fr-selected-tag')
        0 < e.length ? (n.find('img').parent().show(), e.each(function (e, r) {
          n.find('img').each(function (e, a) {
            var t = O(a)
            k(t, r.text) || t.parent().hide()
          })
        })) : n.find('img').parent().show(), E(x()), I()
      }

      function j (e) {
        e.preventDefault()
        var a = O(e.currentTarget)
        a.toggleClass('fr-selected-tag'), o.opts.imageManagerToggleTags && a.siblings('a').removeClass('fr-selected-tag'), H()
      }

      function k (e, a) {
        for (var t = (e.attr('data-tag') || '').split(','), r = 0; r < t.length; r++)
          if (t[r] == a) return !0
        return !1
      }
      return t[e] = 'Image cannot be loaded from the passed link.', t[p] = 'Error during load images request.', t[v] = 'Missing imageManagerLoadURL option.', t[M] = 'Parsing load response failed.', t[w] = 'Missing image thumb.', t[b] = 'Missing image URL.', t[C] = 'Error during delete image request.', t[L] = 'Missing imageManagerDeleteURL option.', {
          require: ['image'],
          _init: function () {
            if (!o.$wp && 'IMG' != o.el.tagName) return !1
          },
          show: function () {
            if (!g) {
              var e, a = '<div class="fr-modal-head-line"><i class="fa fa-bars fr-modal-more fr-not-available" id="fr-modal-more-' + o.sid + '" title="' + o.language.translate('Tags') + '"></i><h4 data-text="true">' + o.language.translate('Manage Images') + '</h4></div>'
              a += '<div class="fr-modal-tags" id="fr-modal-tags"></div>', e = o.opts.imageManagerPreloader ? '<img class="fr-preloader" id="fr-preloader" alt="' + o.language.translate('Loading') + '.." src="' + o.opts.imageManagerPreloader + '" style="display: none;">' : '<span class="fr-preloader" id="fr-preloader" style="display: none;">' + o.language.translate('Loading') + '</span>', e += '<div class="fr-image-list" id="fr-image-list"></div>'
              var t = o.modals.create(h, a, e)
              g = t.$modal, l = t.$head, r = t.$body
            }
            g.data('current-image', o.image.get()), o.modals.show(h), i || (i = g.find('#fr-preloader'), n = g.find('#fr-image-list'), d = g.find('#fr-modal-tags'), c = y(), D(), l.css('height', l.find('.fr-modal-head-line').outerHeight()), o.events.$on(O(o.o_win), 'resize', function () {
              T(!!s)
            }), o.helpers.isMobile() && (o.events.bindClick(n, 'div.fr-image-container', function (e) {
              g.find('.fr-mobile-selected').removeClass('fr-mobile-selected'), O(e.currentTarget).addClass('fr-mobile-selected')
            }), g.on(o._mousedown, function () {
              g.find('.fr-mobile-selected').removeClass('fr-mobile-selected')
            })), o.events.bindClick(n, '.fr-insert-img', S), o.events.bindClick(n, '.fr-delete-img', R), g.on(o._mousedown + ' ' + o._mouseup, function (e) {
              e.stopPropagation()
            }), g.on(o._mousedown, '*', function () {
              o.events.disableBlur()
            }), r.on('scroll', I), o.events.bindClick(g, 'i#fr-modal-more-' + o.sid, F), o.events.bindClick(d, 'a', j)), i.show(), n.find('.fr-list-column').empty(), o.opts.imageManagerLoadURL ? O.ajax({
              url: o.opts.imageManagerLoadURL,
              method: o.opts.imageManagerLoadMethod,
              data: o.opts.imageManagerLoadParams,
              dataType: 'json',
              crossDomain: o.opts.requestWithCORS,
              xhrFields: {
                withCredentials: o.opts.requestWithCredentials
              },
              headers: o.opts.requestHeaders
            }).done(function (e, a, t) {
              o.events.trigger('imageManager.imagesLoaded', [e]),
              function (e, a) {
                try {
                  n.find('.fr-list-column').empty(), u = m = f = 0, s = e, I()
                } catch (t) {
                  U(M, a)
                }
              }(e, t.response), i.hide()
            }).fail(function () {
              var e = this.xhr()
              U(p, e.response || e.responseText)
            }) : U(v)
          },
          hide: function () {
            o.modals.hide(h)
          }
      }
    }, !O.FE.PLUGINS.image) throw new Error('Image manager plugin requires image plugin.')
  O.FE.DEFAULTS.imageInsertButtons.push('imageManager'), O.FE.RegisterCommand('imageManager', {
    title: 'Browse',
    undo: !1,
    focus: !1,
    modal: !0,
    callback: function () {
      this.imageManager.show()
    },
    plugin: 'imageManager'
  }), O.FE.DefineIcon('imageManager', {
    NAME: 'folder'
  }), O.FE.DefineIcon('imageManagerInsert', {
    NAME: 'plus'
  }), O.FE.DefineIcon('imageManagerDelete', {
    NAME: 'trash'
  })
})
