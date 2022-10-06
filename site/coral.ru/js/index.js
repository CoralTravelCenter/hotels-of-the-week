var AutoPlayer, queryParam;

window.ASAP || (window.ASAP = (function() {
  var callall, fns;
  fns = [];
  callall = function() {
    var f, results;
    results = [];
    while (f = fns.shift()) {
      results.push(f());
    }
    return results;
  };
  if (document.addEventListener) {
    document.addEventListener('DOMContentLoaded', callall, false);
    window.addEventListener('load', callall, false);
  } else if (document.attachEvent) {
    document.attachEvent('onreadystatechange', callall);
    window.attachEvent('onload', callall);
  }
  return function(fn) {
    fns.push(fn);
    if (document.readyState === 'complete') {
      return callall();
    }
  };
})());

window.log || (window.log = function() {
  if (window.console && window.DEBUG) {
    if (typeof console.group === "function") {
      console.group(window.DEBUG);
    }
    if (arguments.length === 1 && Array.isArray(arguments[0]) && console.table) {
      console.table.apply(window, arguments);
    } else {
      console.log.apply(window, arguments);
    }
    return typeof console.groupEnd === "function" ? console.groupEnd() : void 0;
  }
});

window.trouble || (window.trouble = function() {
  var ref;
  if (window.console) {
    if (window.DEBUG) {
      if (typeof console.group === "function") {
        console.group(window.DEBUG);
      }
    }
    if ((ref = console.warn) != null) {
      ref.apply(window, arguments);
    }
    if (window.DEBUG) {
      return typeof console.groupEnd === "function" ? console.groupEnd() : void 0;
    }
  }
});

window.preload || (window.preload = function(what, fn) {
  var lib;
  if (!Array.isArray(what)) {
    what = [what];
  }
  return $.when.apply($, (function() {
    var i, len1, results;
    results = [];
    for (i = 0, len1 = what.length; i < len1; i++) {
      lib = what[i];
      results.push($.ajax(lib, {
        dataType: 'script',
        cache: true
      }));
    }
    return results;
  })()).done(function() {
    return typeof fn === "function" ? fn() : void 0;
  });
});

window.queryParam || (window.queryParam = queryParam = function(p, nocase) {
  var k, params, params_kv;
  params_kv = location.search.substr(1).split('&');
  params = {};
  params_kv.forEach(function(kv) {
    var k_v;
    k_v = kv.split('=');
    return params[k_v[0]] = k_v[1] || '';
  });
  if (p) {
    if (nocase) {
      for (k in params) {
        if (k.toUpperCase() === p.toUpperCase()) {
          return decodeURIComponent(params[k]);
        }
      }
      return void 0;
    } else {
      return decodeURIComponent(params[p]);
    }
  }
  return params;
});

String.prototype.zeroPad = function(len, c) {
  var s;
  s = '';
  c || (c = '0');
  len || (len = 2);
  len -= this.length;
  while (s.length < len) {
    s += c;
  }
  return s + this;
};

Number.prototype.zeroPad = function(len, c) {
  return String(this).zeroPad(len, c);
};

window.DEBUG = 'APP NAME';

AutoPlayer = (function() {
  function AutoPlayer($indicator, timeout, finished) {
    this.$el = $indicator;
    this.timeout = timeout;
    this.finished = finished;
    this.start();
  }

  AutoPlayer.prototype.start = function() {
    this.started = new Date().getTime();
    return this.tick();
  };

  AutoPlayer.prototype.stop = function() {
    cancelAnimationFrame(this.raf);
    return this.reset();
  };

  AutoPlayer.prototype.progress = function(fraction) {
    if (fraction > 1) {
      fraction = 1;
    }
    if (fraction < 0) {
      fraction = 0;
    }
    return this.$el.find('.filler').css('width', (100 - Math.round(fraction * 100)) + "%");
  };

  AutoPlayer.prototype.reset = function() {
    return setTimeout((function(_this) {
      return function() {
        return _this.$el.find('.filler').css('width', '');
      };
    })(this), 500);
  };

  AutoPlayer.prototype.tick = function() {
    var fraction;
    fraction = (new Date().getTime() - this.started) / this.timeout;
    this.progress(fraction);
    if (fraction < 1) {
      return this.raf = requestAnimationFrame((function(_this) {
        return function() {
          return _this.tick();
        };
      })(this));
    } else {
      return this.finished();
    }
  };

  return AutoPlayer;

})();

ASAP(function() {
  var $flickityReady;
  $flickityReady = $.Deferred();
  if (!$.fn.flickity) {
    preload('https://cdnjs.cloudflare.com/ajax/libs/flickity/2.3.0/flickity.pkgd.min.js', function() {
      return $flickityReady.resolve();
    });
  } else {
    $flickityReady.resolve();
  }
  return $.when($flickityReady).done(function() {
    var $dots, $slider, autoplayer, no_interaction_timer;
    autoplayer = null;
    no_interaction_timer = null;
    $dots = $('.progress-dash').on('click', function(e) {
      if (autoplayer != null) {
        autoplayer.stop();
      }
      $slider.removeAttr('data-autoplay');
      return $slider.flickity('select', $(this).index());
    });
    return $slider = $('#hotels-of-the-week .hotels-slider').flickity({
      cellSelector: '.hotel-slide',
      cellAlign: 'center',
      wrapAround: true,
      prevNextButtons: false,
      pageDots: false,
      on: {
        dragStart: function() {
          if (autoplayer != null) {
            autoplayer.stop();
          }
          return this.$element.removeAttr('data-autoplay');
        },
        staticClick: function() {
          if (autoplayer != null) {
            autoplayer.stop();
          }
          return this.$element.removeAttr('data-autoplay');
        },
        select: function(idx) {
          var $dot, autoplay, me;
          autoplay = this.$element.attr('data-autoplay');
          $dot = $dots.eq(idx);
          if (autoplay) {
            me = this;
            if (autoplayer != null) {
              autoplayer.stop();
            }
            autoplayer = new AutoPlayer($dot, Number(autoplay), function() {
              return me.next();
            });
          }
          return $dot.addClass('is-selected').siblings('.is-selected').removeClass('is-selected');
        }
      }
    });
  });
});
