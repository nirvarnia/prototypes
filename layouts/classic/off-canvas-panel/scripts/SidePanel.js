;(function () {

  // Helper functions

  function trim (str) {
    return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '')
  }

  function hasClass (el, cn) {
    return (' ' + el.className + ' ').indexOf(' ' + cn + ' ') !== -1
  }

  function addClass (el, cn) {
    if (!hasClass(el, cn)) {
      el.className = (el.className === '') ? cn : el.className + ' ' + cn
    }
  }

  function removeClass (el, cn) {
    el.className = trim((' ' + el.className + ' ').replace(' ' + cn + ' ', ' '))
  }

  // SidePanel

  var SidePanel = function (panel, options) {
    this._init.apply(this, arguments)
  }

  SidePanel.prototype.defaults = {
    class_is_enabled: 'sidepanel-is-enabled',
    class_is_showing: 'sidepanel-is-showing'
  }

  SidePanel.prototype._init = function (panel, options) {

    // Set up DOM references and input options.
    this.panel = panel
    this.options = this.defaults
    if (options) {
      for (var key in options) {
        if (options.hasOwnProperty(key)) {
          this.options[key] = options[key]
        }
      }
    }

    // Add a class to the <html> element, to allow for alternative
    // presentation when side-panel behaviour is enabled.

    this.root = window.document.documentElement

    // Find all interactive elements within the side-panel. When
    // the panel is hidden, we will disable keyboard navigation to
    // these elements. We fetch the side-panel controls once only;
    // subsequent dynamic changes to the DOM are not taken into account.

    this.panel_controls = this.panel.querySelectorAll('a, button, input, select, textarea, [contenteditable]')
    this.panel_controls = Array.prototype.slice.call(this.panel_controls, 0)

    // Clicking anywhere in the document body will hide the
    // side-panel, if it is currently showing. Clicks on the navigation
    // pane itself must not propagate through to the body.

    this.body = window.document.body
    this.body.addEventListener('click', this.hide.bind(this))
    this.panel.addEventListener('click', function (event) { event.stopPropagation() })

    // Pressing then Esc key should close the side-panel.
    this.body.addEventListener('keyup', function (event) {
      if (event.keyCode === 27) {
        this.hide()
      }
    }.bind(this))

    // Resizing the browser window should hide the side-panel, too.
    window.addEventListener('resize', this.hide.bind(this))

    // Initially the side-panel is assumed to be hidden.
    this.hide()
    addClass(this.root, this.options.class_is_enabled)
  }

  SidePanel.prototype.isShowing = function () {
    if (hasClass(this.root, this.options.class_is_showing)) {
      return true
    }
    return false
  }

  SidePanel.prototype.isHidden = function () {
    if (!hasClass(this.root, this.options.class_is_showing)) {
      return true
    }
    return false
  }

  SidePanel.prototype.onShow = function () {}
  SidePanel.prototype.onHide = function () {}

  SidePanel.prototype.show = function () {
    addClass(this.root, this.options.class_is_showing)

    // Remove tabindex="-1" so links within the side-panel
    // panel can be navigated via keyboard, again.

    this.panel_controls.forEach(function (ctrl) {
      ctrl.removeAttribute('tabindex')
    })

    // In some versions of Safari for iOS, click events do not
    // always bubble all the way up to the <body> element (except
    // for click events that occur on anchors, which DO bubble up
    // to the document.) A well-documented solution is to explicitly
    // set the CSS 'cursor' property to 'pointer' on the elements
    // that you want to be clickable (in our case, the document
    // body itself).

    this.body.style.cursor = 'pointer'
    this.panel.style.cursor = 'auto'

    // Give keyboard focus to the first interactive element in
    // the side-panel. Applying focus to something while it is
    // being transformed with CSS can cause rendering problems in
    // Chrome and IE. For this reason, wait a full second for any
    // animations to complete before applying focus.

    window.setTimeout(function () {
      if (this.panel_controls[0]) {
        this.panel_controls[0].focus()
      }
    }.bind(this), 1000)
    this.onShow()
  }

  SidePanel.prototype.hide = function () {
    removeClass(this.root, this.options.class_is_showing)
    this.panel_controls.forEach(function (ctrl) {
      ctrl.setAttribute('tabindex', '-1')
    })

    // Safari for iOS fix, see notes for show() function.
    this.body.style.cursor = 'auto'
    this.onHide()
  }

  SidePanel.prototype.toggle = function () {
    if (hasClass(this.root, this.options.class_is_showing)) {
      this.hide()
    } else {
      this.show()
    }
  }

  // Auto-detect the side-panel (and all its toggles) if the document
  // has one installed.

  document.addEventListener('DOMContentLoaded', function () {
    var template = document.querySelector('#template-sidepanel')
    if (template) {
      // Extract the markup for the side-panel and inject it into
      // the DOM in the exact same position as the original template.

      // parseHTML
      var div = document.createElement('div')
      div.innerHTML = template.innerHTML
      var frag = document.createDocumentFragment()
      while (div.childNodes[0]) {
        frag.appendChild(div.childNodes[0])
      }

      // injectBefore
      template.parentNode.insertBefore(frag, template)

      // eject
      template.parentNode.removeChild(template)
    }

    // The side-panel element itself is expected to have
    // the id "sidepanel". Find it and all its toggle buttons.
    // Apply click events to the toggles. Remember the last toggle
    // button that was used to open the sidepanel, and move focus
    // back to that element when the sidepanel is closed again.
    // Also, then the sidepanel is showing, remove Tab key
    // navigation to controls within the canvas area (i.e. outside
    // of the sidepanel).

    var panel = document.getElementById('sidepanel')
    if (panel) {
      var canvas = document.getElementById('canvas')
      var canvasCtrls
      var sidepanel = new SidePanel(panel)
      var sidepanelLastOpenedBby

      sidepanel.onShow = function () {
        if (canvas) {
          canvasCtrls = canvas.querySelectorAll('a, area, button, input, select, textarea, figure, iframe, object, embed, svg, *[contenteditable], *[tabindex]')
          for (var i = 0; i < canvasCtrls.length; i++) {
            canvasCtrls[i].oldTabIndex = canvasCtrls[i].tabIndex
            canvasCtrls[i].tabIndex = -1
          }
        }
      }

      sidepanel.onHide = function () {
        if (canvasCtrls) {
          for (var i = 0; i < canvasCtrls.length; i++) {
            if (canvasCtrls[i].hasOwnProperty('oldTabIndex')) {
              canvasCtrls[i].tabIndex = canvasCtrls[i].oldTabIndex
            }
          }
          canvasCtrls = undefined
        }
        if (sidepanelLastOpenedBby) {
          sidepanelLastOpenedBby.focus()
          sidepanelLastOpenedBby = undefined
        }
      }

      var toggles = document.querySelectorAll('*[data-sidepanel-toggle]')
      for (var i = 0; i < toggles.length; i++) {
        (function () {
          var toggle = toggles[i]
          var config
          try {
            config = JSON.parse(toggle.getAttribute('data-sidepanel-toggle'))
          } catch (error) {}
          toggle.addEventListener('click', function (event) {
            if (config && config.prevent_default) {
              event.preventDefault()
            }
            event.stopPropagation()
            if (sidepanel.isHidden()) {
              sidepanelLastOpenedBby = toggle
            }
            sidepanel.toggle()
          })
        }())
      }

      /* Because the main scrolling mechanism for the web page has moved
      from the document body to the canvas element, the user will not
      be able to scroll the page using the arrow keys when the document
      is rendered. To normalise this behaviour, initial focus should be
      moved from the document body to the canvas element. */

      if (canvas) {
        document.body.tabIndex = -1
        canvas.tabIndex = 0
        canvas.focus()
      }
    }
  })
}())
