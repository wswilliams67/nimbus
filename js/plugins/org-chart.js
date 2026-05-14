/**
 * ============================================================
 * CNDS Organization Chart Plugin
 * Cloudficient Nimbus Design System v1.0.0
 *
 * Hierarchical org chart rendered from JSON data.
 *
 * Usage:
 *   new Nimbus.OrgChart(el, {
 *     data: { name: 'CEO', title: 'Chief Executive', children: [...] }
 *   });
 *
 * ============================================================
 */

(() => {
  "use strict";

  const { Utils, EventHandler, NimbusComponent } = window.Nimbus;

  const NAME = "orgchart";
  const EVENT_KEY = ".cnds." + NAME;
  const EVENT_SELECT = "select" + EVENT_KEY;
  const EVENT_EXPAND = "expand" + EVENT_KEY;
  const EVENT_COLLAPSE = "collapse" + EVENT_KEY;

  const Default = {
    data: null,
    direction: "top", // top (vertical)
    nodeTemplate: null, // function(data) => HTML string
    expandAll: true
  };

  const DefaultType = {
    data: "(object|null)",
    direction: "string",
    nodeTemplate: "(function|null)",
    expandAll: "boolean"
  };

  class OrgChart extends NimbusComponent {
    constructor(element, config = {}) {
      super(element, config);
      this._selectedNode = null;
      this._init();
    }

    static get NAME() {
      return NAME;
    }
    static get Default() {
      return Default;
    }
    static get DefaultType() {
      return DefaultType;
    }

    getSelected() {
      return this._selectedNode;
    }

    expandAll() {
      this._element
        .querySelectorAll(".org-chart-children.collapsed")
        .forEach(function (el) {
          el.classList.remove("collapsed");
        });
      this._element
        .querySelectorAll(".org-chart-toggle")
        .forEach(function (el) {
          el.textContent = "−";
        });
    }

    collapseAll() {
      this._element
        .querySelectorAll(".org-chart-children")
        .forEach(function (el) {
          el.classList.add("collapsed");
        });
      this._element
        .querySelectorAll(".org-chart-toggle")
        .forEach(function (el) {
          el.textContent = "+";
        });
    }

    update(data) {
      this._config.data = data;
      this._render();
    }

    dispose() {
      super.dispose();
    }

    _init() {
      this._element.classList.add("org-chart");

      // Parse data from attribute
      if (!this._config.data) {
        var dataAttr = this._element.getAttribute("data-cnds-data");
        if (dataAttr) {
          try {
            this._config.data = JSON.parse(dataAttr);
          } catch (e) {
            /* */
          }
        }
      }

      if (this._config.data) {
        this._render();
      }

      this._bindEvents();
    }

    _render() {
      this._element.innerHTML = "";
      var container = document.createElement("div");
      container.className = "org-chart-container";
      container.appendChild(this._buildNode(this._config.data));
      this._element.appendChild(container);
    }

    _buildNode(data) {
      var self = this;
      var node = document.createElement("div");
      node.className = "org-chart-node";
      if (data.id) node.setAttribute("data-cnds-id", data.id);

      // Card
      var card = document.createElement("div");
      card.className = "org-chart-card";

      if (this._config.nodeTemplate) {
        card.innerHTML = this._config.nodeTemplate(data);
      } else {
        // Avatar
        var avatar = document.createElement("div");
        avatar.className = "org-chart-avatar";
        if (data.avatar) {
          var img = document.createElement("img");
          img.src = data.avatar;
          img.alt = data.name || "";
          avatar.appendChild(img);
        } else {
          avatar.textContent = (data.name || "?").charAt(0).toUpperCase();
        }
        card.appendChild(avatar);

        // Info
        var info = document.createElement("div");
        info.className = "org-chart-info";
        var name = document.createElement("div");
        name.className = "org-chart-name";
        name.textContent = data.name || "";
        info.appendChild(name);
        if (data.title) {
          var title = document.createElement("div");
          title.className = "org-chart-title";
          title.textContent = data.title;
          info.appendChild(title);
        }
        card.appendChild(info);
      }

      node.appendChild(card);

      // Children
      if (data.children && data.children.length > 0) {
        // Connector
        var connector = document.createElement("div");
        connector.className = "org-chart-connector";
        node.appendChild(connector);

        // Toggle
        var toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "org-chart-toggle";
        toggle.textContent = this._config.expandAll ? "−" : "+";
        toggle.setAttribute("aria-label", "Toggle children");
        node.appendChild(toggle);

        // Children container
        var children = document.createElement("div");
        children.className = "org-chart-children";
        if (!this._config.expandAll) children.classList.add("collapsed");

        data.children.forEach(function (childData) {
          children.appendChild(self._buildNode(childData));
        });

        node.appendChild(children);
      }

      return node;
    }

    _bindEvents() {
      var self = this;

      EventHandler.on(this._element, "click", function (e) {
        // Toggle
        var toggle = e.target.closest(".org-chart-toggle");
        if (toggle) {
          var node = toggle.closest(".org-chart-node");
          var children = node.querySelector(":scope > .org-chart-children");
          if (children) {
            var collapsed = children.classList.toggle("collapsed");
            toggle.textContent = collapsed ? "+" : "−";
            var evt = collapsed ? EVENT_COLLAPSE : EVENT_EXPAND;
            EventHandler.trigger(self._element, evt, { node: node });
          }
          return;
        }

        // Select
        var card = e.target.closest(".org-chart-card");
        if (card) {
          self._element
            .querySelectorAll(".org-chart-card.selected")
            .forEach(function (c) {
              c.classList.remove("selected");
            });
          card.classList.add("selected");
          self._selectedNode = card.closest(".org-chart-node");
          EventHandler.trigger(self._element, EVENT_SELECT, {
            node: self._selectedNode,
            id: self._selectedNode.getAttribute("data-cnds-id")
          });
        }
      });
    }

    static jQueryInterface(config) {
      return this.each(function () {
        var instance = OrgChart.getInstance(this);
        if (!instance)
          instance = new OrgChart(
            this,
            typeof config === "object" ? config : {}
          );
        if (typeof config === "string") {
          if (typeof instance[config] !== "function")
            throw new TypeError("No method named " + config);
          instance[config]();
        }
      });
    }
  }

  function autoInit(root) {
    if (root === undefined) root = document;
    root.querySelectorAll("[data-cnds-org-chart-init]").forEach(function (el) {
      if (!OrgChart.getInstance(el)) new OrgChart(el);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      autoInit();
    });
  } else {
    autoInit();
  }

  window.Nimbus = window.Nimbus || {};
  window.Nimbus.OrgChart = OrgChart;
  if (window.Nimbus.DataAPI)
    window.Nimbus.DataAPI.registerComponent(NAME, OrgChart);
})();
