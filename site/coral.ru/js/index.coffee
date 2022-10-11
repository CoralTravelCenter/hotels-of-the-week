window.ASAP ||= (->
    fns = []
    callall = () ->
        f() while f = fns.shift()
    if document.addEventListener
        document.addEventListener 'DOMContentLoaded', callall, false
        window.addEventListener 'load', callall, false
    else if document.attachEvent
        document.attachEvent 'onreadystatechange', callall
        window.attachEvent 'onload', callall
    (fn) ->
        fns.push fn
        callall() if document.readyState is 'complete'
)()

window.log ||= () ->
    if window.console and window.DEBUG
        console.group? window.DEBUG
        if arguments.length == 1 and Array.isArray(arguments[0]) and console.table
            console.table.apply window, arguments
        else
            console.log.apply window, arguments
        console.groupEnd?()
window.trouble ||= () ->
    if window.console
        console.group? window.DEBUG if window.DEBUG
        console.warn?.apply window, arguments
        console.groupEnd?() if window.DEBUG

window.preload ||= (what, fn) ->
    what = [what] unless  Array.isArray(what)
    $.when.apply($, ($.ajax(lib, dataType: 'script', cache: true) for lib in what)).done -> fn?()

window.queryParam ||= queryParam = (p, nocase) ->
    params_kv = location.search.substr(1).split('&')
    params = {}
    params_kv.forEach (kv) -> k_v = kv.split('='); params[k_v[0]] = k_v[1] or ''
    if p
        if nocase
            return decodeURIComponent(params[k]) for k of params when k.toUpperCase() == p.toUpperCase()
            return undefined
        else
            return decodeURIComponent params[p]
    params

String::zeroPad = (len, c) ->
    s = ''
    c ||= '0'
    len ||= 2
    len -= @length
    s += c while s.length < len
    s + @
Number::zeroPad = (len, c) -> String(@).zeroPad len, c

window.DEBUG = 'APP NAME'

class AutoPlayer
    constructor: ($indicator, timeout, finished) ->
        @$el = $indicator
        @timeout = timeout
        @finished = finished
        @start()
    start: () ->
        @started = new Date().getTime()
        @tick()
    stop: () ->
        cancelAnimationFrame @raf
        @reset()
    progress: (fraction) ->
        fraction = 1 if fraction > 1
        fraction = 0 if fraction < 0
        @$el.find('.filler').css 'width', "#{ 100 - Math.round(fraction * 100) }%"
    reset: () ->
        setTimeout =>
            @$el.find('.filler').css 'width', ''
        , 500
    tick: () ->
        fraction = (new Date().getTime() - @started) / @timeout
        @progress fraction
        if fraction < 1
            @raf = requestAnimationFrame => @tick()
        else
            @finished()

ASAP ->
    $flickityReady = $.Deferred()
    unless $.fn.flickity
        preload 'https://cdnjs.cloudflare.com/ajax/libs/flickity/2.3.0/flickity.pkgd.min.js', -> $flickityReady.resolve()
    else
        $flickityReady.resolve()

    $.when($flickityReady).done ->
        autoplayer = null
        no_interaction_timer = null
        $dots = $('.progress-dash').on 'click', (e) ->
            autoplayer?.stop()
            $slider.removeAttr 'data-autoplay'
            $slider.flickity 'select', $(this).index()
        $slider = $('#hotels-of-the-week .hotels-slider').flickity
            cellSelector: '.hotel-slide'
            cellAlign: 'center'
            wrapAround: yes
            prevNextButtons: no
            pageDots: no
            on:
                dragStart: () ->
                    autoplayer?.stop()
                    this.$element.removeAttr 'data-autoplay'
                staticClick: () ->
                    autoplayer?.stop()
                    this.$element.removeAttr 'data-autoplay'
                select: (idx) ->
                    autoplay = this.$element.attr 'data-autoplay'
                    $dot = $dots.eq(idx)
                    if autoplay
                        me = this
                        autoplayer?.stop()
                        autoplayer = new AutoPlayer $dot, Number(autoplay), -> me.next()
                    $dot.addClass('is-selected').siblings('.is-selected').removeClass('is-selected')
        $slider.closest('.widgetcontainer').css overflow: 'hidden'
        setTimeout ->
            $slider.flickity 'resize'
        , 0

