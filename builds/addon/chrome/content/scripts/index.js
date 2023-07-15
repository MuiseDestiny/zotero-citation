"use strict";
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __async = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };

  // node_modules/zotero-plugin-toolkit/dist/utils/debugBridge.js
  var require_debugBridge = __commonJS({
    "node_modules/zotero-plugin-toolkit/dist/utils/debugBridge.js"(exports) {
      "use strict";
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.DebugBridge = void 0;
      var basic_1 = require_basic();
      var toolkitGlobal_1 = __importDefault(require_toolkitGlobal());
      var DebugBridge = class {
        get version() {
          return DebugBridge.version;
        }
        get disableDebugBridgePassword() {
          return this._disableDebugBridgePassword;
        }
        set disableDebugBridgePassword(value) {
          this._disableDebugBridgePassword = value;
        }
        get password() {
          return basic_1.BasicTool.getZotero().Prefs.get(DebugBridge.passwordPref, true);
        }
        set password(v) {
          basic_1.BasicTool.getZotero().Prefs.set(DebugBridge.passwordPref, v, true);
        }
        constructor() {
          this._disableDebugBridgePassword = false;
          this.initializeDebugBridge();
        }
        static setModule(instance) {
          var _a;
          if (!((_a = instance.debugBridge) === null || _a === void 0 ? void 0 : _a.version) || instance.debugBridge.version < DebugBridge.version) {
            instance.debugBridge = new DebugBridge();
          }
        }
        initializeDebugBridge() {
          const debugBridgeExtension = {
            noContent: true,
            doAction: async (uri) => {
              var _a;
              const Zotero2 = basic_1.BasicTool.getZotero();
              const uriString = uri.spec.split("//").pop();
              if (!uriString) {
                return;
              }
              const params = {};
              (_a = uriString.split("?").pop()) === null || _a === void 0 ? void 0 : _a.split("&").forEach((p) => {
                params[p.split("=")[0]] = p.split("=")[1];
              });
              if (toolkitGlobal_1.default.getInstance().debugBridge.disableDebugBridgePassword || params.password === this.password) {
                if (params.run) {
                  try {
                    const AsyncFunction = Object.getPrototypeOf(async function() {
                    }).constructor;
                    const f = new AsyncFunction("Zotero,window", decodeURIComponent(params.run));
                    await f(Zotero2, Zotero2.getMainWindow());
                  } catch (e) {
                    Zotero2.debug(e);
                    Zotero2.getMainWindow().console.log(e);
                  }
                }
                if (params.file) {
                  try {
                    Services.scriptloader.loadSubScript(decodeURIComponent(params.file), { Zotero: Zotero2, window: Zotero2.getMainWindow() });
                  } catch (e) {
                    Zotero2.debug(e);
                    Zotero2.getMainWindow().console.log(e);
                  }
                }
              }
            },
            newChannel: function(uri) {
              this.doAction(uri);
            }
          };
          Services.io.getProtocolHandler("zotero").wrappedJSObject._extensions["zotero://ztoolkit-debug"] = debugBridgeExtension;
        }
      };
      exports.DebugBridge = DebugBridge;
      DebugBridge.version = 1;
      DebugBridge.passwordPref = "extensions.zotero.debug-bridge.password";
    }
  });

  // node_modules/zotero-plugin-toolkit/dist/managers/toolkitGlobal.js
  var require_toolkitGlobal = __commonJS({
    "node_modules/zotero-plugin-toolkit/dist/managers/toolkitGlobal.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.ToolkitGlobal = void 0;
      var basic_1 = require_basic();
      var debugBridge_1 = require_debugBridge();
      var ToolkitGlobal = class {
        constructor() {
          initializeModules(this);
        }
        /**
         * Get the global unique instance of `class ToolkitGlobal`.
         * @returns An instance of `ToolkitGlobal`.
         */
        static getInstance() {
          const Zotero2 = basic_1.BasicTool.getZotero();
          if (!("_toolkitGlobal" in Zotero2)) {
            Zotero2._toolkitGlobal = new ToolkitGlobal();
          } else {
            initializeModules(Zotero2._toolkitGlobal);
          }
          return Zotero2._toolkitGlobal;
        }
      };
      exports.ToolkitGlobal = ToolkitGlobal;
      function initializeModules(instance) {
        setModule(instance, "fieldHooks", {
          _ready: false,
          getFieldHooks: {},
          setFieldHooks: {},
          isFieldOfBaseHooks: {}
        });
        setModule(instance, "itemTree", {
          _ready: false,
          columns: [],
          renderCellHooks: {}
        });
        setModule(instance, "itemBox", {
          _ready: false,
          fieldOptions: {}
        });
        setModule(instance, "shortcut", {
          _ready: false,
          eventKeys: []
        });
        setModule(instance, "prompt", {
          _ready: false,
          instance: void 0
        });
        setModule(instance, "readerInstance", {
          _ready: false,
          initializedHooks: {}
        });
        debugBridge_1.DebugBridge.setModule(instance);
      }
      function setModule(instance, key, module2) {
        var _a;
        var _b;
        if (!module2) {
          return;
        }
        if (!instance[key]) {
          instance[key] = module2;
        }
        for (const moduleKey in module2) {
          (_a = (_b = instance[key])[moduleKey]) !== null && _a !== void 0 ? _a : _b[moduleKey] = module2[moduleKey];
        }
      }
      exports.default = ToolkitGlobal;
    }
  });

  // node_modules/zotero-plugin-toolkit/dist/basic.js
  var require_basic = __commonJS({
    "node_modules/zotero-plugin-toolkit/dist/basic.js"(exports) {
      "use strict";
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.unregister = exports.ManagerTool = exports.BasicTool = void 0;
      var toolkitGlobal_1 = __importDefault(require_toolkitGlobal());
      var BasicTool3 = class {
        get basicOptions() {
          return this._basicOptions;
        }
        /**
         *
         * @param basicTool Pass an BasicTool instance to copy its options.
         */
        constructor(data) {
          this.patchSign = "zotero-plugin-toolkit@2.0.0";
          this._basicOptions = {
            log: {
              _type: "toolkitlog",
              disableConsole: false,
              disableZLog: false,
              prefix: ""
            },
            debug: toolkitGlobal_1.default.getInstance().debugBridge
          };
          this.updateOptions(data);
          return;
        }
        getGlobal(k) {
          const _Zotero = typeof Zotero !== "undefined" ? Zotero : Components.classes["@zotero.org/Zotero;1"].getService(Components.interfaces.nsISupports).wrappedJSObject;
          const window2 = _Zotero.getMainWindow();
          switch (k) {
            case "Zotero":
            case "zotero":
              return _Zotero;
            case "window":
              return window2;
            case "document":
              return window2.document;
            case "ZoteroPane":
            case "ZoteroPane_Local":
              return _Zotero.getActiveZoteroPane();
            default:
              return window2[k];
          }
        }
        /**
         * Check if it's running on Zotero 7 (Firefox 102)
         */
        isZotero7() {
          return Zotero.platformMajorVersion >= 102;
        }
        /**
         * Get DOMParser.
         *
         * For Zotero 6: mainWindow.DOMParser or nsIDOMParser
         *
         * For Zotero 7: Firefox 102 support DOMParser natively
         */
        getDOMParser() {
          if (this.isZotero7()) {
            return new (this.getGlobal("DOMParser"))();
          }
          try {
            return new (this.getGlobal("DOMParser"))();
          } catch (e) {
            return Components.classes["@mozilla.org/xmlextras/domparser;1"].createInstance(Components.interfaces.nsIDOMParser);
          }
        }
        /**
         * If it's an XUL element
         * @param elem
         */
        isXULElement(elem) {
          return elem.namespaceURI === "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
        }
        /**
         * Create an XUL element
         *
         * For Zotero 6, use `createElementNS`;
         *
         * For Zotero 7+, use `createXULElement`.
         * @param doc
         * @param type
         * @example
         * Create a `<menuitem>`:
         * ```ts
         * const compat = new ZoteroCompat();
         * const doc = compat.getWindow().document;
         * const elem = compat.createXULElement(doc, "menuitem");
         * ```
         */
        createXULElement(doc, type) {
          if (this.isZotero7()) {
            return doc.createXULElement(type);
          } else {
            return doc.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", type);
          }
        }
        /**
         * Output to both Zotero.debug and console.log
         * @param data e.g. string, number, object, ...
         */
        log(...data) {
          var _a;
          if (data.length === 0) {
            return;
          }
          const Zotero2 = this.getGlobal("Zotero");
          const console2 = this.getGlobal("console");
          let options;
          if (((_a = data[data.length - 1]) === null || _a === void 0 ? void 0 : _a._type) === "toolkitlog") {
            options = data.pop();
          } else {
            options = this._basicOptions.log;
          }
          try {
            if (options.prefix) {
              data.splice(0, 0, options.prefix);
            }
            if (!options.disableConsole) {
              console2.groupCollapsed(...data);
              console2.trace();
              console2.groupEnd();
            }
            if (!options.disableZLog) {
              Zotero2.debug(data.map((d) => {
                try {
                  return typeof d === "object" ? JSON.stringify(d) : String(d);
                } catch (e) {
                  Zotero2.debug(d);
                  return "";
                }
              }).join("\n"));
            }
          } catch (e) {
            console2.error(e);
            Zotero2.logError(e);
          }
        }
        /**
         * Patch a function
         * @param object The owner of the function
         * @param funcSign The signature of the function(function name)
         * @param ownerSign The signature of patch owner to avoid patching again
         * @param patcher The new wrapper of the patched funcion
         */
        patch(object, funcSign, ownerSign, patcher) {
          if (object[funcSign][ownerSign]) {
            throw new Error(`${funcSign} re-patched`);
          }
          this.log("patching", funcSign, `by ${ownerSign}`);
          object[funcSign] = patcher(object[funcSign]);
          object[funcSign][ownerSign] = true;
        }
        updateOptions(source) {
          if (!source) {
            return;
          }
          if (source instanceof BasicTool3) {
            this._basicOptions = source._basicOptions;
          } else {
            this._basicOptions = source;
          }
        }
        static getZotero() {
          return typeof Zotero !== "undefined" ? Zotero : Components.classes["@zotero.org/Zotero;1"].getService(Components.interfaces.nsISupports).wrappedJSObject;
        }
      };
      exports.BasicTool = BasicTool3;
      var ManagerTool = class extends BasicTool3 {
      };
      exports.ManagerTool = ManagerTool;
      function unregister2(tools) {
        Object.values(tools).forEach((tool) => {
          if (tool instanceof ManagerTool || typeof tool.unregisterAll === "function") {
            tool.unregisterAll();
          }
        });
      }
      exports.unregister = unregister2;
    }
  });

  // node_modules/zotero-plugin-toolkit/dist/tools/ui.js
  var require_ui = __commonJS({
    "node_modules/zotero-plugin-toolkit/dist/tools/ui.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.UITool = void 0;
      var basic_1 = require_basic();
      var UITool2 = class extends basic_1.BasicTool {
        get basicOptions() {
          return this._basicOptions;
        }
        constructor(base) {
          super(base);
          this.elementCache = [];
          if (!this._basicOptions.ui) {
            this._basicOptions.ui = {
              enableElementRecord: true,
              enableElementJSONLog: false,
              enableElementDOMLog: true
            };
          }
        }
        /**
         * Remove all elements created by `createElement`.
         *
         * @remarks
         * > What is this for?
         *
         * In bootstrap plugins, elements must be manually maintained and removed on exiting.
         *
         * This API does this for you.
         */
        unregisterAll() {
          this.elementCache.forEach((e) => {
            try {
              e === null || e === void 0 ? void 0 : e.remove();
            } catch (e2) {
              this.log(e2);
            }
          });
        }
        createElement(...args) {
          var _a, _b, _c;
          const doc = args[0];
          const tagName = args[1].toLowerCase();
          let props = args[2] || {};
          if (!tagName) {
            return;
          }
          if (typeof args[2] === "string") {
            props = {
              namespace: args[2],
              enableElementRecord: args[3]
            };
          }
          if (typeof props.enableElementJSONLog !== "undefined" && props.enableElementJSONLog || this.basicOptions.ui.enableElementJSONLog) {
            this.log(props);
          }
          props.properties = props.properties || props.directAttributes;
          props.children = props.children || props.subElementOptions;
          let elem;
          if (tagName === "fragment") {
            const fragElem = doc.createDocumentFragment();
            elem = fragElem;
          } else {
            let realElem = props.id && (props.checkExistenceParent ? props.checkExistenceParent : doc).querySelector(`#${props.id}`);
            if (realElem && props.ignoreIfExists) {
              return realElem;
            }
            if (realElem && props.removeIfExists) {
              realElem.remove();
              realElem = void 0;
            }
            if (props.customCheck && !props.customCheck(doc, props)) {
              return void 0;
            }
            if (!realElem || !props.skipIfExists) {
              let namespace = props.namespace;
              if (!namespace) {
                const mightHTML = HTMLElementTagNames.includes(tagName);
                const mightXUL = XULElementTagNames.includes(tagName);
                const mightSVG = SVGElementTagNames.includes(tagName);
                if (Number(mightHTML) + Number(mightXUL) + Number(mightSVG) > 1) {
                  this.log(`[Warning] Creating element ${tagName} with no namespace specified. Found multiply namespace matches.`);
                }
                if (mightHTML) {
                  namespace = "html";
                } else if (mightXUL) {
                  namespace = "xul";
                } else if (mightSVG) {
                  namespace = "svg";
                } else {
                  namespace = "html";
                }
              }
              if (namespace === "xul") {
                realElem = this.createXULElement(doc, tagName);
              } else {
                realElem = doc.createElementNS({
                  html: "http://www.w3.org/1999/xhtml",
                  svg: "http://www.w3.org/2000/svg"
                }[namespace], tagName);
              }
              this.elementCache.push(realElem);
            }
            if (props.id) {
              realElem.id = props.id;
            }
            if (props.styles && Object.keys(props.styles).length) {
              Object.keys(props.styles).forEach((k) => {
                const v = props.styles[k];
                typeof v !== "undefined" && (realElem.style[k] = v);
              });
            }
            if (props.properties && Object.keys(props.properties).length) {
              Object.keys(props.properties).forEach((k) => {
                const v = props.properties[k];
                typeof v !== "undefined" && (realElem[k] = v);
              });
            }
            if (props.attributes && Object.keys(props.attributes).length) {
              Object.keys(props.attributes).forEach((k) => {
                const v = props.attributes[k];
                typeof v !== "undefined" && realElem.setAttribute(k, String(v));
              });
            }
            if ((_a = props.classList) === null || _a === void 0 ? void 0 : _a.length) {
              realElem.classList.add(...props.classList);
            }
            if ((_b = props.listeners) === null || _b === void 0 ? void 0 : _b.length) {
              props.listeners.forEach(({ type, listener, options }) => {
                listener && realElem.addEventListener(type, listener, options);
              });
            }
            elem = realElem;
          }
          if ((_c = props.children) === null || _c === void 0 ? void 0 : _c.length) {
            const subElements = props.children.map((childProps) => {
              childProps.namespace = childProps.namespace || props.namespace;
              return this.createElement(doc, childProps.tag, childProps);
            }).filter((e) => e);
            elem.append(...subElements);
          }
          if (typeof props.enableElementDOMLog !== "undefined" && props.enableElementDOMLog || this.basicOptions.ui.enableElementDOMLog) {
            this.log(elem);
          }
          return elem;
        }
        /**
         * Append element(s) to a node.
         * @param properties See {@link ElementProps}
         * @param container The parent node to append to.
         * @returns A Node that is the appended child (aChild),
         *          except when aChild is a DocumentFragment,
         *          in which case the empty DocumentFragment is returned.
         */
        appendElement(properties, container) {
          return container.appendChild(this.createElement(container.ownerDocument, properties.tag, properties));
        }
        /**
         * Inserts a node before a reference node as a child of its parent node.
         * @param properties See {@link ElementProps}
         * @param referenceNode The node before which newNode is inserted.
         * @returns
         */
        insertElementBefore(properties, referenceNode) {
          if (referenceNode.parentNode)
            return referenceNode.parentNode.insertBefore(this.createElement(referenceNode.ownerDocument, properties.tag, properties), referenceNode);
          else
            this.log(referenceNode.tagName + " has no parent, cannot insert " + properties.tag);
        }
        /**
         * Replace oldNode with a new one.
         * @param properties See {@link ElementProps}
         * @param oldNode The child to be replaced.
         * @returns The replaced Node. This is the same node as oldChild.
         */
        replaceElement(properties, oldNode) {
          if (oldNode.parentNode)
            return oldNode.parentNode.replaceChild(this.createElement(oldNode.ownerDocument, properties.tag, properties), oldNode);
          else
            this.log(oldNode.tagName + " has no parent, cannot replace it with " + properties.tag);
        }
        /**
         * Parse XHTML to XUL fragment. For Zotero 6.
         *
         * To load preferences from a Zotero 7's `.xhtml`, use this method to parse it.
         * @param str xhtml raw text
         * @param entities dtd file list ("chrome://xxx.dtd")
         * @param defaultXUL true for default XUL namespace
         */
        parseXHTMLToFragment(str, entities = [], defaultXUL = true) {
          let parser = this.getDOMParser();
          const xulns = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
          const htmlns = "http://www.w3.org/1999/xhtml";
          const wrappedStr = `${entities.length ? `<!DOCTYPE bindings [ ${entities.reduce((preamble, url, index) => {
            return preamble + `<!ENTITY % _dtd-${index} SYSTEM "${url}"> %_dtd-${index}; `;
          }, "")}]>` : ""}
      <html:div xmlns="${defaultXUL ? xulns : htmlns}"
          xmlns:xul="${xulns}" xmlns:html="${htmlns}">
      ${str}
      </html:div>`;
          this.log(wrappedStr, parser);
          let doc = parser.parseFromString(wrappedStr, "text/xml");
          this.log(doc);
          if (doc.documentElement.localName === "parsererror") {
            throw new Error("not well-formed XHTML");
          }
          let range = doc.createRange();
          range.selectNodeContents(doc.querySelector("div"));
          return range.extractContents();
        }
      };
      exports.UITool = UITool2;
      var HTMLElementTagNames = [
        "a",
        "abbr",
        "address",
        "area",
        "article",
        "aside",
        "audio",
        "b",
        "base",
        "bdi",
        "bdo",
        "blockquote",
        "body",
        "br",
        "button",
        "canvas",
        "caption",
        "cite",
        "code",
        "col",
        "colgroup",
        "data",
        "datalist",
        "dd",
        "del",
        "details",
        "dfn",
        "dialog",
        "div",
        "dl",
        "dt",
        "em",
        "embed",
        "fieldset",
        "figcaption",
        "figure",
        "footer",
        "form",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "head",
        "header",
        "hgroup",
        "hr",
        "html",
        "i",
        "iframe",
        "img",
        "input",
        "ins",
        "kbd",
        "label",
        "legend",
        "li",
        "link",
        "main",
        "map",
        "mark",
        "menu",
        "meta",
        "meter",
        "nav",
        "noscript",
        "object",
        "ol",
        "optgroup",
        "option",
        "output",
        "p",
        "picture",
        "pre",
        "progress",
        "q",
        "rp",
        "rt",
        "ruby",
        "s",
        "samp",
        "script",
        "section",
        "select",
        "slot",
        "small",
        "source",
        "span",
        "strong",
        "style",
        "sub",
        "summary",
        "sup",
        "table",
        "tbody",
        "td",
        "template",
        "textarea",
        "tfoot",
        "th",
        "thead",
        "time",
        "title",
        "tr",
        "track",
        "u",
        "ul",
        "var",
        "video",
        "wbr"
      ];
      var XULElementTagNames = [
        "action",
        "arrowscrollbox",
        "bbox",
        "binding",
        "bindings",
        "box",
        "broadcaster",
        "broadcasterset",
        "button",
        "browser",
        "checkbox",
        "caption",
        "colorpicker",
        "column",
        "columns",
        "commandset",
        "command",
        "conditions",
        "content",
        "deck",
        "description",
        "dialog",
        "dialogheader",
        "editor",
        "grid",
        "grippy",
        "groupbox",
        "hbox",
        "iframe",
        "image",
        "key",
        "keyset",
        "label",
        "listbox",
        "listcell",
        "listcol",
        "listcols",
        "listhead",
        "listheader",
        "listitem",
        "member",
        "menu",
        "menubar",
        "menuitem",
        "menulist",
        "menupopup",
        "menuseparator",
        "observes",
        "overlay",
        "page",
        "popup",
        "popupset",
        "preference",
        "preferences",
        "prefpane",
        "prefwindow",
        "progressmeter",
        "radio",
        "radiogroup",
        "resizer",
        "richlistbox",
        "richlistitem",
        "row",
        "rows",
        "rule",
        "script",
        "scrollbar",
        "scrollbox",
        "scrollcorner",
        "separator",
        "spacer",
        "splitter",
        "stack",
        "statusbar",
        "statusbarpanel",
        "stringbundle",
        "stringbundleset",
        "tab",
        "tabbrowser",
        "tabbox",
        "tabpanel",
        "tabpanels",
        "tabs",
        "template",
        "textnode",
        "textbox",
        "titlebar",
        "toolbar",
        "toolbarbutton",
        "toolbargrippy",
        "toolbaritem",
        "toolbarpalette",
        "toolbarseparator",
        "toolbarset",
        "toolbarspacer",
        "toolbarspring",
        "toolbox",
        "tooltip",
        "tree",
        "treecell",
        "treechildren",
        "treecol",
        "treecols",
        "treeitem",
        "treerow",
        "treeseparator",
        "triple",
        "vbox",
        "window",
        "wizard",
        "wizardpage"
      ];
      var SVGElementTagNames = [
        "a",
        "animate",
        "animateMotion",
        "animateTransform",
        "circle",
        "clipPath",
        "defs",
        "desc",
        "ellipse",
        "feBlend",
        "feColorMatrix",
        "feComponentTransfer",
        "feComposite",
        "feConvolveMatrix",
        "feDiffuseLighting",
        "feDisplacementMap",
        "feDistantLight",
        "feDropShadow",
        "feFlood",
        "feFuncA",
        "feFuncB",
        "feFuncG",
        "feFuncR",
        "feGaussianBlur",
        "feImage",
        "feMerge",
        "feMergeNode",
        "feMorphology",
        "feOffset",
        "fePointLight",
        "feSpecularLighting",
        "feSpotLight",
        "feTile",
        "feTurbulence",
        "filter",
        "foreignObject",
        "g",
        "image",
        "line",
        "linearGradient",
        "marker",
        "mask",
        "metadata",
        "mpath",
        "path",
        "pattern",
        "polygon",
        "polyline",
        "radialGradient",
        "rect",
        "script",
        "set",
        "stop",
        "style",
        "svg",
        "switch",
        "symbol",
        "text",
        "textPath",
        "title",
        "tspan",
        "use",
        "view"
      ];
    }
  });

  // node_modules/zotero-plugin-toolkit/dist/tools/reader.js
  var require_reader = __commonJS({
    "node_modules/zotero-plugin-toolkit/dist/tools/reader.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.ReaderTool = void 0;
      var basic_1 = require_basic();
      var ReaderTool = class extends basic_1.BasicTool {
        /**
         * Get the selected tab reader.
         * @param waitTime Wait for n MS until the reader is ready
         */
        async getReader(waitTime = 5e3) {
          const Zotero_Tabs2 = this.getGlobal("Zotero_Tabs");
          if (Zotero_Tabs2.selectedType !== "reader") {
            return void 0;
          }
          let reader = Zotero.Reader.getByTabID(Zotero_Tabs2.selectedID);
          let delayCount = 0;
          const checkPeriod = 50;
          while (!reader && delayCount * checkPeriod < waitTime) {
            await Zotero.Promise.delay(checkPeriod);
            reader = Zotero.Reader.getByTabID(Zotero_Tabs2.selectedID);
            delayCount++;
          }
          await (reader === null || reader === void 0 ? void 0 : reader._initPromise);
          return reader;
        }
        /**
         * Get all window readers.
         */
        getWindowReader() {
          const Zotero_Tabs2 = this.getGlobal("Zotero_Tabs");
          let windowReaders = [];
          let tabs = Zotero_Tabs2._tabs.map((e) => e.id);
          for (let i = 0; i < Zotero.Reader._readers.length; i++) {
            let flag = false;
            for (let j = 0; j < tabs.length; j++) {
              if (Zotero.Reader._readers[i].tabID == tabs[j]) {
                flag = true;
                break;
              }
            }
            if (!flag) {
              windowReaders.push(Zotero.Reader._readers[i]);
            }
          }
          return windowReaders;
        }
        /**
         * Get Reader tabpanel deck element.
         * @alpha
         */
        getReaderTabPanelDeck() {
          var _a;
          const deck = (_a = this.getGlobal("window").document.querySelector(".notes-pane-deck")) === null || _a === void 0 ? void 0 : _a.previousElementSibling;
          return deck;
        }
        /**
         * Add a reader tabpanel deck selection change observer.
         * @alpha
         * @param callback
         */
        addReaderTabPanelDeckObserver(callback) {
          const deck = this.getReaderTabPanelDeck();
          const observer = new (this.getGlobal("MutationObserver"))(async (mutations) => {
            mutations.forEach(async (mutation) => {
              const target = mutation.target;
              if (target.classList.contains("zotero-view-tabbox") || target.tagName === "deck") {
                callback();
              }
            });
          });
          observer.observe(deck, {
            attributes: true,
            attributeFilter: ["selectedIndex"],
            subtree: true
          });
          return observer;
        }
        /**
         * Get the text selection of reader.
         * @param currentReader Target reader
         */
        getSelectedText(currentReader) {
          var _a;
          if (!currentReader) {
            return "";
          }
          let textArea = (_a = currentReader._iframeWindow) === null || _a === void 0 ? void 0 : _a.document.querySelectorAll("textarea");
          if (!textArea) {
            return "";
          }
          for (let i = 0; i < textArea.length; i++) {
            if (textArea[i].style.zIndex === "-1" && textArea[i].style["width"] === "0px") {
              return textArea[i].value.replace(/(^\s*)|(\s*$)/g, "");
            }
          }
          return "";
        }
      };
      exports.ReaderTool = ReaderTool;
    }
  });

  // node_modules/zotero-plugin-toolkit/dist/tools/extraField.js
  var require_extraField = __commonJS({
    "node_modules/zotero-plugin-toolkit/dist/tools/extraField.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.ExtraFieldTool = void 0;
      var basic_1 = require_basic();
      var ExtraFieldTool = class extends basic_1.BasicTool {
        /**
         * Get all extra fields
         * @param item
         */
        getExtraFields(item, backend = "custom") {
          const extraFiledRaw = item.getField("extra");
          if (backend === "default") {
            return this.getGlobal("Zotero").Utilities.Internal.extractExtraFields(extraFiledRaw).fields;
          } else {
            const map = /* @__PURE__ */ new Map();
            extraFiledRaw.split("\n").forEach((line) => {
              const split = line.split(": ");
              if (split.length >= 2 && split[0]) {
                map.set(split[0], split.slice(1).join(": "));
              }
            });
            return map;
          }
        }
        /**
         * Get extra field value by key. If it does not exists, return undefined.
         * @param item
         * @param key
         */
        getExtraField(item, key) {
          const fields = this.getExtraFields(item);
          return fields.get(key);
        }
        /**
         * Replace extra field of an item.
         * @param item
         * @param fields
         */
        async replaceExtraFields(item, fields) {
          let kvs = [];
          fields.forEach((v, k) => {
            kvs.push(`${k}: ${v}`);
          });
          item.setField("extra", kvs.join("\n"));
          await item.saveTx();
        }
        /**
         * Set an key-value pair to the item's extra field
         * @param item
         * @param key
         * @param value
         */
        async setExtraField(item, key, value) {
          const fields = this.getExtraFields(item);
          fields.set(key, value);
          await this.replaceExtraFields(item, fields);
        }
      };
      exports.ExtraFieldTool = ExtraFieldTool;
    }
  });

  // node_modules/zotero-plugin-toolkit/dist/managers/fieldHook.js
  var require_fieldHook = __commonJS({
    "node_modules/zotero-plugin-toolkit/dist/managers/fieldHook.js"(exports) {
      "use strict";
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.FieldHookManager = void 0;
      var basic_1 = require_basic();
      var toolkitGlobal_1 = __importDefault(require_toolkitGlobal());
      var FieldHookManager = class extends basic_1.ManagerTool {
        constructor(base) {
          super(base);
          this.localCache = [];
          this.initializeGlobal();
        }
        register(type, field, hook) {
          let hooks = this.getHooksFactory(type);
          if (!hooks) {
            return;
          }
          if (field in hooks) {
            this.log(`[WARNING] ${type}.${field} overwrites an existing hook.`);
          }
          hooks[field] = hook;
          this.localCache.push({ type, field });
        }
        unregister(type, field) {
          let hooks = this.getHooksFactory(type);
          if (hooks) {
            delete hooks[field];
          }
          const idx = this.localCache.findIndex(({ type: cacheType }) => cacheType === type);
          if (idx > -1) {
            this.localCache.splice(idx, 1);
          }
        }
        unregisterAll() {
          [...this.localCache].forEach((cache) => {
            this.unregister(cache.type, cache.field);
          });
        }
        getHooksFactory(type) {
          switch (type) {
            case "getField":
              const globalItemTree = toolkitGlobal_1.default.getInstance().itemTree;
              const deprecatedHooks = globalItemTree.fieldHooks;
              if (deprecatedHooks && deprecatedHooks !== this.globalCache.getFieldHooks) {
                Object.assign(this.globalCache.getFieldHooks, deprecatedHooks);
                globalItemTree.fieldHooks = this.globalCache.getFieldHooks;
              }
              return this.globalCache.getFieldHooks;
              break;
            case "setField":
              return this.globalCache.setFieldHooks;
              break;
            case "isFieldOfBase":
              return this.globalCache.isFieldOfBaseHooks;
              break;
            default:
              break;
          }
        }
        initializeGlobal() {
          const Zotero2 = this.getGlobal("Zotero");
          const globalCache = this.globalCache = toolkitGlobal_1.default.getInstance().fieldHooks;
          if (!this.globalCache._ready) {
            this.globalCache._ready = true;
            this.patch(Zotero2.Item.prototype, "getField", this.patchSign, (original) => function(field, unformatted, includeBaseMapped) {
              const originalThis = this;
              if (Object.keys(globalCache.getFieldHooks).includes(field)) {
                try {
                  const hook = globalCache.getFieldHooks[field];
                  return hook(field, unformatted, includeBaseMapped, originalThis, original.bind(originalThis));
                } catch (e) {
                  return field + String(e);
                }
              }
              return original.apply(originalThis, arguments);
            });
            this.patch(Zotero2.Item.prototype, "setField", this.patchSign, (original) => function(field, value, loadIn) {
              const originalThis = this;
              if (Object.keys(globalCache.setFieldHooks).includes(field)) {
                try {
                  const hook = globalCache.setFieldHooks[field];
                  return hook(field, value, loadIn, originalThis, original.bind(originalThis));
                } catch (e) {
                  return field + String(e);
                }
              }
              return original.apply(originalThis, arguments);
            });
            this.patch(Zotero2.ItemFields, "isFieldOfBase", this.patchSign, (original) => function(field, baseField) {
              const originalThis = this;
              if (Object.keys(globalCache.isFieldOfBaseHooks).includes(field)) {
                try {
                  const hook = globalCache.isFieldOfBaseHooks[field];
                  return hook(field, baseField, original.bind(originalThis));
                } catch (e) {
                  return false;
                }
              }
              return original.apply(originalThis, arguments);
            });
          }
        }
      };
      exports.FieldHookManager = FieldHookManager;
    }
  });

  // node_modules/zotero-plugin-toolkit/dist/managers/itemTree.js
  var require_itemTree = __commonJS({
    "node_modules/zotero-plugin-toolkit/dist/managers/itemTree.js"(exports) {
      "use strict";
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.ItemTreeManager = void 0;
      var basic_1 = require_basic();
      var fieldHook_1 = require_fieldHook();
      var toolkitGlobal_1 = __importDefault(require_toolkitGlobal());
      var ItemTreeManager = class extends basic_1.ManagerTool {
        /**
         * Initialize Zotero._ItemTreeExtraColumnsGlobal if it doesn't exist.
         *
         * New columns and hooks are stored there.
         *
         * Then patch `require("zotero/itemTree").getColumns` and `Zotero.Item.getField`
         */
        constructor(base) {
          super(base);
          this.localColumnCache = [];
          this.localRenderCellCache = [];
          this.fieldHooks = new fieldHook_1.FieldHookManager(base);
          this.initializationLock = this.getGlobal("Zotero").Promise.defer();
          this.initializeGlobal();
        }
        unregisterAll() {
          [...this.localColumnCache].forEach((key) => this.unregister(key, { skipGetField: true }));
          [...this.localRenderCellCache].forEach(this.removeRenderCellHook.bind(this));
          this.fieldHooks.unregisterAll();
        }
        /**
         * Register a new column. Don't forget to call `unregister` on plugin exit.
         * @param key Column dataKey
         * @param label Column display label
         * @param getFieldHook Called when loading cell content.
         * If you registered the getField hook somewhere else (in ItemBox or FieldHooks), leave it undefined.
         * @param options See zotero source code:chrome/content/zotero/itemTreeColumns.jsx
         * @param options.renderCellHook Called when rendering cell. This will override
         *
         * @example
         * ```ts
         * const itemTree = new ItemTreeTool();
         * await itemTree.register(
         *   "test",
         *   "new column",
         *   (
         *     field: string,
         *     unformatted: boolean,
         *     includeBaseMapped: boolean,
         *     item: Zotero.Item
         *   ) => {
         *     return field + String(item.id);
         *   },
         *   {
         *     iconPath: "chrome://zotero/skin/cross.png",
         *   }
         * );
         * ```
         */
        async register(key, label, getFieldHook, options = {}) {
          await this.initializationLock.promise;
          if (this.globalCache.columns.map((_c) => _c.dataKey).includes(key)) {
            this.log(`ItemTreeTool: ${key} is already registered.`);
            return;
          }
          const column = {
            dataKey: key,
            label,
            iconLabel: options.iconPath ? this.createIconLabel({
              iconPath: options.iconPath,
              name: label
            }) : void 0,
            zoteroPersist: options.zoteroPersist || /* @__PURE__ */ new Set(["width", "ordinal", "hidden", "sortActive", "sortDirection"]),
            defaultIn: options.defaultIn,
            disabledIn: options.disabledIn,
            defaultSort: options.defaultSort,
            flex: typeof options.flex === "undefined" ? 1 : options.flex,
            width: options.width,
            fixedWidth: options.fixedWidth,
            staticWidth: options.staticWidth,
            minWidth: options.minWidth,
            ignoreInColumnPicker: options.ignoreInColumnPicker,
            submenu: options.submenu
          };
          if (getFieldHook) {
            this.fieldHooks.register("getField", key, getFieldHook);
          }
          if (options.renderCellHook) {
            await this.addRenderCellHook(key, options.renderCellHook);
          }
          this.globalCache.columns.push(column);
          this.localColumnCache.push(column.dataKey);
          await this.refresh();
        }
        /**
         * Unregister an extra column. Call it on plugin exit.
         * @param key Column dataKey, should be same as the one used in `register`
         * @param options.skipGetField skip unregister of getField hook.
         * This is useful when the hook is not initialized by this instance
         */
        async unregister(key, options = {}) {
          const Zotero2 = this.getGlobal("Zotero");
          await this.initializationLock.promise;
          let persisted = Zotero2.Prefs.get("pane.persist");
          const persistedJSON = JSON.parse(persisted);
          delete persistedJSON[key];
          Zotero2.Prefs.set("pane.persist", JSON.stringify(persistedJSON));
          const idx = this.globalCache.columns.map((_c) => _c.dataKey).indexOf(key);
          if (idx >= 0) {
            this.globalCache.columns.splice(idx, 1);
          }
          if (!options.skipGetField) {
            this.fieldHooks.unregister("getField", key);
          }
          this.removeRenderCellHook(key);
          await this.refresh();
          const localKeyIdx = this.localColumnCache.indexOf(key);
          if (localKeyIdx >= 0) {
            this.localColumnCache.splice(localKeyIdx, 1);
          }
        }
        /**
         * Add a patch hook for `_renderCell`, which is called when cell is rendered.
         *
         * This also works for Zotero's built-in cells.
         * @remarks
         * Don't call it manually unless you understand what you are doing.
         * @param dataKey Cell `dataKey`, e.g. 'title'
         * @param renderCellHook patch hook
         */
        async addRenderCellHook(dataKey, renderCellHook) {
          await this.initializationLock.promise;
          if (dataKey in this.globalCache.renderCellHooks) {
            this.log("[WARNING] ItemTreeTool.addRenderCellHook overwrites an existing hook:", dataKey);
          }
          this.globalCache.renderCellHooks[dataKey] = renderCellHook;
          this.localRenderCellCache.push(dataKey);
        }
        /**
         * Remove a patch hook by `dataKey`.
         */
        async removeRenderCellHook(dataKey) {
          delete this.globalCache.renderCellHooks[dataKey];
          const idx = this.localRenderCellCache.indexOf(dataKey);
          if (idx >= 0) {
            this.localRenderCellCache.splice(idx, 1);
          }
          await this.refresh();
        }
        /**
         * Do initializations. Called in constructor to be async
         */
        async initializeGlobal() {
          const Zotero2 = this.getGlobal("Zotero");
          await Zotero2.uiReadyPromise;
          const window2 = this.getGlobal("window");
          const globalCache = this.globalCache = toolkitGlobal_1.default.getInstance().itemTree;
          if (!globalCache._ready) {
            globalCache._ready = true;
            const itemTree = window2.require("zotero/itemTree");
            this.patch(itemTree.prototype, "getColumns", this.patchSign, (original) => function() {
              const columns = original.apply(this, arguments);
              const insertAfter = columns.findIndex((column) => column.dataKey === "title");
              columns.splice(insertAfter + 1, 0, ...globalCache.columns);
              return columns;
            });
            this.patch(itemTree.prototype, "_renderCell", this.patchSign, (original) => function(index, data, column) {
              if (!(column.dataKey in globalCache.renderCellHooks)) {
                return original.apply(this, arguments);
              }
              const hook = globalCache.renderCellHooks[column.dataKey];
              const elem = hook(index, data, column, original.bind(this));
              if (elem.classList.contains("cell")) {
                return elem;
              }
              const span = window2.document.createElementNS("http://www.w3.org/1999/xhtml", "span");
              span.classList.add("cell", column.dataKey, `${column.dataKey}-item-tree-main-default`);
              if (column.fixedWidth) {
                span.classList.add("fixed-width");
              }
              span.appendChild(elem);
              return span;
            });
          }
          this.initializationLock.resolve();
        }
        /**
         * Create a React Icon element
         * @param props
         */
        createIconLabel(props) {
          const _React = window.require("react");
          return _React.createElement("span", null, _React.createElement("img", {
            src: props.iconPath,
            height: "10px",
            width: "9px",
            style: {
              "margin-left": "6px"
            }
          }), " ", props.name);
        }
        /**
         * Refresh itemView. You don't need to call it manually.
         */
        async refresh() {
          var _a, _b;
          await this.initializationLock.promise;
          const ZoteroPane2 = this.getGlobal("ZoteroPane");
          ZoteroPane2.itemsView._columnsId = null;
          const virtualizedTable = (_a = ZoteroPane2.itemsView.tree) === null || _a === void 0 ? void 0 : _a._columns;
          if (!virtualizedTable) {
            this.log("ItemTree is still loading. Refresh skipped.");
            return;
          }
          (_b = document.querySelector(`.${virtualizedTable._styleKey}`)) === null || _b === void 0 ? void 0 : _b.remove();
          await ZoteroPane2.itemsView.refreshAndMaintainSelection();
          ZoteroPane2.itemsView.tree._columns = new virtualizedTable.__proto__.constructor(ZoteroPane2.itemsView.tree);
          await ZoteroPane2.itemsView.refreshAndMaintainSelection();
        }
      };
      exports.ItemTreeManager = ItemTreeManager;
    }
  });

  // node_modules/zotero-plugin-toolkit/dist/managers/prompt.js
  var require_prompt = __commonJS({
    "node_modules/zotero-plugin-toolkit/dist/managers/prompt.js"(exports) {
      "use strict";
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.PromptManager = exports.Prompt = void 0;
      var basic_1 = require_basic();
      var basic_2 = require_basic();
      var ui_1 = require_ui();
      var toolkitGlobal_1 = __importDefault(require_toolkitGlobal());
      var Prompt = class {
        /**
         * Initialize `Prompt` but do not create UI.
         */
        constructor() {
          this.lastInputText = "";
          this.defaultText = {
            placeholder: "Select a command...",
            empty: "No commands found."
          };
          this.maxLineNum = 12;
          this.maxSuggestionNum = 100;
          this.commands = [];
          this.base = new basic_1.BasicTool();
          this.ui = new ui_1.UITool();
          this.document = this.base.getGlobal("document");
          this.initializeUI();
        }
        /**
         * Initialize `Prompt` UI and then bind events on it.
         */
        initializeUI() {
          this.addStyle();
          this.createHTML();
          this.initInputEvents();
          this.registerShortcut();
        }
        createHTML() {
          this.promptNode = this.ui.createElement(this.document, "div", {
            styles: {
              display: "none"
            },
            children: [
              {
                tag: "div",
                styles: {
                  position: "fixed",
                  left: "0",
                  top: "0",
                  backgroundColor: "rgba(220, 220, 220, 0.4)",
                  width: "100%",
                  height: "100%",
                  opacity: "0.5"
                },
                listeners: [
                  {
                    type: "click",
                    listener: () => {
                      this.promptNode.style.display = "none";
                    }
                  }
                ]
              }
            ]
          });
          this.promptNode.appendChild(this.ui.createElement(this.document, "div", {
            id: `zotero-plugin-toolkit-prompt`,
            classList: ["prompt-container"],
            children: [
              {
                tag: "div",
                classList: ["input-container"],
                children: [
                  {
                    tag: "input",
                    classList: ["prompt-input"],
                    attributes: {
                      type: "text",
                      placeholder: this.defaultText.placeholder
                    }
                  },
                  {
                    tag: "div",
                    classList: ["cta"]
                  }
                ]
              },
              {
                tag: "div",
                classList: ["commands-containers"]
              },
              {
                tag: "div",
                classList: ["instructions"],
                children: [
                  {
                    tag: "div",
                    classList: ["instruction"],
                    children: [
                      {
                        tag: "span",
                        classList: ["key"],
                        properties: {
                          innerText: "\u2191\u2193"
                        }
                      },
                      {
                        tag: "span",
                        properties: {
                          innerText: "to navigate"
                        }
                      }
                    ]
                  },
                  {
                    tag: "div",
                    classList: ["instruction"],
                    children: [
                      {
                        tag: "span",
                        classList: ["key"],
                        properties: {
                          innerText: "enter"
                        }
                      },
                      {
                        tag: "span",
                        properties: {
                          innerText: "to trigger"
                        }
                      }
                    ]
                  },
                  {
                    tag: "div",
                    classList: ["instruction"],
                    children: [
                      {
                        tag: "span",
                        classList: ["key"],
                        properties: {
                          innerText: "esc"
                        }
                      },
                      {
                        tag: "span",
                        properties: {
                          innerText: "to exit"
                        }
                      }
                    ]
                  }
                ]
              }
            ]
          }));
          this.inputNode = this.promptNode.querySelector("input");
          this.document.documentElement.appendChild(this.promptNode);
        }
        /**
         * Show commands in a new `commandsContainer`
         * All other `commandsContainer` is hidden
         * @param commands Command[]
         * @param clear remove all `commandsContainer` if true
         */
        showCommands(commands, clear = false) {
          if (clear) {
            this.promptNode.querySelectorAll(".commands-container").forEach((e) => e.remove());
          }
          this.inputNode.placeholder = this.defaultText.placeholder;
          const commandsContainer = this.createCommandsContainer();
          for (let command of commands) {
            if (!command.name || command.when && !command.when()) {
              continue;
            }
            commandsContainer.appendChild(this.createCommandNode(command));
          }
        }
        /**
         * Create a `commandsContainer` div element, append to `commandsContainer` and hide others.
         * @returns commandsNode
         */
        createCommandsContainer() {
          const commandsContainer = this.ui.createElement(this.document, "div", {
            classList: ["commands-container"]
          });
          this.promptNode.querySelectorAll(".commands-container").forEach((e) => {
            e.style.display = "none";
          });
          this.promptNode.querySelector(".commands-containers").appendChild(commandsContainer);
          return commandsContainer;
        }
        /**
         * Return current displayed `commandsContainer`
         * @returns
         */
        getCommandsContainer() {
          return [...this.promptNode.querySelectorAll(".commands-container")].find((e) => {
            return e.style.display != "none";
          });
        }
        /**
         * Create a command item for `Prompt` UI.
         * @param command
         * @returns
         */
        createCommandNode(command) {
          const commandNode = this.ui.createElement(this.document, "div", {
            classList: ["command"],
            children: [
              {
                tag: "div",
                classList: ["content"],
                children: [
                  {
                    tag: "div",
                    classList: ["name"],
                    children: [
                      {
                        tag: "span",
                        properties: {
                          innerText: command.name
                        }
                      }
                    ]
                  },
                  {
                    tag: "div",
                    classList: ["aux"],
                    children: command.label ? [
                      {
                        tag: "span",
                        classList: ["label"],
                        properties: {
                          innerText: command.label
                        }
                      }
                    ] : []
                  }
                ]
              }
            ],
            listeners: [
              {
                type: "mousemove",
                listener: () => {
                  this.selectItem(commandNode);
                }
              },
              {
                type: "click",
                listener: async () => {
                  await this.execCallback(command.callback);
                }
              }
            ]
          });
          commandNode.command = command;
          return commandNode;
        }
        /**
         * Called when `enter` key is pressed.
         */
        trigger() {
          [...this.promptNode.querySelectorAll(".commands-container")].find((e) => e.style.display != "none").querySelector(".selected").click();
        }
        /**
         * Called when `escape` key is pressed.
         */
        exit() {
          this.inputNode.placeholder = this.defaultText.placeholder;
          if (this.promptNode.querySelectorAll(".commands-containers .commands-container").length >= 2) {
            this.promptNode.querySelector(".commands-container:last-child").remove();
            const commandsContainer = this.promptNode.querySelector(".commands-container:last-child");
            commandsContainer.style.display = "";
            commandsContainer.querySelectorAll(".commands").forEach((e) => e.style.display = "flex");
            this.inputNode.focus();
          } else {
            this.promptNode.style.display = "none";
          }
        }
        async execCallback(callback) {
          if (Array.isArray(callback)) {
            this.showCommands(callback);
          } else {
            await callback(this);
          }
        }
        /**
         * Match suggestions for user's entered text.
         */
        async showSuggestions(inputText) {
          var _w = /[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-.\/:;<=>?@\[\]^_`{|}~]/, jw = /\s/, Ww = /[\u0F00-\u0FFF\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/;
          function Yw(e2, t, n, i) {
            if (0 === e2.length)
              return 0;
            var r = 0;
            r -= Math.max(0, e2.length - 1), r -= i / 10;
            var o = e2[0][0];
            return r -= (e2[e2.length - 1][1] - o + 1 - t) / 100, r -= o / 1e3, r -= n / 1e4;
          }
          function $w(e2, t, n, i) {
            if (0 === e2.length)
              return null;
            for (var r = n.toLowerCase(), o = 0, a = 0, s = [], l = 0; l < e2.length; l++) {
              var c = e2[l], u = r.indexOf(c, a);
              if (-1 === u)
                return null;
              var h = n.charAt(u);
              if (u > 0 && !_w.test(h) && !Ww.test(h)) {
                var p = n.charAt(u - 1);
                if (h.toLowerCase() !== h && p.toLowerCase() !== p || h.toUpperCase() !== h && !_w.test(p) && !jw.test(p) && !Ww.test(p))
                  if (i) {
                    if (u !== a) {
                      a += c.length, l--;
                      continue;
                    }
                  } else
                    o += 1;
              }
              if (0 === s.length)
                s.push([u, u + c.length]);
              else {
                var d = s[s.length - 1];
                d[1] < u ? s.push([u, u + c.length]) : d[1] = u + c.length;
              }
              a = u + c.length;
            }
            return {
              matches: s,
              score: Yw(s, t.length, r.length, o)
            };
          }
          function Gw(e2) {
            for (var t = e2.toLowerCase(), n = [], i = 0, r = 0; r < t.length; r++) {
              var o = t.charAt(r);
              jw.test(o) ? (i !== r && n.push(t.substring(i, r)), i = r + 1) : (_w.test(o) || Ww.test(o)) && (i !== r && n.push(t.substring(i, r)), n.push(o), i = r + 1);
            }
            return i !== t.length && n.push(t.substring(i, t.length)), {
              query: e2,
              tokens: n,
              fuzzy: t.split("")
            };
          }
          function Xw(e2, t) {
            if ("" === e2.query)
              return {
                score: 0,
                matches: []
              };
            var n = $w(e2.tokens, e2.query, t, false);
            return n || $w(e2.fuzzy, e2.query, t, true);
          }
          var e = Gw(inputText);
          let container = this.getCommandsContainer();
          if (container.classList.contains("suggestions")) {
            this.exit();
          }
          if (inputText.trim() == "") {
            return true;
          }
          let suggestions = [];
          this.getCommandsContainer().querySelectorAll(".command").forEach((commandNode) => {
            let spanNode = commandNode.querySelector(".name span");
            let spanText = spanNode.innerText;
            let res = Xw(e, spanText);
            if (res) {
              commandNode = this.createCommandNode(commandNode.command);
              let spanHTML = "";
              let i = 0;
              for (let j = 0; j < res.matches.length; j++) {
                let [start, end] = res.matches[j];
                if (start > i) {
                  spanHTML += spanText.slice(i, start);
                }
                spanHTML += `<span class="highlight">${spanText.slice(start, end)}</span>`;
                i = end;
              }
              if (i < spanText.length) {
                spanHTML += spanText.slice(i, spanText.length);
              }
              commandNode.querySelector(".name span").innerHTML = spanHTML;
              suggestions.push({ score: res.score, commandNode });
            }
          });
          if (suggestions.length > 0) {
            suggestions.sort((a, b) => b.score - a.score).slice(this.maxSuggestionNum);
            container = this.createCommandsContainer();
            container.classList.add("suggestions");
            suggestions.forEach((suggestion) => {
              container.appendChild(suggestion.commandNode);
            });
            return true;
          } else {
            const anonymousCommand = this.commands.find((c) => !c.name && (!c.when || c.when()));
            if (anonymousCommand) {
              await this.execCallback(anonymousCommand.callback);
            } else {
              this.showTip(this.defaultText.empty);
            }
            return false;
          }
        }
        /**
         * Bind events of pressing `keydown` and `keyup` key.
         */
        initInputEvents() {
          this.promptNode.addEventListener("keydown", (event) => {
            if (["ArrowUp", "ArrowDown"].indexOf(event.key) != -1) {
              event.preventDefault();
              let selectedIndex;
              let allItems = [
                ...this.getCommandsContainer().querySelectorAll(".command")
              ].filter((e) => e.style.display != "none");
              selectedIndex = allItems.findIndex((e) => e.classList.contains("selected"));
              if (selectedIndex != -1) {
                allItems[selectedIndex].classList.remove("selected");
                selectedIndex += event.key == "ArrowUp" ? -1 : 1;
              } else {
                if (event.key == "ArrowUp") {
                  selectedIndex = allItems.length - 1;
                } else {
                  selectedIndex = 0;
                }
              }
              if (selectedIndex == -1) {
                selectedIndex = allItems.length - 1;
              } else if (selectedIndex == allItems.length) {
                selectedIndex = 0;
              }
              allItems[selectedIndex].classList.add("selected");
              let commandsContainer = this.getCommandsContainer();
              commandsContainer.scrollTo(0, commandsContainer.querySelector(".selected").offsetTop - commandsContainer.offsetHeight + 7.5);
              allItems[selectedIndex].classList.add("selected");
            }
          });
          this.promptNode.addEventListener("keyup", async (event) => {
            if (event.key == "Enter") {
              this.trigger();
            } else if (event.key == "Escape") {
              if (this.inputNode.value.length > 0) {
                this.inputNode.value = "";
              } else {
                this.exit();
              }
            } else if (["ArrowUp", "ArrowDown"].indexOf(event.key) != -1) {
              return;
            }
            const currentInputText = this.inputNode.value;
            if (currentInputText == this.lastInputText) {
              return;
            }
            this.lastInputText = currentInputText;
            window.setTimeout(async () => {
              await this.showSuggestions(currentInputText);
            });
          });
        }
        /**
         * Create a commandsContainer and display a text
         */
        showTip(text) {
          const tipNode = this.ui.createElement(this.document, "div", {
            classList: ["tip"],
            properties: {
              innerText: text
            }
          });
          let container = this.createCommandsContainer();
          container.classList.add("suggestions");
          container.appendChild(tipNode);
          return tipNode;
        }
        /**
         * Mark the selected item with class `selected`.
         * @param item HTMLDivElement
         */
        selectItem(item) {
          this.getCommandsContainer().querySelectorAll(".command").forEach((e) => e.classList.remove("selected"));
          item.classList.add("selected");
        }
        addStyle() {
          const style = this.ui.createElement(this.document, "style", {
            namespace: "html",
            id: "prompt-style"
          });
          style.innerText = `
      .prompt-container * {
        box-sizing: border-box;
      }
      .prompt-container {
        ---radius---: 10px;
        position: fixed;
        left: 25%;
        top: 10%;
        width: 50%;
        border-radius: var(---radius---);
        border: 1px solid #bdbdbd;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background-color: white;
        font-size: 18px;
        box-shadow: 0px 1.8px 7.3px rgba(0, 0, 0, 0.071),
                    0px 6.3px 24.7px rgba(0, 0, 0, 0.112),
                    0px 30px 90px rgba(0, 0, 0, 0.2);
        font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Microsoft YaHei Light", sans-serif;
      }
      
      /* input */
      .prompt-container .input-container  {
        width: 100%;
      }
      
      .input-container input {
        width: 100%;
        height: 40px;
        padding: 24px;
        border-radius: 50%;
        border: none;
        outline: none;
        font-size: 18px;
      }
      
      .input-container .cta {
        border-bottom: 1px solid #f6f6f6;  
        margin: 5px auto;
      }
      
      /* results */
      .commands-containers {
        width: 100%;
        height: 100%;
      }
      .commands-container {
        max-height: calc(${this.maxLineNum} * 35.5px);
        width: calc(100% - 12px);
        margin-left: 12px;
        margin-right: 0%;
        overflow-y: auto;
        overflow-x: hidden;
      }
      
      .commands-container .command {
        display: flex;
        align-content: baseline;
        justify-content: space-between;
        border-radius: 5px;
        padding: 6px 12px;
        margin-right: 12px;
        margin-top: 2px;
        margin-bottom: 2px;
      }
      .commands-container .command .content {
        display: flex;
        width: 100%;
        justify-content: space-between;
        flex-direction: row;
        overflow: hidden;
      }
      .commands-container .command .content .name {
        white-space: nowrap; 
        text-overflow: ellipsis;
        overflow: hidden;
      }
      .commands-container .command .content .aux {
        display: flex;
        align-items: center;
        align-self: center;
        flex-shrink: 0;
      }
      
      .commands-container .command .content .aux .label {
        font-size: 15px;
        color: #5a5a5a;
        padding: 2px 6px;
        background-color: #fafafa;
        border-radius: 5px;
      }
      
      .commands-container .selected {
          background-color: rgba(0, 0, 0, 0.075);
      }

      .commands-container .highlight {
        font-weight: bold;
      }

      .tip {
        color: #5a5a5a;
        text-align: center;
        padding: 12px 12px;
        font-size: 18px;
      }
      
      .current-value {
        background-color: #a7b8c1;
        color: white;
        border-radius: 5px;
        padding: 0 5px;
        margin-left: 10px;
        font-size: 14px;
        vertical-align: middle;
        letter-spacing: 0.05em;
      }

      /* instructions */
      .instructions {
        display: flex;
        align-content: center;
        justify-content: center;
        font-size: 15px;
        color: rgba(0, 0, 0, 0.4);
        height: 2.5em;
        width: 100%;
        border-top: 1px solid #f6f6f6;
        margin-top: 5px;
      }
      
      .instructions .instruction {
        margin: auto .5em;  
      }
      
      .instructions .key {
        margin-right: .2em;
        font-weight: 600;
      }
    `;
          this.document.documentElement.appendChild(style);
        }
        registerShortcut() {
          this.document.addEventListener("keydown", (event) => {
            if (event.shiftKey && event.key.toLowerCase() == "p") {
              if (event.originalTarget.isContentEditable || "value" in event.originalTarget || this.commands.length == 0) {
                return;
              }
              event.preventDefault();
              event.stopPropagation();
              if (this.promptNode.style.display == "none") {
                this.promptNode.style.display = "flex";
                if (this.promptNode.querySelectorAll(".commands-container").length == 1) {
                  this.showCommands(this.commands, true);
                }
                this.promptNode.focus();
                this.inputNode.focus();
              } else {
                this.promptNode.style.display = "none";
              }
            }
          }, true);
        }
      };
      exports.Prompt = Prompt;
      var PromptManager = class extends basic_2.ManagerTool {
        constructor(base) {
          super(base);
          this.commands = [];
          const globalCache = toolkitGlobal_1.default.getInstance().prompt;
          if (!globalCache._ready) {
            globalCache._ready = true;
            globalCache.instance = new Prompt();
          }
          this.prompt = globalCache.instance;
        }
        /**
         * Register commands. Don't forget to call `unregister` on plugin exit.
         * @param commands Command[]
         * @example
         * ```ts
         * let getReader = () => {
         *   return BasicTool.getZotero().Reader.getByTabID(
         *     (Zotero.getMainWindow().Zotero_Tabs).selectedID
         *   )
         * }
         *
         * register([
         *   {
         *     name: "Split Horizontally",
         *     label: "Zotero",
         *     when: () => getReader() as boolean,
         *     callback: (prompt: Prompt) => getReader().menuCmd("splitHorizontally")
         *   },
         *   {
         *     name: "Split Vertically",
         *     label: "Zotero",
         *     when: () => getReader() as boolean,
         *     callback: (prompt: Prompt) => getReader().menuCmd("splitVertically")
         *   }
         * ])
         * ```
         */
        register(commands) {
          commands.forEach((c) => {
            var _a;
            return (_a = c.id) !== null && _a !== void 0 ? _a : c.id = c.name;
          });
          this.prompt.commands = [...this.prompt.commands, ...commands];
          this.commands = [...this.commands, ...commands];
          this.prompt.showCommands(this.commands, true);
        }
        /**
         * You can delete a command registed before by its name.
         * @remarks
         * There is a premise here that the names of all commands registered by a single plugin are not duplicated.
         * @param id Command.name
         */
        unregister(id) {
          const command = this.commands.find((c) => c.id == id);
          this.prompt.commands = this.prompt.commands.filter((c) => {
            return JSON.stringify(command) != JSON.stringify(c);
          });
          this.commands = this.commands.filter((c) => c.id != id);
        }
        /**
         * Call `unregisterAll` on plugin exit.
         */
        unregisterAll() {
          this.prompt.commands = this.prompt.commands.filter((c) => {
            return this.commands.find((_c) => {
              JSON.stringify(_c) != JSON.stringify(c);
            });
          });
          this.commands = [];
        }
      };
      exports.PromptManager = PromptManager;
    }
  });

  // node_modules/zotero-plugin-toolkit/dist/managers/libraryTabPanel.js
  var require_libraryTabPanel = __commonJS({
    "node_modules/zotero-plugin-toolkit/dist/managers/libraryTabPanel.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.LibraryTabPanelManager = void 0;
      var ui_1 = require_ui();
      var basic_1 = require_basic();
      var LibraryTabPanelManager = class extends basic_1.ManagerTool {
        constructor(base) {
          super(base);
          this.ui = new ui_1.UITool(this);
          this.libraryTabCache = {
            optionsList: []
          };
        }
        /**
         * Register a tabpanel in library.
         * @remarks
         * If you don't want to remove the tab & panel in runtime, `unregisterLibraryTabPanel` is not a must.
         *
         * The elements wiil be removed by `removeAddonElements`.
         * @param tabLabel Label of panel tab.
         * @param renderPanelHook Called when panel is ready. Add elements to the panel.
         * @param options Other optional parameters.
         * @param options.tabId ID of panel tab. Also used as unregister query. If not set, generate a random one.
         * @param options.panelId ID of panel container (XUL.TabPanel). If not set, generate a random one.
         * @param options.targetIndex Index of the inserted tab. Default the end of tabs.
         * @param options.selectPanel If the panel should be selected immediately.
         * @returns tabId. Use it for unregister.
         * @example
         * Register an extra library tabpanel into index 1.
         * ```ts
         * const libPaneManager = new LibraryTabPanelManager();
         * const libTabId = libPaneManager.registerLibraryTabPanel(
         *   "test",
         *   (panel: XUL.Element, win: Window) => {
         *     const elem = ui.creatElementsFromJSON(
         *       win.document,
         *       {
         *         tag: "vbox",
         *         namespace: "xul",
         *         subElementOptions: [
         *           {
         *             tag: "h2",
         *             directAttributes: {
         *               innerText: "Hello World!",
         *             },
         *           },
         *           {
         *             tag: "label",
         *             namespace: "xul",
         *             directAttributes: {
         *               value: "This is a library tab.",
         *             },
         *           },
         *           {
         *             tag: "button",
         *             directAttributes: {
         *               innerText: "Unregister",
         *             },
         *             listeners: [
         *               {
         *                 type: "click",
         *                 listener: () => {
         *                   ui.unregisterLibraryTabPanel(
         *                     libTabId
         *                   );
         *                 },
         *               },
         *             ],
         *           },
         *         ],
         *       }
         *     );
         *     panel.append(elem);
         *   },
         *   {
         *     targetIndex: 1,
         *   }
         * );
         * ```
         */
        register(tabLabel, renderPanelHook, options) {
          options = options || {
            tabId: void 0,
            panelId: void 0,
            targetIndex: -1,
            selectPanel: false
          };
          const window2 = this.getGlobal("window");
          const tabbox = window2.document.querySelector("#zotero-view-tabbox");
          const randomId = `${Zotero.Utilities.randomString()}-${(/* @__PURE__ */ new Date()).getTime()}`;
          const tabId = options.tabId || `toolkit-readertab-${randomId}`;
          const panelId = options.panelId || `toolkit-readertabpanel-${randomId}`;
          const tab = this.ui.createElement(window2.document, "tab", {
            id: tabId,
            classList: [`toolkit-ui-tabs-${tabId}`],
            attributes: {
              label: tabLabel
            },
            ignoreIfExists: true
          });
          const tabpanel = this.ui.createElement(window2.document, "tabpanel", {
            id: panelId,
            classList: [`toolkit-ui-tabs-${tabId}`],
            ignoreIfExists: true
          });
          const tabs = tabbox.querySelector("tabs");
          const tabpanels = tabbox.querySelector("tabpanels");
          const targetIndex = typeof options.targetIndex === "number" ? options.targetIndex : -1;
          if (targetIndex >= 0) {
            tabs.querySelectorAll("tab")[targetIndex].before(tab);
            tabpanels.querySelectorAll("tabpanel")[targetIndex].before(tabpanel);
          } else {
            tabs.appendChild(tab);
            tabpanels.appendChild(tabpanel);
          }
          if (options.selectPanel) {
            tabbox.selectedTab = tab;
          }
          this.libraryTabCache.optionsList.push({
            tabId,
            tabLabel,
            panelId,
            renderPanelHook,
            targetIndex,
            selectPanel: options.selectPanel
          });
          renderPanelHook(tabpanel, window2);
          return tabId;
        }
        /**
         * Unregister the library tabpanel.
         * @param tabId tab id
         */
        unregister(tabId) {
          const idx = this.libraryTabCache.optionsList.findIndex((v) => v.tabId === tabId);
          if (idx >= 0) {
            this.libraryTabCache.optionsList.splice(idx, 1);
          }
          this.removeTabPanel(tabId);
        }
        /**
         * Unregister all library tabpanel.
         */
        unregisterAll() {
          const tabIds = this.libraryTabCache.optionsList.map((options) => options.tabId);
          tabIds.forEach(this.unregister.bind(this));
        }
        removeTabPanel(tabId) {
          const doc = this.getGlobal("document");
          Array.prototype.forEach.call(doc.querySelectorAll(`.toolkit-ui-tabs-${tabId}`), (e) => {
            e.remove();
          });
        }
      };
      exports.LibraryTabPanelManager = LibraryTabPanelManager;
    }
  });

  // node_modules/zotero-plugin-toolkit/dist/managers/readerTabPanel.js
  var require_readerTabPanel = __commonJS({
    "node_modules/zotero-plugin-toolkit/dist/managers/readerTabPanel.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.ReaderTabPanelManager = void 0;
      var ui_1 = require_ui();
      var reader_1 = require_reader();
      var basic_1 = require_basic();
      var ReaderTabPanelManager = class extends basic_1.ManagerTool {
        constructor(base) {
          super(base);
          this.ui = new ui_1.UITool(this);
          this.readerTool = new reader_1.ReaderTool(this);
          this.readerTabCache = {
            optionsList: [],
            observer: void 0,
            initializeLock: void 0
          };
        }
        /**
         * Register a tabpanel for every reader.
         * @remarks
         * Don't forget to call `unregisterReaderTabPanel` on exit.
         * @remarks
         * Every time a tab reader is selected/opened, the hook will be called.
         * @param tabLabel Label of panel tab.
         * @param renderPanelHook Called when panel is ready. Add elements to the panel.
         *
         * The panel might be `undefined` when opening a PDF without parent item.
         *
         * The owner deck is the top container of right-side bar.
         *
         * The readerInstance is the reader of current tabpanel.
         * @param options Other optional parameters.
         * @param options.tabId ID of panel tab. Also used as unregister query. If not set, generate a random one.
         * @param options.panelId ID of panel container (XUL.TabPanel). If not set, generate a random one.
         * @param options.targetIndex Index of the inserted tab. Default the end of tabs.
         * @param options.selectPanel If the panel should be selected immediately.
         * @returns tabId. Use it for unregister.
         * @example
         * Register an extra reader tabpanel into index 1.
         * ```ts
         * const readerTabId = `${config.addonRef}-extra-reader-tab`;
         * this._Addon.toolkit.UI.registerReaderTabPanel(
         *   "test",
         *   (
         *     panel: XUL.Element,
         *     deck: XUL.Deck,
         *     win: Window,
         *     reader: _ZoteroReaderInstance
         *   ) => {
         *     if (!panel) {
         *       this._Addon.toolkit.Tool.log(
         *         "This reader do not have right-side bar. Adding reader tab skipped."
         *       );
         *       return;
         *     }
         *     this._Addon.toolkit.Tool.log(reader);
         *     const elem = this._Addon.toolkit.UI.creatElementsFromJSON(
         *       win.document,
         *       {
         *         tag: "vbox",
         *         id: `${config.addonRef}-${reader._instanceID}-extra-reader-tab-div`,
         *         namespace: "xul",
         *         // This is important! Don't create content for multiple times
         *         ignoreIfExists: true,
         *         subElementOptions: [
         *           {
         *             tag: "h2",
         *             directAttributes: {
         *               innerText: "Hello World!",
         *             },
         *           },
         *           {
         *             tag: "label",
         *             namespace: "xul",
         *             directAttributes: {
         *               value: "This is a reader tab.",
         *             },
         *           },
         *           {
         *             tag: "label",
         *             namespace: "xul",
         *             directAttributes: {
         *               value: `Reader: ${reader._title.slice(0, 20)}`,
         *             },
         *           },
         *           {
         *             tag: "label",
         *             namespace: "xul",
         *             directAttributes: {
         *               value: `itemID: ${reader.itemID}.`,
         *             },
         *           },
         *           {
         *             tag: "button",
         *             directAttributes: {
         *               innerText: "Unregister",
         *             },
         *             listeners: [
         *               {
         *                 type: "click",
         *                 listener: () => {
         *                   this._Addon.toolkit.UI.unregisterReaderTabPanel(
         *                     readerTabId
         *                   );
         *                 },
         *               },
         *             ],
         *           },
         *         ],
         *       }
         *     );
         *     panel.append(elem);
         *   },
         *   {
         *     tabId: readerTabId,
         *   }
         * );
         * ```
         */
        async register(tabLabel, renderPanelHook, options) {
          var _a;
          options = options || {
            tabId: void 0,
            panelId: void 0,
            targetIndex: -1,
            selectPanel: false
          };
          if (typeof this.readerTabCache.initializeLock === "undefined") {
            await this.initializeReaderTabObserver();
          }
          await ((_a = this.readerTabCache.initializeLock) === null || _a === void 0 ? void 0 : _a.promise);
          const randomId = `${Zotero.Utilities.randomString()}-${(/* @__PURE__ */ new Date()).getTime()}`;
          const tabId = options.tabId || `toolkit-readertab-${randomId}`;
          const panelId = options.panelId || `toolkit-readertabpanel-${randomId}`;
          const targetIndex = typeof options.targetIndex === "number" ? options.targetIndex : -1;
          this.readerTabCache.optionsList.push({
            tabId,
            tabLabel,
            panelId,
            renderPanelHook,
            targetIndex,
            selectPanel: options.selectPanel
          });
          await this.addReaderTabPanel();
          return tabId;
        }
        /**
         * Unregister the reader tabpanel.
         * @param tabId tab id
         */
        unregister(tabId) {
          var _a;
          const idx = this.readerTabCache.optionsList.findIndex((v) => v.tabId === tabId);
          if (idx >= 0) {
            this.readerTabCache.optionsList.splice(idx, 1);
          }
          if (this.readerTabCache.optionsList.length === 0) {
            (_a = this.readerTabCache.observer) === null || _a === void 0 ? void 0 : _a.disconnect();
            this.readerTabCache = {
              optionsList: [],
              observer: void 0,
              initializeLock: void 0
            };
          }
          this.removeTabPanel(tabId);
        }
        /**
         * Unregister all library tabpanel.
         */
        unregisterAll() {
          const tabIds = this.readerTabCache.optionsList.map((options) => options.tabId);
          tabIds.forEach(this.unregister.bind(this));
        }
        changeTabPanel(tabId, options) {
          const idx = this.readerTabCache.optionsList.findIndex((v) => v.tabId === tabId);
          if (idx >= 0) {
            Object.assign(this.readerTabCache.optionsList[idx], options);
          }
        }
        removeTabPanel(tabId) {
          const doc = this.getGlobal("document");
          Array.prototype.forEach.call(doc.querySelectorAll(`.toolkit-ui-tabs-${tabId}`), (e) => {
            e.remove();
          });
        }
        async initializeReaderTabObserver() {
          this.readerTabCache.initializeLock = this.getGlobal("Zotero").Promise.defer();
          await Promise.all([
            Zotero.initializationPromise,
            Zotero.unlockPromise,
            Zotero.uiReadyPromise
          ]);
          const observer = this.readerTool.addReaderTabPanelDeckObserver(() => {
            this.addReaderTabPanel();
          });
          this.readerTabCache.observer = observer;
          this.readerTabCache.initializeLock.resolve();
        }
        async addReaderTabPanel() {
          var _a, _b, _c, _d;
          const window2 = this.getGlobal("window");
          const deck = this.readerTool.getReaderTabPanelDeck();
          if ((_a = deck.selectedPanel) === null || _a === void 0 ? void 0 : _a.getAttribute("toolkit-initialized")) {
            return;
          }
          const reader = await this.readerTool.getReader();
          if (!reader) {
            return;
          }
          if (((_b = deck.selectedPanel) === null || _b === void 0 ? void 0 : _b.children[0].tagName) === "vbox") {
            const container = deck.selectedPanel;
            container.innerHTML = "";
            this.ui.appendElement({
              tag: "tabbox",
              classList: ["zotero-view-tabbox"],
              attributes: {
                flex: "1"
              },
              enableElementRecord: false,
              children: [
                {
                  tag: "tabs",
                  classList: ["zotero-editpane-tabs"],
                  attributes: {
                    orient: "horizontal"
                  },
                  enableElementRecord: false
                },
                {
                  tag: "tabpanels",
                  classList: ["zotero-view-item"],
                  attributes: {
                    flex: "1"
                  },
                  enableElementRecord: false
                }
              ]
            }, container);
          }
          let tabbox = (_c = deck.selectedPanel) === null || _c === void 0 ? void 0 : _c.querySelector("tabbox");
          if (!tabbox) {
            return;
          }
          this.readerTabCache.optionsList.forEach((options) => {
            const tab = this.ui.createElement(window2.document, "tab", {
              id: `${options.tabId}-${reader._instanceID}`,
              classList: [`toolkit-ui-tabs-${options.tabId}`],
              attributes: {
                label: options.tabLabel
              },
              ignoreIfExists: true
            });
            const tabpanel = this.ui.createElement(window2.document, "tabpanel", {
              id: `${options.panelId}-${reader._instanceID}`,
              classList: [`toolkit-ui-tabs-${options.tabId}`],
              ignoreIfExists: true
            });
            const tabs = tabbox.querySelector("tabs");
            const tabpanels = tabbox.querySelector("tabpanels");
            if (options.targetIndex >= 0) {
              tabs === null || tabs === void 0 ? void 0 : tabs.querySelectorAll("tab")[options.targetIndex].before(tab);
              tabpanels === null || tabpanels === void 0 ? void 0 : tabpanels.querySelectorAll("tabpanel")[options.targetIndex].before(tabpanel);
              if (tabbox.getAttribute("toolkit-select-fixed") !== "true") {
                tabbox.tabpanels.addEventListener("select", () => {
                  this.getGlobal("setTimeout")(() => {
                    tabbox.tabpanels.selectedPanel = tabbox.tabs.getRelatedElement(tabbox === null || tabbox === void 0 ? void 0 : tabbox.tabs.selectedItem);
                  }, 0);
                });
                tabbox.setAttribute("toolkit-select-fixed", "true");
              }
            } else {
              tabs === null || tabs === void 0 ? void 0 : tabs.appendChild(tab);
              tabpanels === null || tabpanels === void 0 ? void 0 : tabpanels.appendChild(tabpanel);
            }
            if (options.selectPanel) {
              tabbox.selectedTab = tab;
            }
            options.renderPanelHook(tabpanel, deck, window2, reader);
          });
          (_d = deck.selectedPanel) === null || _d === void 0 ? void 0 : _d.setAttribute("toolkit-initialized", "true");
        }
      };
      exports.ReaderTabPanelManager = ReaderTabPanelManager;
    }
  });

  // node_modules/zotero-plugin-toolkit/dist/managers/menu.js
  var require_menu = __commonJS({
    "node_modules/zotero-plugin-toolkit/dist/managers/menu.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.MenuManager = void 0;
      var ui_1 = require_ui();
      var basic_1 = require_basic();
      var MenuManager = class extends basic_1.ManagerTool {
        constructor(base) {
          super(base);
          this.ui = new ui_1.UITool(this);
        }
        /**
         * Insert an menu item/menu(with popup)/menuseprator into a menupopup
         * @remarks
         * options:
         * ```ts
         * export interface MenuitemOptions {
         *   tag: "menuitem" | "menu" | "menuseparator";
         *   id?: string;
         *   label?: string;
         *   // data url (chrome://xxx.png) or base64 url (data:image/png;base64,xxx)
         *   icon?: string;
         *   class?: string;
         *   styles?: { [key: string]: string };
         *   hidden?: boolean;
         *   disabled?: boolean;
         *   oncommand?: string;
         *   commandListener?: EventListenerOrEventListenerObject;
         *   // Attributes below are used when type === "menu"
         *   popupId?: string;
         *   onpopupshowing?: string;
         *   subElementOptions?: Array<MenuitemOptions>;
         * }
         * ```
         * @param menuPopup
         * @param options
         * @param insertPosition
         * @param anchorElement The menuitem will be put before/after `anchorElement`. If not set, put at start/end of the menupopup.
         * @example
         * Insert menuitem with icon into item menupopup
         * ```ts
         * const ui = new ZoteroUI();
         * // base64 or chrome:// url
         * const menuIcon = "chrome://addontemplate/content/icons/favicon@0.5x.png";
         * ui.insertMenuItem("item", {
         *   tag: "menuitem",
         *   id: "zotero-itemmenu-addontemplate-test",
         *   label: "Addon Template: Menuitem",
         *   oncommand: "alert('Hello World! Default Menuitem.')",
         *   icon: menuIcon,
         * });
         * ```
         * @example
         * Insert menu into file menupopup
         * ```ts
         * const ui = new ZoteroUI();
         * ui.insertMenuItem(
         *   "menuFile",
         *   {
         *     tag: "menu",
         *     label: "Addon Template: Menupopup",
         *     subElementOptions: [
         *       {
         *         tag: "menuitem",
         *         label: "Addon Template",
         *         oncommand: "alert('Hello World! Sub Menuitem.')",
         *       },
         *     ],
         *   },
         *   "before",
         *   Zotero.getMainWindow().document.querySelector(
         *     "#zotero-itemmenu-addontemplate-test"
         *   )
         * );
         * ```
         */
        register(menuPopup, options, insertPosition = "after", anchorElement) {
          let popup;
          if (typeof menuPopup === "string") {
            popup = this.getGlobal("document").querySelector(MenuSelector[menuPopup]);
          } else {
            popup = menuPopup;
          }
          if (!popup) {
            return false;
          }
          const doc = popup.ownerDocument;
          const generateElementOptions = (menuitemOption) => {
            var _a;
            const elementOption = {
              tag: menuitemOption.tag,
              id: menuitemOption.id,
              namespace: "xul",
              attributes: {
                label: menuitemOption.label || "",
                hidden: Boolean(menuitemOption.hidden),
                disaled: Boolean(menuitemOption.disabled),
                class: menuitemOption.class || "",
                oncommand: menuitemOption.oncommand || ""
              },
              classList: menuitemOption.classList,
              styles: menuitemOption.styles || {},
              listeners: [],
              children: []
            };
            if (menuitemOption.icon) {
              elementOption.attributes["class"] += " menuitem-iconic";
              elementOption.styles["list-style-image"] = `url(${menuitemOption.icon})`;
            }
            if (menuitemOption.tag === "menu") {
              elementOption.children.push({
                tag: "menupopup",
                id: menuitemOption.popupId,
                attributes: { onpopupshowing: menuitemOption.onpopupshowing || "" },
                children: (menuitemOption.children || menuitemOption.subElementOptions || []).map(generateElementOptions)
              });
            }
            if (menuitemOption.commandListener) {
              (_a = elementOption.listeners) === null || _a === void 0 ? void 0 : _a.push({
                type: "command",
                listener: menuitemOption.commandListener
              });
            }
            return elementOption;
          };
          const props = generateElementOptions(options);
          const menuItem = this.ui.createElement(doc, options.tag, props);
          if (!anchorElement) {
            anchorElement = insertPosition === "after" ? popup.lastElementChild : popup.firstElementChild;
          }
          anchorElement[insertPosition](menuItem);
        }
        unregister(menuId) {
          var _a;
          (_a = this.getGlobal("document").querySelector(`#${menuId}`)) === null || _a === void 0 ? void 0 : _a.remove();
        }
        unregisterAll() {
          this.ui.unregisterAll();
        }
      };
      exports.MenuManager = MenuManager;
      var MenuSelector;
      (function(MenuSelector2) {
        MenuSelector2["menuFile"] = "#menu_FilePopup";
        MenuSelector2["menuEdit"] = "#menu_EditPopup";
        MenuSelector2["menuView"] = "#menu_viewPopup";
        MenuSelector2["menuGo"] = "#menu_goPopup";
        MenuSelector2["menuTools"] = "#menu_ToolsPopup";
        MenuSelector2["menuHelp"] = "#menu_HelpPopup";
        MenuSelector2["collection"] = "#zotero-collectionmenu";
        MenuSelector2["item"] = "#zotero-itemmenu";
      })(MenuSelector || (MenuSelector = {}));
    }
  });

  // node_modules/zotero-plugin-toolkit/dist/managers/preferencePane.js
  var require_preferencePane = __commonJS({
    "node_modules/zotero-plugin-toolkit/dist/managers/preferencePane.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.PreferencePaneManager = void 0;
      var ui_1 = require_ui();
      var basic_1 = require_basic();
      var PreferencePaneManager2 = class extends basic_1.ManagerTool {
        constructor(base) {
          super(base);
          this.ui = new ui_1.UITool(this);
          this.prefPaneCache = { win: void 0, listeners: {} };
        }
        /**
         * Register a preference pane from an xhtml, for Zotero 6 & 7.
         * @remarks
         * Don't forget to call `unregisterPrefPane` on exit.
         * @remarks
         * options:
         * ```ts
         * export interface PrefPaneOptions {
         *   pluginID: string;
         *   src: string;
         *   id?: string;
         *   parent?: string;
         *   label?: string;
         *   image?: string;
         *   extraDTD?: string[];
         *   scripts?: string[];
         *   defaultXUL?: boolean;
         *   // Only for Zotero 6
         *   onload?: (win: Window) => any;
         * }
         * ```
         *
         * @param options See {@link https://github.com/windingwind/zotero-plugin-toolkit/blob/main/src/options.ts | source code:options.ts}
         * @example
         * ```ts
         * const prefsManager = new PreferencePaneManager();
         * function initPrefs() {
         *   const prefOptions = {
         *     pluginID: addonID,
         *     src: rootURI + "chrome/content/preferences.xhtml",
         *     label: "Template",
         *     image: `chrome://${addonRef}/content/icons/favicon.png`,
         *     extraDTD: [`chrome://${addonRef}/locale/overlay.dtd`],
         *     defaultXUL: true
         *   };
         *   prefsManager.registerPrefPane(prefOptions);
         * };
         *
         * function unInitPrefs() {
         *   prefsManager.unregisterAll();
         * };
         * ```
         * // bootstrap.js:startup
         * initPrefs();
         *
         * // bootstrap.js:shutsown
         * unInitPrefs();
         */
        register(options) {
          if (this.isZotero7()) {
            this.getGlobal("Zotero").PreferencePanes.register(options);
            return;
          }
          const _initImportedNodesPostInsert = (container) => {
            var _a;
            const _observerSymbols = /* @__PURE__ */ new Map();
            const Zotero2 = this.getGlobal("Zotero");
            const window2 = container.ownerGlobal;
            let useChecked = (elem) => elem instanceof window2.HTMLInputElement && elem.type == "checkbox" || elem.tagName == "checkbox";
            let syncFromPref = (elem, preference) => {
              let value = Zotero2.Prefs.get(preference, true);
              if (useChecked(elem)) {
                elem.checked = value;
              } else {
                elem.value = value;
              }
              elem.dispatchEvent(new window2.Event("syncfrompreference"));
            };
            let syncToPrefOnModify = (event) => {
              const targetNode = event.currentTarget;
              if (targetNode === null || targetNode === void 0 ? void 0 : targetNode.getAttribute("preference")) {
                let value = useChecked(targetNode) ? targetNode.checked : targetNode.value;
                Zotero2.Prefs.set(targetNode.getAttribute("preference") || "", value, true);
                targetNode.dispatchEvent(new window2.Event("synctopreference"));
              }
            };
            let attachToPreference = (elem, preference) => {
              Zotero2.debug(`Attaching <${elem.tagName}> element to ${preference}`);
              let symbol = Zotero2.Prefs.registerObserver(preference, () => syncFromPref(elem, preference), true);
              _observerSymbols.set(elem, symbol);
            };
            let detachFromPreference = (elem) => {
              if (_observerSymbols.has(elem)) {
                Zotero2.debug(`Detaching <${elem.tagName}> element from preference`);
                Zotero2.Prefs.unregisterObserver(this._observerSymbols.get(elem));
                _observerSymbols.delete(elem);
              }
            };
            for (let elem of container.querySelectorAll("[preference]")) {
              let preference = elem.getAttribute("preference");
              if (container.querySelector("preferences > preference#" + preference)) {
                this.log("<preference> is deprecated -- `preference` attribute values should be full preference keys, not <preference> IDs");
                preference = (_a = container.querySelector("preferences > preference#" + preference)) === null || _a === void 0 ? void 0 : _a.getAttribute("name");
              }
              attachToPreference(elem, preference);
              elem.addEventListener(this.isXULElement(elem) ? "command" : "input", syncToPrefOnModify);
              window2.setTimeout(() => {
                syncFromPref(elem, preference);
              });
            }
            new window2.MutationObserver((mutations) => {
              for (let mutation of mutations) {
                if (mutation.type == "attributes") {
                  let target = mutation.target;
                  detachFromPreference(target);
                  if (target.hasAttribute("preference")) {
                    attachToPreference(target, target.getAttribute("preference") || "");
                    target.addEventListener(this.isXULElement(target) ? "command" : "input", syncToPrefOnModify);
                  }
                } else if (mutation.type == "childList") {
                  for (let node of mutation.removedNodes) {
                    detachFromPreference(node);
                  }
                  for (let node of mutation.addedNodes) {
                    if (node.nodeType == window2.Node.ELEMENT_NODE && node.hasAttribute("preference")) {
                      attachToPreference(node, node.getAttribute("preference") || "");
                      node.addEventListener(this.isXULElement(node) ? "command" : "input", syncToPrefOnModify);
                    }
                  }
                }
              }
            }).observe(container, {
              childList: true,
              subtree: true,
              attributeFilter: ["preference"]
            });
            for (let elem of container.querySelectorAll("[oncommand]")) {
              elem.oncommand = elem.getAttribute("oncommand");
            }
            for (let child of container.children) {
              child.dispatchEvent(new window2.Event("load"));
            }
          };
          const windowListener = {
            onOpenWindow: (xulWindow) => {
              const win = xulWindow.QueryInterface(Components.interfaces.nsIInterfaceRequestor).getInterface(Components.interfaces.nsIDOMWindow);
              win.addEventListener("load", async () => {
                var _a;
                if (win.location.href === "chrome://zotero/content/preferences/preferences.xul") {
                  this.log("registerPrefPane:detected", options);
                  const Zotero2 = this.getGlobal("Zotero");
                  options.id || (options.id = `plugin-${Zotero2.Utilities.randomString()}-${(/* @__PURE__ */ new Date()).getTime()}`);
                  const contentOrXHR = await Zotero2.File.getContentsAsync(options.src);
                  const content = typeof contentOrXHR === "string" ? contentOrXHR : contentOrXHR.response;
                  const src = `<prefpane xmlns="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul" id="${options.id}" insertafter="zotero-prefpane-advanced" label="${options.label || options.pluginID}" image="${options.image || ""}">
                ${content}
                </prefpane>`;
                  const frag = this.ui.parseXHTMLToFragment(src, options.extraDTD, options.defaultXUL);
                  this.log(frag);
                  const prefWindow = win.document.querySelector("prefwindow");
                  prefWindow.appendChild(frag);
                  const prefPane = win.document.querySelector(`#${options.id}`);
                  prefWindow.addPane(prefPane);
                  const contentBox = win.document.getAnonymousNodes(win.document.querySelector(`#${options.id}`))[0];
                  contentBox.style.overflowY = "scroll";
                  contentBox.style.height = "440px";
                  win.sizeToContent();
                  if (contentBox.scrollHeight === contentBox.clientHeight) {
                    contentBox.style.overflowY = "hidden";
                  }
                  this.prefPaneCache.win = win;
                  this.prefPaneCache.listeners[options.id] = windowListener;
                  _initImportedNodesPostInsert(prefPane);
                  if ((_a = options.scripts) === null || _a === void 0 ? void 0 : _a.length) {
                    options.scripts.forEach((script) => Services.scriptloader.loadSubScript(script, win));
                  }
                  if (options.onload) {
                    options.onload(win);
                  }
                }
              }, false);
            }
          };
          Services.wm.addListener(windowListener);
        }
        unregister(id) {
          var _a;
          const idx = Object.keys(this.prefPaneCache.listeners).indexOf(id);
          if (idx < 0) {
            return false;
          }
          const listner = this.prefPaneCache.listeners[id];
          Services.wm.removeListener(listner);
          listner.onOpenWindow = void 0;
          const win = this.prefPaneCache.win;
          if (win && !win.closed) {
            (_a = win.document.querySelector(`#${id}`)) === null || _a === void 0 ? void 0 : _a.remove();
          }
          delete this.prefPaneCache.listeners[id];
          return true;
        }
        /**
         * Unregister all preference panes added with this instance
         *
         * Called on exiting
         */
        unregisterAll() {
          for (const id in this.prefPaneCache.listeners) {
            this.unregister(id);
          }
        }
      };
      exports.PreferencePaneManager = PreferencePaneManager2;
    }
  });

  // node_modules/zotero-plugin-toolkit/dist/managers/shortcut.js
  var require_shortcut = __commonJS({
    "node_modules/zotero-plugin-toolkit/dist/managers/shortcut.js"(exports) {
      "use strict";
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.ShortcutManager = void 0;
      var basic_1 = require_basic();
      var ui_1 = require_ui();
      var basic_2 = require_basic();
      var toolkitGlobal_1 = __importDefault(require_toolkitGlobal());
      var ShortcutManager = class extends basic_2.ManagerTool {
        constructor(base) {
          super(base);
          this.ui = new ui_1.UITool(this);
          this.creatorId = `${Zotero.Utilities.randomString()}-${(/* @__PURE__ */ new Date()).getTime()}`;
          this.initializeGlobal();
        }
        register(type, keyOptions) {
          const _keyOptions = keyOptions;
          _keyOptions.type = type;
          switch (_keyOptions.type) {
            case "event":
              this.registerEventKey(_keyOptions);
              return true;
            case "element":
              this.registerElementKey(_keyOptions);
              return true;
            case "prefs":
              this.getGlobal("Zotero").Prefs.set(_keyOptions.id, _keyOptions.key || "");
              return true;
            default:
              try {
                if (_keyOptions.register) {
                  return _keyOptions.register(_keyOptions);
                } else {
                  return false;
                }
              } catch (e) {
                this.log(e);
                return false;
              }
          }
        }
        /**
         * Get all shortcuts(element, event, prefs, builtin)
         */
        getAll() {
          return Array.prototype.concat(this.getMainWindowElementKeys(), this.getEventKeys(), this.getPrefsKeys(), this.getBuiltinKeys());
        }
        /**
         * Check key conflicting of `inputKeyOptions`.
         * @param inputKeyOptions
         * @param options
         * @returns conflicting keys array
         */
        checkKeyConflicting(inputKeyOptions, options = { includeEmpty: false, customKeys: [] }) {
          var _a;
          inputKeyOptions.modifiers = new KeyModifier(inputKeyOptions.modifiers || "").getRaw();
          let allKeys = this.getAll();
          if ((_a = options.customKeys) === null || _a === void 0 ? void 0 : _a.length) {
            allKeys = allKeys.concat(options.customKeys);
          }
          if (!options.includeEmpty) {
            allKeys = allKeys.filter((_keyOptions) => _keyOptions.key);
          }
          return allKeys.filter((_keyOptions) => {
            var _a2, _b;
            return _keyOptions.id !== inputKeyOptions.id && ((_a2 = _keyOptions.key) === null || _a2 === void 0 ? void 0 : _a2.toLowerCase()) === ((_b = inputKeyOptions.key) === null || _b === void 0 ? void 0 : _b.toLowerCase()) && _keyOptions.modifiers === inputKeyOptions.modifiers;
          });
        }
        /**
         * Find all key conflicting.
         * @param options
         * @returns An array of conflicting keys arrays. Same conflicting keys are put together.
         */
        checkAllKeyConflicting(options = { includeEmpty: false, customKeys: [] }) {
          var _a;
          let allKeys = this.getAll();
          if ((_a = options.customKeys) === null || _a === void 0 ? void 0 : _a.length) {
            allKeys = allKeys.concat(options.customKeys);
          }
          if (!options.includeEmpty) {
            allKeys = allKeys.filter((_keyOptions) => _keyOptions.key);
          }
          const conflicting = [];
          while (allKeys.length > 0) {
            const checkKey = allKeys.pop();
            const conflictKeys = allKeys.filter((_keyOptions) => {
              var _a2, _b;
              return ((_a2 = _keyOptions.key) === null || _a2 === void 0 ? void 0 : _a2.toLowerCase()) === ((_b = checkKey.key) === null || _b === void 0 ? void 0 : _b.toLowerCase()) && _keyOptions.modifiers === checkKey.modifiers;
            });
            if (conflictKeys.length) {
              conflictKeys.push(checkKey);
              conflicting.push(conflictKeys);
              const conflictingKeyIds = conflictKeys.map((key) => key.id);
              const toRemoveIds = [];
              allKeys.forEach((key, i) => conflictingKeyIds.includes(key.id) && toRemoveIds.push(i));
              toRemoveIds.sort((a, b) => b - a).forEach((id) => allKeys.splice(id, 1));
            }
          }
          return conflicting;
        }
        /**
         * Unregister a key.
         * @remarks
         * `builtin` keys cannot be unregistered.
         * @param keyOptions
         * @returns `true` for success and `false` for failure.
         */
        async unregister(keyOptions) {
          var _a;
          switch (keyOptions.type) {
            case "element":
              (_a = (keyOptions.xulData.document || this.getGlobal("document")).querySelector(`#${keyOptions.id}`)) === null || _a === void 0 ? void 0 : _a.remove();
              return true;
            case "prefs":
              this.getGlobal("Zotero").Prefs.set(keyOptions.id, "");
              return true;
            case "builtin":
              return false;
            case "event":
              let idx = this.globalCache.eventKeys.findIndex((currentKey) => currentKey.id === keyOptions.id);
              while (idx >= 0) {
                this.globalCache.eventKeys.splice(idx, 1);
                idx = this.globalCache.eventKeys.findIndex((currentKey) => currentKey.id === keyOptions.id);
              }
              return true;
            default:
              try {
                if (keyOptions.unregister) {
                  return await keyOptions.unregister(keyOptions);
                } else {
                  return false;
                }
              } catch (e) {
                this.log(e);
                return false;
              }
          }
        }
        /**
         * Unregister all keys created by this instance.
         */
        unregisterAll() {
          this.ui.unregisterAll();
          this.globalCache.eventKeys.filter((keyOptions) => keyOptions.creatorId === this.creatorId).forEach((keyOptions) => this.unregister(keyOptions));
        }
        initializeGlobal() {
          const Zotero2 = this.getGlobal("Zotero");
          const window2 = this.getGlobal("window");
          this.globalCache = toolkitGlobal_1.default.getInstance().shortcut;
          if (!this.globalCache._ready) {
            this.globalCache._ready = true;
            window2.addEventListener("keypress", (event) => {
              let eventMods = [];
              let eventModsWithAccel = [];
              if (event.altKey) {
                eventMods.push("alt");
                eventModsWithAccel.push("alt");
              }
              if (event.shiftKey) {
                eventMods.push("shift");
                eventModsWithAccel.push("shift");
              }
              if (event.metaKey) {
                eventMods.push("meta");
                Zotero2.isMac && eventModsWithAccel.push("accel");
              }
              if (event.ctrlKey) {
                eventMods.push("control");
                !Zotero2.isMac && eventModsWithAccel.push("accel");
              }
              const eventModStr = new KeyModifier(eventMods.join(",")).getRaw();
              const eventModStrWithAccel = new KeyModifier(eventMods.join(",")).getRaw();
              this.globalCache.eventKeys.forEach((keyOptions) => {
                var _a;
                if (keyOptions.disabled) {
                  return;
                }
                const modStr = new KeyModifier(keyOptions.modifiers || "").getRaw();
                if ((modStr === eventModStr || modStr === eventModStrWithAccel) && ((_a = keyOptions.key) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === event.key.toLowerCase()) {
                  keyOptions.callback();
                }
              });
            });
          }
        }
        registerEventKey(keyOptions) {
          keyOptions.creatorId = this.creatorId;
          this.globalCache.eventKeys.push(keyOptions);
        }
        /**
         * Register Element \<commandset\>. In general, use `registerElementKey` or `registerKey`.
         * @param commandSetOptions
         */
        registerElementCommandset(commandSetOptions) {
          var _a;
          (_a = commandSetOptions.document.querySelector("window")) === null || _a === void 0 ? void 0 : _a.appendChild(this.ui.createElement(commandSetOptions.document, "commandset", {
            id: commandSetOptions.id,
            skipIfExists: true,
            children: commandSetOptions.commands.map((cmd) => ({
              tag: "command",
              id: cmd.id,
              attributes: {
                oncommand: cmd.oncommand,
                disabled: cmd.disabled,
                label: cmd.label
              }
            }))
          }));
        }
        /**
         * Register Element \<command\>. In general, use `registerElementKey` or `registerKey`.
         * @param commandOptions
         */
        registerElementCommand(commandOptions) {
          var _a;
          if (commandOptions._parentId) {
            this.registerElementCommandset({
              id: commandOptions._parentId,
              document: commandOptions.document,
              commands: []
            });
          }
          (_a = commandOptions.document.querySelector(`commandset#${commandOptions._parentId}`)) === null || _a === void 0 ? void 0 : _a.appendChild(this.ui.createElement(commandOptions.document, "command", {
            id: commandOptions.id,
            skipIfExists: true,
            attributes: {
              oncommand: commandOptions.oncommand,
              disabled: commandOptions.disabled,
              label: commandOptions.label
            }
          }));
        }
        /**
         * Register Element \<keyset\>. In general, use `registerElementKey` or `registerKey`.
         * @param keySetOptions
         */
        registerElementKeyset(keySetOptions) {
          var _a;
          (_a = keySetOptions.document.querySelector("window")) === null || _a === void 0 ? void 0 : _a.appendChild(this.ui.createElement(keySetOptions.document, "keyset", {
            id: keySetOptions.id,
            skipIfExists: true,
            children: keySetOptions.keys.map((keyOptions) => ({
              tag: "key",
              id: keyOptions.id,
              attributes: {
                oncommand: keyOptions.xulData.oncommand || "//",
                command: keyOptions.xulData.command,
                modifiers: keyOptions.modifiers,
                key: this.getXULKey(keyOptions.key),
                keycode: this.getXULKeyCode(keyOptions.key),
                disabled: keyOptions.disabled
              }
            }))
          }));
        }
        /**
         * Register a shortcut key element \<key\>.
         * @remarks
         * Provide `_parentId` to register a \<keyset\>;
         *
         * Provide `_commandOptions` to register a \<command\>;
         *
         * Provide `_parentId` in `_commandOptions` to register a \<commandset\>.
         *
         * See examples for more details.
         * @param keyOptions
         * @example
         */
        registerElementKey(keyOptions) {
          var _a;
          const doc = keyOptions.xulData.document || this.getGlobal("document");
          if (keyOptions.xulData._parentId) {
            this.registerElementKeyset({
              id: keyOptions.xulData._parentId,
              document: doc,
              keys: []
            });
          }
          (_a = doc.querySelector(`keyset#${keyOptions.xulData._parentId}`)) === null || _a === void 0 ? void 0 : _a.appendChild(this.ui.createElement(doc, "key", {
            id: keyOptions.id,
            skipIfExists: true,
            attributes: {
              oncommand: keyOptions.xulData.oncommand || "//",
              command: keyOptions.xulData.command,
              modifiers: keyOptions.modifiers,
              key: this.getXULKey(keyOptions.key),
              keycode: this.getXULKeyCode(keyOptions.key),
              disabled: keyOptions.disabled
            }
          }));
          if (keyOptions.xulData._commandOptions) {
            this.registerElementCommand(keyOptions.xulData._commandOptions);
          }
        }
        getXULKey(standardKey) {
          if (standardKey.length === 1) {
            return standardKey;
          }
          return void 0;
        }
        getXULKeyCode(standardKey) {
          const idx = Object.values(XUL_KEYCODE_MAPS).findIndex((value) => value === standardKey);
          if (idx >= 0) {
            return Object.values(XUL_KEYCODE_MAPS)[idx];
          }
          return void 0;
        }
        getStandardKey(XULKey, XULKeyCode) {
          if (XULKeyCode && Object.keys(XUL_KEYCODE_MAPS).includes(XULKeyCode)) {
            return XUL_KEYCODE_MAPS[XULKeyCode];
          } else {
            return XULKey;
          }
        }
        /**
         * Get all \<commandset\> details.
         * @param doc
         */
        getElementCommandSets(doc) {
          return Array.from((doc || this.getGlobal("document")).querySelectorAll("commandset")).map((cmdSet) => ({
            id: cmdSet.id,
            commands: Array.from(cmdSet.querySelectorAll("command")).map((cmd) => ({
              id: cmd.id,
              oncommand: cmd.getAttribute("oncommand"),
              disabled: cmd.getAttribute("disabled") === "true",
              label: cmd.getAttribute("label"),
              _parentId: cmdSet.id
            }))
          }));
        }
        /**
         * Get all \<command\> details.
         * @param doc
         */
        getElementCommands(doc) {
          return Array.prototype.concat(...this.getElementCommandSets(doc).map((cmdSet) => cmdSet.commands));
        }
        /**
         * Get all \<keyset\> details.
         * @param doc
         * @param options
         */
        getElementKeySets(doc) {
          let allCommends = this.getElementCommands(doc);
          return Array.from((doc || this.getGlobal("document")).querySelectorAll("keyset")).map((keysetElem) => ({
            id: keysetElem.id,
            document: doc,
            keys: Array.from(keysetElem.querySelectorAll("key")).map((keyElem) => {
              const oncommand = keyElem.getAttribute("oncommand") || "";
              const commandId = keyElem.getAttribute("command") || "";
              const commandOptions = allCommends.find((cmd) => cmd.id === commandId);
              const key = {
                type: "element",
                id: keyElem.id,
                key: this.getStandardKey(keyElem.getAttribute("key") || "", keyElem.getAttribute("keycode") || ""),
                modifiers: new KeyModifier(keyElem.getAttribute("modifiers") || "").getRaw(),
                disabled: keyElem.getAttribute("disabled") === "true",
                xulData: {
                  document: doc,
                  oncommand,
                  command: commandId,
                  _parentId: keysetElem.id,
                  _commandOptions: commandOptions
                },
                callback: () => {
                  const win = doc.ownerGlobal;
                  const _eval = win.eval;
                  _eval(oncommand);
                  _eval((commandOptions === null || commandOptions === void 0 ? void 0 : commandOptions.oncommand) || "");
                }
              };
              return key;
            })
          }));
        }
        /**
         * Get all \<key\> details.
         * @param doc
         * @param options
         */
        getElementKeys(doc) {
          return Array.prototype.concat(...this.getElementKeySets(doc).map((keyset) => keyset.keys)).filter((elemKey) => !ELEM_KEY_IGNORE.includes(elemKey.id));
        }
        /**
         * Get \<key\> details in main window.
         * @param options
         */
        getMainWindowElementKeys() {
          return this.getElementKeys(this.getGlobal("document"));
        }
        getEventKeys() {
          return this.globalCache.eventKeys;
        }
        /**
         * Get Zotero builtin keys defined in preferences.
         */
        getPrefsKeys() {
          const Zotero2 = this.getGlobal("Zotero");
          return PREF_KEYS.map((pref) => ({
            id: pref.id,
            modifiers: pref.modifiers,
            key: Zotero2.Prefs.get(pref.id),
            callback: pref.callback,
            type: "prefs"
          }));
        }
        /**
         * Get Zotero builtin keys not defined in preferences.
         */
        getBuiltinKeys() {
          return BUILTIN_KEYS.map((builtin) => ({
            id: builtin.id,
            modifiers: builtin.modifiers,
            key: builtin.key,
            callback: builtin.callback,
            type: "builtin"
          }));
        }
      };
      exports.ShortcutManager = ShortcutManager;
      var KeyModifier = class {
        constructor(raw) {
          raw = raw || "";
          this.accel = raw.includes("accel");
          this.shift = raw.includes("shift");
          this.control = raw.includes("control");
          this.meta = raw.includes("meta");
          this.alt = raw.includes("alt");
        }
        equals(newMod) {
          this.accel === newMod.accel;
          this.shift === newMod.shift;
          this.control === newMod.control;
          this.meta === newMod.meta;
          this.alt === newMod.alt;
        }
        getRaw() {
          const enabled = [];
          this.accel && enabled.push("accel");
          this.shift && enabled.push("shift");
          this.control && enabled.push("control");
          this.meta && enabled.push("meta");
          this.alt && enabled.push("alt");
          return enabled.join(",");
        }
      };
      var XUL_KEYCODE_MAPS;
      (function(XUL_KEYCODE_MAPS2) {
        XUL_KEYCODE_MAPS2["VK_CANCEL"] = "Unidentified";
        XUL_KEYCODE_MAPS2["VK_BACK"] = "Backspace";
        XUL_KEYCODE_MAPS2["VK_TAB"] = "Tab";
        XUL_KEYCODE_MAPS2["VK_CLEAR"] = "Clear";
        XUL_KEYCODE_MAPS2["VK_RETURN"] = "Enter";
        XUL_KEYCODE_MAPS2["VK_ENTER"] = "Enter";
        XUL_KEYCODE_MAPS2["VK_SHIFT"] = "Shift";
        XUL_KEYCODE_MAPS2["VK_CONTROL"] = "Control";
        XUL_KEYCODE_MAPS2["VK_ALT"] = "Alt";
        XUL_KEYCODE_MAPS2["VK_PAUSE"] = "Pause";
        XUL_KEYCODE_MAPS2["VK_CAPS_LOCK"] = "CapsLock";
        XUL_KEYCODE_MAPS2["VK_ESCAPE"] = "Escape";
        XUL_KEYCODE_MAPS2["VK_SPACE"] = " ";
        XUL_KEYCODE_MAPS2["VK_PAGE_UP"] = "PageUp";
        XUL_KEYCODE_MAPS2["VK_PAGE_DOWN"] = "PageDown";
        XUL_KEYCODE_MAPS2["VK_END"] = "End";
        XUL_KEYCODE_MAPS2["VK_HOME"] = "Home";
        XUL_KEYCODE_MAPS2["VK_LEFT"] = "ArrowLeft";
        XUL_KEYCODE_MAPS2["VK_UP"] = "ArrowUp";
        XUL_KEYCODE_MAPS2["VK_RIGHT"] = "ArrowRight";
        XUL_KEYCODE_MAPS2["VK_DOWN"] = "ArrowDown";
        XUL_KEYCODE_MAPS2["VK_PRINTSCREEN"] = "PrintScreen";
        XUL_KEYCODE_MAPS2["VK_INSERT"] = "Insert";
        XUL_KEYCODE_MAPS2["VK_DELETE"] = "Backspace";
        XUL_KEYCODE_MAPS2["VK_0"] = "0";
        XUL_KEYCODE_MAPS2["VK_1"] = "1";
        XUL_KEYCODE_MAPS2["VK_2"] = "2";
        XUL_KEYCODE_MAPS2["VK_3"] = "3";
        XUL_KEYCODE_MAPS2["VK_4"] = "4";
        XUL_KEYCODE_MAPS2["VK_5"] = "5";
        XUL_KEYCODE_MAPS2["VK_6"] = "6";
        XUL_KEYCODE_MAPS2["VK_7"] = "7";
        XUL_KEYCODE_MAPS2["VK_8"] = "8";
        XUL_KEYCODE_MAPS2["VK_9"] = "9";
        XUL_KEYCODE_MAPS2["VK_A"] = "A";
        XUL_KEYCODE_MAPS2["VK_B"] = "B";
        XUL_KEYCODE_MAPS2["VK_C"] = "C";
        XUL_KEYCODE_MAPS2["VK_D"] = "D";
        XUL_KEYCODE_MAPS2["VK_E"] = "E";
        XUL_KEYCODE_MAPS2["VK_F"] = "F";
        XUL_KEYCODE_MAPS2["VK_G"] = "G";
        XUL_KEYCODE_MAPS2["VK_H"] = "H";
        XUL_KEYCODE_MAPS2["VK_I"] = "I";
        XUL_KEYCODE_MAPS2["VK_J"] = "J";
        XUL_KEYCODE_MAPS2["VK_K"] = "K";
        XUL_KEYCODE_MAPS2["VK_L"] = "L";
        XUL_KEYCODE_MAPS2["VK_M"] = "M";
        XUL_KEYCODE_MAPS2["VK_N"] = "N";
        XUL_KEYCODE_MAPS2["VK_O"] = "O";
        XUL_KEYCODE_MAPS2["VK_P"] = "P";
        XUL_KEYCODE_MAPS2["VK_Q"] = "Q";
        XUL_KEYCODE_MAPS2["VK_R"] = "R";
        XUL_KEYCODE_MAPS2["VK_S"] = "S";
        XUL_KEYCODE_MAPS2["VK_T"] = "T";
        XUL_KEYCODE_MAPS2["VK_U"] = "U";
        XUL_KEYCODE_MAPS2["VK_V"] = "V";
        XUL_KEYCODE_MAPS2["VK_W"] = "W";
        XUL_KEYCODE_MAPS2["VK_X"] = "X";
        XUL_KEYCODE_MAPS2["VK_Y"] = "Y";
        XUL_KEYCODE_MAPS2["VK_Z"] = "Z";
        XUL_KEYCODE_MAPS2["VK_SEMICOLON"] = "Unidentified";
        XUL_KEYCODE_MAPS2["VK_EQUALS"] = "Unidentified";
        XUL_KEYCODE_MAPS2["VK_NUMPAD0"] = "0";
        XUL_KEYCODE_MAPS2["VK_NUMPAD1"] = "1";
        XUL_KEYCODE_MAPS2["VK_NUMPAD2"] = "2";
        XUL_KEYCODE_MAPS2["VK_NUMPAD3"] = "3";
        XUL_KEYCODE_MAPS2["VK_NUMPAD4"] = "4";
        XUL_KEYCODE_MAPS2["VK_NUMPAD5"] = "5";
        XUL_KEYCODE_MAPS2["VK_NUMPAD6"] = "6";
        XUL_KEYCODE_MAPS2["VK_NUMPAD7"] = "7";
        XUL_KEYCODE_MAPS2["VK_NUMPAD8"] = "8";
        XUL_KEYCODE_MAPS2["VK_NUMPAD9"] = "9";
        XUL_KEYCODE_MAPS2["VK_MULTIPLY"] = "Multiply";
        XUL_KEYCODE_MAPS2["VK_ADD"] = "Add";
        XUL_KEYCODE_MAPS2["VK_SEPARATOR"] = "Separator";
        XUL_KEYCODE_MAPS2["VK_SUBTRACT"] = "Subtract";
        XUL_KEYCODE_MAPS2["VK_DECIMAL"] = "Decimal";
        XUL_KEYCODE_MAPS2["VK_DIVIDE"] = "Divide";
        XUL_KEYCODE_MAPS2["VK_F1"] = "F1";
        XUL_KEYCODE_MAPS2["VK_F2"] = "F2";
        XUL_KEYCODE_MAPS2["VK_F3"] = "F3";
        XUL_KEYCODE_MAPS2["VK_F4"] = "F4";
        XUL_KEYCODE_MAPS2["VK_F5"] = "F5";
        XUL_KEYCODE_MAPS2["VK_F6"] = "F6";
        XUL_KEYCODE_MAPS2["VK_F7"] = "F7";
        XUL_KEYCODE_MAPS2["VK_F8"] = "F8";
        XUL_KEYCODE_MAPS2["VK_F9"] = "F9";
        XUL_KEYCODE_MAPS2["VK_F10"] = "F10";
        XUL_KEYCODE_MAPS2["VK_F11"] = "F11";
        XUL_KEYCODE_MAPS2["VK_F12"] = "F12";
        XUL_KEYCODE_MAPS2["VK_F13"] = "F13";
        XUL_KEYCODE_MAPS2["VK_F14"] = "F14";
        XUL_KEYCODE_MAPS2["VK_F15"] = "F15";
        XUL_KEYCODE_MAPS2["VK_F16"] = "F16";
        XUL_KEYCODE_MAPS2["VK_F17"] = "F17";
        XUL_KEYCODE_MAPS2["VK_F18"] = "F18";
        XUL_KEYCODE_MAPS2["VK_F19"] = "F19";
        XUL_KEYCODE_MAPS2["VK_F20"] = "F20";
        XUL_KEYCODE_MAPS2["VK_F21"] = "Soft1";
        XUL_KEYCODE_MAPS2["VK_F22"] = "Soft2";
        XUL_KEYCODE_MAPS2["VK_F23"] = "Soft3";
        XUL_KEYCODE_MAPS2["VK_F24"] = "Soft4";
        XUL_KEYCODE_MAPS2["VK_NUM_LOCK"] = "NumLock";
        XUL_KEYCODE_MAPS2["VK_SCROLL_LOCK"] = "ScrollLock";
        XUL_KEYCODE_MAPS2["VK_COMMA"] = ",";
        XUL_KEYCODE_MAPS2["VK_PERIOD"] = ".";
        XUL_KEYCODE_MAPS2["VK_SLASH"] = "Divide";
        XUL_KEYCODE_MAPS2["VK_BACK_QUOTE"] = "`";
        XUL_KEYCODE_MAPS2["VK_OPEN_BRACKET"] = "[";
        XUL_KEYCODE_MAPS2["VK_CLOSE_BRACKET"] = "]";
        XUL_KEYCODE_MAPS2["VK_QUOTE"] = "\\";
        XUL_KEYCODE_MAPS2["VK_HELP"] = "Help";
      })(XUL_KEYCODE_MAPS || (XUL_KEYCODE_MAPS = {}));
      function getElementKeyCallback(keyId) {
        return function() {
          var _a;
          const win = basic_1.BasicTool.getZotero().getMainWindow();
          const keyElem = win.document.querySelector(`#${keyId}`);
          if (!keyElem) {
            return function() {
            };
          }
          const _eval = win.eval;
          _eval(keyElem.getAttribute("oncommand") || "//");
          const cmdId = keyElem.getAttribute("command");
          if (!cmdId) {
            return;
          }
          _eval(((_a = win.document.querySelector(`#${cmdId}`)) === null || _a === void 0 ? void 0 : _a.getAttribute("oncommand")) || "//");
        };
      }
      function getBuiltinEventKeyCallback(eventId) {
        return function() {
          const Zotero2 = basic_1.BasicTool.getZotero();
          const ZoteroPane2 = Zotero2.getActiveZoteroPane();
          ZoteroPane2.handleKeyPress({
            metaKey: true,
            ctrlKey: true,
            shiftKey: true,
            originalTarget: { id: "" },
            preventDefault: () => {
            },
            key: Zotero2.Prefs.get(`extensions.zotero.keys.${eventId}`, true)
          });
        };
      }
      var ELEM_KEY_IGNORE = ["key_copyCitation", "key_copyBibliography"];
      var PREF_KEYS = [
        {
          id: "extensions.zotero.keys.copySelectedItemCitationsToClipboard",
          modifiers: "accel,shift",
          elemId: "key_copyCitation",
          callback: getElementKeyCallback("key_copyCitation")
        },
        {
          id: "extensions.zotero.keys.copySelectedItemsToClipboard",
          modifiers: "accel,shift",
          elemId: "key_copyBibliography",
          callback: getElementKeyCallback("key_copyBibliography")
        },
        {
          id: "extensions.zotero.keys.library",
          modifiers: "accel,shift",
          callback: getBuiltinEventKeyCallback("library")
        },
        {
          id: "extensions.zotero.keys.newItem",
          modifiers: "accel,shift",
          callback: getBuiltinEventKeyCallback("newItem")
        },
        {
          id: "extensions.zotero.keys.newNote",
          modifiers: "accel,shift",
          callback: getBuiltinEventKeyCallback("newNote")
        },
        {
          id: "extensions.zotero.keys.quicksearch",
          modifiers: "accel,shift",
          callback: getBuiltinEventKeyCallback("quicksearch")
        },
        {
          id: "extensions.zotero.keys.saveToZotero",
          modifiers: "accel,shift",
          callback: getBuiltinEventKeyCallback("saveToZotero")
        },
        {
          id: "extensions.zotero.keys.sync",
          modifiers: "accel,shift",
          callback: getBuiltinEventKeyCallback("sync")
        },
        {
          id: "extensions.zotero.keys.toggleAllRead",
          modifiers: "accel,shift",
          callback: getBuiltinEventKeyCallback("toggleAllRead")
        },
        {
          id: "extensions.zotero.keys.toggleRead",
          modifiers: "accel,shift",
          callback: getBuiltinEventKeyCallback("toggleRead")
        }
      ];
      var BUILTIN_KEYS = [
        {
          id: "showItemCollection",
          modifiers: "",
          key: "Ctrl",
          callback: () => {
            const Zotero2 = basic_1.BasicTool.getZotero();
            const ZoteroPane2 = Zotero2.getActiveZoteroPane();
            ZoteroPane2.handleKeyUp({
              originalTarget: { id: ZoteroPane2.itemsView.id },
              keyCode: Zotero2.isWin ? 17 : 18
            });
          }
        },
        {
          id: "closeSelectedTab",
          modifiers: "accel",
          key: "W",
          callback: () => {
            const ztabs = basic_1.BasicTool.getZotero().getMainWindow().Zotero_Tabs;
            if (ztabs.selectedIndex > 0) {
              ztabs.close("");
            }
          }
        },
        {
          id: "undoCloseTab",
          modifiers: "accel,shift",
          key: "T",
          callback: () => {
            const ztabs = basic_1.BasicTool.getZotero().getMainWindow().Zotero_Tabs;
            ztabs.undoClose();
          }
        },
        {
          id: "selectNextTab",
          modifiers: "control",
          key: "Tab",
          callback: () => {
            const ztabs = basic_1.BasicTool.getZotero().getMainWindow().Zotero_Tabs;
            ztabs.selectPrev();
          }
        },
        {
          id: "selectPreviousTab",
          modifiers: "control,shift",
          key: "Tab",
          callback: () => {
            const ztabs = basic_1.BasicTool.getZotero().getMainWindow().Zotero_Tabs;
            ztabs.selectNext();
          }
        },
        {
          id: "selectTab1",
          modifiers: "accel",
          key: "1",
          callback: () => {
            const ztabs = basic_1.BasicTool.getZotero().getMainWindow().Zotero_Tabs;
            ztabs.jump(0);
          }
        },
        {
          id: "selectTab2",
          modifiers: "accel",
          key: "2",
          callback: () => {
            const ztabs = basic_1.BasicTool.getZotero().getMainWindow().Zotero_Tabs;
            ztabs.jump(1);
          }
        },
        {
          id: "selectTab3",
          modifiers: "accel",
          key: "3",
          callback: () => {
            const ztabs = basic_1.BasicTool.getZotero().getMainWindow().Zotero_Tabs;
            ztabs.jump(2);
          }
        },
        {
          id: "selectTab4",
          modifiers: "accel",
          key: "4",
          callback: () => {
            const ztabs = basic_1.BasicTool.getZotero().getMainWindow().Zotero_Tabs;
            ztabs.jump(3);
          }
        },
        {
          id: "selectTab5",
          modifiers: "accel",
          key: "5",
          callback: () => {
            const ztabs = basic_1.BasicTool.getZotero().getMainWindow().Zotero_Tabs;
            ztabs.jump(4);
          }
        },
        {
          id: "selectTab6",
          modifiers: "accel",
          key: "6",
          callback: () => {
            const ztabs = basic_1.BasicTool.getZotero().getMainWindow().Zotero_Tabs;
            ztabs.jump(5);
          }
        },
        {
          id: "selectTab7",
          modifiers: "accel",
          key: "7",
          callback: () => {
            const ztabs = basic_1.BasicTool.getZotero().getMainWindow().Zotero_Tabs;
            ztabs.jump(6);
          }
        },
        {
          id: "selectTab8",
          modifiers: "accel",
          key: "8",
          callback: () => {
            const ztabs = basic_1.BasicTool.getZotero().getMainWindow().Zotero_Tabs;
            ztabs.jump(7);
          }
        },
        {
          id: "selectTabLast",
          modifiers: "accel",
          key: "9",
          callback: () => {
            const ztabs = basic_1.BasicTool.getZotero().getMainWindow().Zotero_Tabs;
            ztabs.selectLast();
          }
        }
      ];
    }
  });

  // node_modules/zotero-plugin-toolkit/dist/helpers/clipboard.js
  var require_clipboard = __commonJS({
    "node_modules/zotero-plugin-toolkit/dist/helpers/clipboard.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.ClipboardHelper = void 0;
      var basic_1 = require_basic();
      var ClipboardHelper = class {
        constructor() {
          this.transferable = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable);
          this.clipboardService = Components.classes["@mozilla.org/widget/clipboard;1"].getService(Components.interfaces.nsIClipboard);
          this.transferable.init(null);
        }
        addText(source, type) {
          const str = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
          str.data = source;
          this.transferable.addDataFlavor(type);
          this.transferable.setTransferData(type, str, source.length * 2);
          return this;
        }
        addImage(source) {
          let parts = source.split(",");
          if (!parts[0].includes("base64")) {
            return this;
          }
          let mime = parts[0].match(/:(.*?);/)[1];
          let bstr = atob(parts[1]);
          let n = bstr.length;
          let u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          let imgTools = Components.classes["@mozilla.org/image/tools;1"].getService(Components.interfaces.imgITools);
          let mimeType;
          let img;
          if (basic_1.BasicTool.getZotero().platformMajorVersion >= 102) {
            img = imgTools.decodeImageFromArrayBuffer(u8arr.buffer, mime);
            mimeType = "application/x-moz-nativeimage";
          } else {
            mimeType = `image/png`;
            img = Components.classes["@mozilla.org/supports-interface-pointer;1"].createInstance(Components.interfaces.nsISupportsInterfacePointer);
            img.data = imgTools.decodeImageFromArrayBuffer(u8arr.buffer, mimeType);
          }
          this.transferable.addDataFlavor(mimeType);
          this.transferable.setTransferData(mimeType, img, 0);
          return this;
        }
        copy() {
          this.clipboardService.setData(this.transferable, null, Components.interfaces.nsIClipboard.kGlobalClipboard);
          return this;
        }
      };
      exports.ClipboardHelper = ClipboardHelper;
    }
  });

  // node_modules/zotero-plugin-toolkit/dist/helpers/filePicker.js
  var require_filePicker = __commonJS({
    "node_modules/zotero-plugin-toolkit/dist/helpers/filePicker.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.FilePickerHelper = void 0;
      var FilePickerHelper = class {
        constructor(title, mode, filters, suggestion) {
          this.title = title;
          this.mode = mode;
          this.filters = filters;
          this.suggestion = suggestion;
        }
        open() {
          const fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(Components.interfaces.nsIFilePicker);
          if (this.suggestion)
            fp.defaultString = this.suggestion;
          this.mode = {
            open: Components.interfaces.nsIFilePicker.modeOpen,
            save: Components.interfaces.nsIFilePicker.modeSave,
            folder: Components.interfaces.nsIFilePicker.modeGetFolder
          }[this.mode];
          fp.init(window, this.title, this.mode);
          for (const [label, ext] of this.filters || []) {
            fp.appendFilter(label, ext);
          }
          return new Promise((resolve) => {
            fp.open((userChoice) => {
              switch (userChoice) {
                case Components.interfaces.nsIFilePicker.returnOK:
                case Components.interfaces.nsIFilePicker.returnReplace:
                  resolve(fp.file.path);
                  break;
                default:
                  resolve(false);
                  break;
              }
            });
          });
        }
      };
      exports.FilePickerHelper = FilePickerHelper;
    }
  });

  // node_modules/zotero-plugin-toolkit/dist/helpers/progressWindow.js
  var require_progressWindow = __commonJS({
    "node_modules/zotero-plugin-toolkit/dist/helpers/progressWindow.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.ProgressWindowHelper = void 0;
      var basic_1 = require_basic();
      var ProgressWindowHelper = class extends Zotero.ProgressWindow {
        /**
         *
         * @param header window header
         * @param options
         */
        constructor(header, options = {
          closeOnClick: true,
          closeTime: 5e3
        }) {
          super(options);
          this.lines = [];
          this.closeTime = options.closeTime || 5e3;
          this.changeHeadline(header);
          this.originalShow = this.show;
          this.show = this.showWithTimer;
          if (options.closeOtherProgressWindows) {
            basic_1.BasicTool.getZotero().ProgressWindowSet.closeAll();
          }
        }
        /**
         * Create a new line
         * @param options
         */
        createLine(options) {
          const icon = this.getIcon(options.type, options.icon);
          const line = new this.ItemProgress(icon || "", options.text || "");
          if (typeof options.progress === "number") {
            line.setProgress(options.progress);
          }
          this.lines.push(line);
          return this;
        }
        /**
         * Change the line content
         * @param options
         */
        changeLine(options) {
          var _a;
          if (((_a = this.lines) === null || _a === void 0 ? void 0 : _a.length) === 0) {
            return this;
          }
          const idx = typeof options.idx !== "undefined" && options.idx >= 0 && options.idx < this.lines.length ? options.idx : 0;
          const icon = this.getIcon(options.type, options.icon);
          options.text && this.lines[idx].setText(options.text);
          icon && this.lines[idx].setIcon(icon);
          typeof options.progress === "number" && this.lines[idx].setProgress(options.progress);
          return this;
        }
        showWithTimer(closeTime = void 0) {
          this.originalShow();
          typeof closeTime !== "undefined" && (this.closeTime = closeTime);
          if (this.closeTime && this.closeTime > 0) {
            this.startCloseTimer(this.closeTime);
          }
          return this;
        }
        /**
         * Set custom icon uri for progress window
         * @param key
         * @param uri
         */
        static setIconURI(key, uri) {
          icons[key] = uri;
        }
        getIcon(type, defaultIcon) {
          return type && type in icons ? icons[type] : defaultIcon;
        }
      };
      exports.ProgressWindowHelper = ProgressWindowHelper;
      var icons = {
        success: "chrome://zotero/skin/tick.png",
        fail: "chrome://zotero/skin/cross.png"
      };
    }
  });

  // node_modules/zotero-plugin-toolkit/dist/helpers/virtualizedTable.js
  var require_virtualizedTable = __commonJS({
    "node_modules/zotero-plugin-toolkit/dist/helpers/virtualizedTable.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.VirtualizedTableHelper = void 0;
      var basic_1 = require_basic();
      var VirtualizedTableHelper = class {
        constructor(win) {
          this.window = win;
          this.basicTool = new basic_1.BasicTool();
          const Zotero2 = this.basicTool.getGlobal("Zotero");
          const _require = win.require;
          this.React = _require("react");
          this.ReactDOM = _require("react-dom");
          this.VirtualizedTable = _require("components/virtualized-table");
          this.IntlProvider = _require("react-intl").IntlProvider;
          this.props = {
            id: `${Zotero2.Utilities.randomString()}-${(/* @__PURE__ */ new Date()).getTime()}`,
            getRowCount: () => 0
          };
          this.localeStrings = Zotero2.Intl.strings;
        }
        setProp(...args) {
          if (args.length === 1) {
            Object.assign(this.props, args[0]);
          } else if (args.length === 2) {
            this.props[args[0]] = args[1];
          }
          return this;
        }
        /**
         * Set locale strings, which replaces the table header's label if matches. Default it's `Zotero.Intl.strings`
         * @param localeStrings
         */
        setLocale(localeStrings) {
          Object.assign(this.localeStrings, localeStrings);
          return this;
        }
        /**
         * Set container element id that the table will be rendered on.
         * @param id element id
         */
        setContainerId(id) {
          this.containerId = id;
          return this;
        }
        /**
         * Render the table.
         * @param selectId Which row to select after rendering
         * @param onfulfilled callback after successfully rendered
         * @param onrejected callback after rendering with error
         */
        render(selectId, onfulfilled, onrejected) {
          const refreshSelection = () => {
            this.treeInstance.invalidate();
            if (typeof selectId !== "undefined" && selectId >= 0) {
              this.treeInstance.selection.select(selectId);
            } else {
              this.treeInstance.selection.clearSelection();
            }
          };
          if (!this.treeInstance) {
            const vtableProps = Object.assign({}, this.props, {
              ref: (ref) => this.treeInstance = ref
            });
            if (vtableProps.getRowData && !vtableProps.renderItem) {
              Object.assign(vtableProps, {
                renderItem: this.VirtualizedTable.makeRowRenderer(vtableProps.getRowData)
              });
            }
            const elem = this.React.createElement(this.IntlProvider, { locale: Zotero.locale, messages: Zotero.Intl.strings }, this.React.createElement(this.VirtualizedTable, vtableProps));
            const container = this.window.document.getElementById(this.containerId);
            new Promise((resolve) => this.ReactDOM.render(elem, container, resolve)).then(() => {
              this.basicTool.getGlobal("setTimeout")(() => {
                refreshSelection();
              });
            }).then(onfulfilled, onrejected);
          } else {
            refreshSelection();
          }
          return this;
        }
      };
      exports.VirtualizedTableHelper = VirtualizedTableHelper;
    }
  });

  // node_modules/zotero-plugin-toolkit/dist/helpers/dialog.js
  var require_dialog = __commonJS({
    "node_modules/zotero-plugin-toolkit/dist/helpers/dialog.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.DialogHelper = void 0;
      var ui_1 = require_ui();
      var DialogHelper = class {
        /**
         * Create a dialog helper with row \* column grids.
         * @param row
         * @param column
         */
        constructor(row, column) {
          if (row <= 0 || column <= 0) {
            throw Error(`row and column must be positive integers.`);
          }
          this.elementProps = {
            tag: "vbox",
            attributes: { flex: 1 },
            styles: {
              width: "100%",
              height: "100%"
            },
            children: []
          };
          for (let i = 0; i < Math.max(row, 1); i++) {
            this.elementProps.children.push({
              tag: "hbox",
              attributes: { flex: 1 },
              children: []
            });
            for (let j = 0; j < Math.max(column, 1); j++) {
              this.elementProps.children[i].children.push({
                tag: "vbox",
                attributes: { flex: 1 },
                children: []
              });
            }
          }
          this.elementProps.children.push({
            tag: "hbox",
            attributes: { flex: 0, pack: "end" },
            children: []
          });
          this.dialogData = {};
        }
        /**
         * Add a cell at (row, column). Index starts from 0.
         * @param row
         * @param column
         * @param elementProps Cell element props. See {@link ElementProps}
         * @param cellFlex If the cell is flex. Default true.
         */
        addCell(row, column, elementProps, cellFlex = true) {
          if (row >= this.elementProps.children.length || column >= this.elementProps.children[row].children.length) {
            throw Error(`Cell index (${row}, ${column}) is invalid, maximum (${this.elementProps.children.length}, ${this.elementProps.children[0].children.length})`);
          }
          this.elementProps.children[row].children[column].children = [
            elementProps
          ];
          this.elementProps.children[row].children[column].attributes.flex = cellFlex ? 1 : 0;
          return this;
        }
        /**
         * Add a control button to the bottom of the dialog.
         * @param label Button label
         * @param id Button id.
         * The corresponding id of the last button user clicks before window exit will be set to `dialogData._lastButtonId`.
         * @param options.noClose Don't close window when clicking this button.
         * @param options.callback Callback of button click event.
         */
        addButton(label, id, options = {}) {
          id = id || `${Zotero.Utilities.randomString()}-${(/* @__PURE__ */ new Date()).getTime()}`;
          this.elementProps.children[this.elementProps.children.length - 1].children.push({
            tag: "vbox",
            styles: {
              margin: "10px"
            },
            children: [
              {
                tag: "button",
                namespace: "html",
                id,
                attributes: {
                  type: "button"
                },
                listeners: [
                  {
                    type: "click",
                    listener: (e) => {
                      this.dialogData._lastButtonId = id;
                      if (options.callback) {
                        options.callback(e);
                      }
                      if (!options.noClose) {
                        this.window.close();
                      }
                    }
                  }
                ],
                children: [
                  {
                    tag: "div",
                    styles: {
                      padding: "2.5px 15px"
                    },
                    properties: {
                      innerHTML: label
                    }
                  }
                ]
              }
            ]
          });
          return this;
        }
        /**
         * Dialog data.
         * @remarks
         * This object is passed to the dialog window.
         *
         * The control button id is in `dialogData._lastButtonId`;
         *
         * The data-binding values are in `dialogData`.
         * ```ts
         * interface DialogData {
         *   [key: string | number | symbol]: any;
         *   loadLock?: _ZoteroTypes.PromiseObject; // resolve after window load (auto-generated)
         *   loadCallback?: Function; // called after window load
         *   unloadLock?: _ZoteroTypes.PromiseObject; // resolve after window unload (auto-generated)
         *   unloadCallback?: Function; // called after window unload
         *   beforeUnloadCallback?: Function; // called before window unload when elements are accessable.
         * }
         * ```
         * @param dialogData
         */
        setDialogData(dialogData) {
          this.dialogData = dialogData;
          return this;
        }
        /**
         * Open the dialog
         * @param title Window title
         * @param windowFeatures.width Ignored if fitContent is `true`.
         * @param windowFeatures.height Ignored if fitContent is `true`.
         * @param windowFeatures.left
         * @param windowFeatures.top
         * @param windowFeatures.centerscreen Open window at the center of screen.
         * @param windowFeatures.resizable If window is resizable.
         * @param windowFeatures.fitContent Resize the window to content size after elements are loaded.
         * @param windowFeatures.noDialogMode Dialog mode window only has a close button. Set `true` to make maximize and minimize button visible.
         */
        open(title, windowFeatures = {
          centerscreen: true,
          resizable: true,
          fitContent: true
        }) {
          this.window = openDialog(`${Zotero.Utilities.randomString()}-${(/* @__PURE__ */ new Date()).getTime()}`, title, this.elementProps, this.dialogData, windowFeatures);
          return this;
        }
      };
      exports.DialogHelper = DialogHelper;
      function openDialog(targetId, title, elementProps, dialogData, windowFeatures = {
        centerscreen: true,
        resizable: true,
        fitContent: true
      }) {
        var _a, _b;
        const uiTool = new ui_1.UITool();
        uiTool.basicOptions.ui.enableElementJSONLog = false;
        uiTool.basicOptions.ui.enableElementRecord = false;
        const Zotero2 = uiTool.getGlobal("Zotero");
        dialogData = dialogData || {};
        if (!dialogData.loadLock) {
          dialogData.loadLock = Zotero2.Promise.defer();
        }
        if (!dialogData.unloadLock) {
          dialogData.unloadLock = Zotero2.Promise.defer();
        }
        let featureString = `resizable=${windowFeatures.resizable ? "yes" : "no"},`;
        if (windowFeatures.width || windowFeatures.height) {
          featureString += `width=${windowFeatures.width || 100},height=${windowFeatures.height || 100},`;
        }
        if (windowFeatures.left) {
          featureString += `left=${windowFeatures.left},`;
        }
        if (windowFeatures.top) {
          featureString += `left=${windowFeatures.top},`;
        }
        if (windowFeatures.centerscreen) {
          featureString += "centerscreen,";
        }
        if (windowFeatures.noDialogMode) {
          featureString += "dialog=no,";
        }
        const win = uiTool.getGlobal("openDialog")("about:blank", targetId || "_blank", featureString, dialogData);
        dialogData.loadLock.promise.then(() => {
          win.document.head.appendChild(uiTool.createElement(win.document, "title", {
            properties: { innerText: title }
          }));
          win.document.head.appendChild(uiTool.createElement(win.document, "style", {
            properties: {
              innerHTML: style
            }
          }));
          replaceElement(elementProps, uiTool);
          win.document.body.appendChild(uiTool.createElement(win.document, "fragment", {
            children: [elementProps]
          }));
          Array.from(win.document.querySelectorAll("*[data-bind]")).forEach((elem) => {
            const bindKey = elem.getAttribute("data-bind");
            const bindAttr = elem.getAttribute("data-attr");
            const bindProp = elem.getAttribute("data-prop");
            if (bindKey && dialogData && dialogData[bindKey]) {
              if (bindProp) {
                elem[bindProp] = dialogData[bindKey];
              } else {
                elem.setAttribute(bindAttr || "value", dialogData[bindKey]);
              }
            }
          });
          if (windowFeatures.fitContent) {
            win.sizeToContent();
          }
          win.focus();
        }).then(() => {
          (dialogData === null || dialogData === void 0 ? void 0 : dialogData.loadCallback) && dialogData.loadCallback();
        });
        dialogData.unloadLock.promise.then(() => {
          (dialogData === null || dialogData === void 0 ? void 0 : dialogData.unloadCallback) && dialogData.unloadCallback();
        });
        win.addEventListener("DOMContentLoaded", function onWindowLoad(ev) {
          var _a2, _b2;
          (_b2 = (_a2 = win.arguments[0]) === null || _a2 === void 0 ? void 0 : _a2.loadLock) === null || _b2 === void 0 ? void 0 : _b2.resolve();
          win.removeEventListener("DOMContentLoaded", onWindowLoad, false);
        }, false);
        win.addEventListener("beforeunload", function onWindowBeforeUnload(ev) {
          Array.from(win.document.querySelectorAll("*[data-bind]")).forEach((elem) => {
            const dialogData2 = this.window.arguments[0];
            const bindKey = elem.getAttribute("data-bind");
            const bindAttr = elem.getAttribute("data-attr");
            const bindProp = elem.getAttribute("data-prop");
            if (bindKey && dialogData2) {
              if (bindProp) {
                dialogData2[bindKey] = elem[bindProp];
              } else {
                dialogData2[bindKey] = elem.getAttribute(bindAttr || "value");
              }
            }
          });
          this.window.removeEventListener("beforeunload", onWindowBeforeUnload, false);
          (dialogData === null || dialogData === void 0 ? void 0 : dialogData.beforeUnloadCallback) && dialogData.beforeUnloadCallback();
        });
        win.addEventListener("unload", function onWindowUnload(ev) {
          var _a2, _b2, _c;
          if ((_a2 = this.window.arguments[0]) === null || _a2 === void 0 ? void 0 : _a2.loadLock.promise.isPending()) {
            return;
          }
          (_c = (_b2 = this.window.arguments[0]) === null || _b2 === void 0 ? void 0 : _b2.unloadLock) === null || _c === void 0 ? void 0 : _c.resolve();
          this.window.removeEventListener("unload", onWindowUnload, false);
        });
        if (win.document.readyState === "complete") {
          (_b = (_a = win.arguments[0]) === null || _a === void 0 ? void 0 : _a.loadLock) === null || _b === void 0 ? void 0 : _b.resolve();
        }
        return win;
      }
      function replaceElement(elementProps, uiTool) {
        var _a, _b, _c, _d, _e, _f, _g;
        let checkChildren = true;
        if (elementProps.tag === "select" && uiTool.isZotero7()) {
          checkChildren = false;
          const customSelectProps = {
            tag: "div",
            classList: ["dropdown"],
            listeners: [
              {
                type: "mouseleave",
                listener: (ev) => {
                  const select = ev.target.querySelector("select");
                  select === null || select === void 0 ? void 0 : select.blur();
                }
              }
            ],
            children: [
              Object.assign({}, elementProps, {
                tag: "select",
                listeners: [
                  {
                    type: "focus",
                    listener: (ev) => {
                      var _a2;
                      const select = ev.target;
                      const dropdown = (_a2 = select.parentElement) === null || _a2 === void 0 ? void 0 : _a2.querySelector(".dropdown-content");
                      dropdown && (dropdown.style.display = "block");
                      select.setAttribute("focus", "true");
                    }
                  },
                  {
                    type: "blur",
                    listener: (ev) => {
                      var _a2;
                      const select = ev.target;
                      const dropdown = (_a2 = select.parentElement) === null || _a2 === void 0 ? void 0 : _a2.querySelector(".dropdown-content");
                      dropdown && (dropdown.style.display = "none");
                      select.removeAttribute("focus");
                    }
                  }
                ]
              }),
              {
                tag: "div",
                classList: ["dropdown-content"],
                children: (_a = elementProps.children) === null || _a === void 0 ? void 0 : _a.map((option) => {
                  var _a2, _b2, _c2;
                  return {
                    tag: "p",
                    attributes: {
                      value: (_a2 = option.properties) === null || _a2 === void 0 ? void 0 : _a2.value
                    },
                    properties: {
                      innerHTML: ((_b2 = option.properties) === null || _b2 === void 0 ? void 0 : _b2.innerHTML) || ((_c2 = option.properties) === null || _c2 === void 0 ? void 0 : _c2.innerText)
                    },
                    classList: ["dropdown-item"],
                    listeners: [
                      {
                        type: "click",
                        listener: (ev) => {
                          var _a3;
                          const select = (_a3 = ev.target.parentElement) === null || _a3 === void 0 ? void 0 : _a3.previousElementSibling;
                          select && (select.value = ev.target.getAttribute("value") || "");
                          select === null || select === void 0 ? void 0 : select.blur();
                        }
                      }
                    ]
                  };
                })
              }
            ]
          };
          for (const key in elementProps) {
            delete elementProps[key];
          }
          Object.assign(elementProps, customSelectProps);
        } else if (elementProps.tag === "a") {
          const href = ((_b = elementProps === null || elementProps === void 0 ? void 0 : elementProps.properties) === null || _b === void 0 ? void 0 : _b.href) || "";
          (_c = elementProps.properties) !== null && _c !== void 0 ? _c : elementProps.properties = {};
          elementProps.properties.href = "javascript:void(0);";
          (_d = elementProps.attributes) !== null && _d !== void 0 ? _d : elementProps.attributes = {};
          elementProps.attributes["zotero-href"] = href;
          (_e = elementProps.listeners) !== null && _e !== void 0 ? _e : elementProps.listeners = [];
          elementProps.listeners.push({
            type: "click",
            listener: (ev) => {
              var _a2;
              const href2 = (_a2 = ev.target) === null || _a2 === void 0 ? void 0 : _a2.getAttribute("zotero-href");
              href2 && uiTool.getGlobal("Zotero").launchURL(href2);
            }
          });
          (_f = elementProps.classList) !== null && _f !== void 0 ? _f : elementProps.classList = [];
          elementProps.classList.push("zotero-text-link");
        }
        if (checkChildren) {
          (_g = elementProps.children) === null || _g === void 0 ? void 0 : _g.forEach((child) => replaceElement(child, uiTool));
        }
      }
      var style = `
html,
body {
  font-size: calc(12px * 1);
}
.zotero-text-link {
  -moz-user-focus: normal;
  color: -moz-nativehyperlinktext;
  text-decoration: underline;
  border: 1px solid transparent;
  cursor: pointer;
}
.dropdown {
  position: relative;
  display: inline-block;
}
.dropdown-content {
  display: none;
  position: absolute;
  background-color: #f9f9fb;
  min-width: 160px;
  box-shadow: 0px 0px 5px 0px rgba(0, 0, 0, 0.5);
  border-radius: 5px;
  padding: 5px 0 5px 0;
  z-index: 999;
}
.dropdown-item {
  margin: 0px;
  padding: 5px 10px 5px 10px;
}
.dropdown-item:hover {
  background-color: #efeff3;
}
`;
    }
  });

  // node_modules/zotero-plugin-toolkit/dist/managers/readerInstance.js
  var require_readerInstance = __commonJS({
    "node_modules/zotero-plugin-toolkit/dist/managers/readerInstance.js"(exports) {
      "use strict";
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.ReaderInstanceManager = void 0;
      var basic_1 = require_basic();
      var toolkitGlobal_1 = __importDefault(require_toolkitGlobal());
      var ReaderInstanceManager = class extends basic_1.ManagerTool {
        constructor(base) {
          super(base);
          this.cachedHookIds = [];
          this.initializeGlobal();
        }
        /**
         * Register a reader instance hook
         * @remarks
         * initialized: called when reader instance is ready
         * @param type hook type
         * @param id hook id
         * @param hook
         */
        register(type, id, hook) {
          const Zotero2 = this.getGlobal("Zotero");
          switch (type) {
            case "initialized":
              {
                this.globalCache.initializedHooks[id] = hook;
                Zotero2.Reader._readers.forEach(hook);
              }
              break;
            default:
              break;
          }
          this.cachedHookIds.push(id);
        }
        /**
         * Unregister hook by id
         * @param id
         */
        unregister(id) {
          delete this.globalCache.initializedHooks[id];
        }
        /**
         * Unregister all hooks
         */
        unregisterAll() {
          this.cachedHookIds.forEach((id) => this.unregister(id));
        }
        initializeGlobal() {
          this.globalCache = toolkitGlobal_1.default.getInstance().readerInstance;
          if (!this.globalCache._ready) {
            this.globalCache._ready = true;
            const Zotero2 = this.getGlobal("Zotero");
            const _this = this;
            Zotero2.Reader._readers = new (this.getGlobal("Proxy"))(Zotero2.Reader._readers, {
              set(target, p, newValue, receiver) {
                target[p] = newValue;
                if (!isNaN(Number(p))) {
                  Object.values(_this.globalCache.initializedHooks).forEach((hook) => {
                    try {
                      hook(newValue);
                    } catch (e) {
                      _this.log(e);
                    }
                  });
                }
                return true;
              }
            });
          }
        }
      };
      exports.ReaderInstanceManager = ReaderInstanceManager;
    }
  });

  // node_modules/zotero-plugin-toolkit/dist/managers/itemBox.js
  var require_itemBox = __commonJS({
    "node_modules/zotero-plugin-toolkit/dist/managers/itemBox.js"(exports) {
      "use strict";
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.ItemBoxManager = void 0;
      var basic_1 = require_basic();
      var fieldHook_1 = require_fieldHook();
      var toolkitGlobal_1 = __importDefault(require_toolkitGlobal());
      var ItemBoxManager = class extends basic_1.ManagerTool {
        constructor(base) {
          super(base);
          this.initializationLock = this.getGlobal("Zotero").Promise.defer();
          this.localCache = [];
          this.fieldHooks = new fieldHook_1.FieldHookManager();
          this.initializeGlobal();
        }
        /**
         * Register a custom row
         * @param field Field name. Used in `getField` and `setField`.
         * @param displayName The row header display text.
         * @param getFieldHook Called when loading row content.
         * If you registered the getField hook somewhere else (in ItemBox or FieldHooks), leave it undefined.
         * @param options
         * @param options.editable If the row is editable.
         * To edit a row, either the `options.setFieldHook` or a custom hook for `setField` created by FieldHookManager is required.
         * @param options.setFieldHook The `setField` hook.
         * @param options.index Target index. By default it's placed at the end of rows.
         * @param options.multiline If the row content is multiline.
         * @param options.collapsible If the row content is collapsible (like abstract field).
         */
        async register(field, displayName, getFieldHook, options = {}) {
          this.fieldHooks.register("isFieldOfBase", field, () => false);
          if (getFieldHook) {
            this.fieldHooks.register("getField", field, getFieldHook);
          }
          if (options.editable && options.setFieldHook) {
            this.fieldHooks.register("setField", field, options.setFieldHook);
          }
          this.globalCache.fieldOptions[field] = {
            field,
            displayName,
            editable: options.editable || false,
            index: options.index || -1,
            multiline: options.multiline || false,
            collapsible: options.collapsible || false
          };
          this.localCache.push(field);
          await this.initializationLock.promise;
          this.refresh();
        }
        /**
         * Unregister a row of specific field.
         * @param field
         * @param options Skip unregister of certain hooks.
         * This is useful when the hook is not initialized by this instance
         * @param options.skipRefresh Skip refresh after unregister.
         */
        unregister(field, options = {}) {
          delete this.globalCache.fieldOptions[field];
          if (!options.skipIsFieldOfBase) {
            this.fieldHooks.unregister("isFieldOfBase", field);
          }
          if (!options.skipGetField) {
            this.fieldHooks.unregister("getField", field);
          }
          if (!options.skipSetField) {
            this.fieldHooks.unregister("setField", field);
          }
          const idx = this.localCache.indexOf(field);
          if (idx > -1) {
            this.localCache.splice(idx, 1);
          }
          if (!options.skipRefresh) {
            this.refresh();
          }
        }
        unregisterAll() {
          [...this.localCache].forEach((field) => this.unregister(field, {
            skipGetField: true,
            skipSetField: true,
            skipIsFieldOfBase: true,
            skipRefresh: true
          }));
          this.fieldHooks.unregisterAll();
          this.refresh();
        }
        /**
         * Refresh all item boxes.
         */
        refresh() {
          try {
            Array.from(this.getGlobal("document").querySelectorAll(this.isZotero7() ? "item-box" : "zoteroitembox")).forEach((elem) => elem.refresh());
          } catch (e) {
            this.log(e);
          }
        }
        async initializeGlobal() {
          const Zotero2 = this.getGlobal("Zotero");
          await Zotero2.uiReadyPromise;
          const window2 = this.getGlobal("window");
          const globalCache = this.globalCache = toolkitGlobal_1.default.getInstance().itemBox;
          const inZotero7 = this.isZotero7();
          if (!globalCache._ready) {
            globalCache._ready = true;
            let itemBoxInstance;
            if (inZotero7) {
              itemBoxInstance = new (this.getGlobal("customElements").get("item-box"))();
            } else {
              itemBoxInstance = window2.document.querySelector("#zotero-editpane-item-box");
              const wait = 5e3;
              let t = 0;
              while (!itemBoxInstance && t < wait) {
                itemBoxInstance = window2.document.querySelector("#zotero-editpane-item-box");
                await Zotero2.Promise.delay(10);
                t += 10;
              }
              if (!itemBoxInstance) {
                globalCache._ready = false;
                this.log("ItemBox initialization failed");
                return;
              }
            }
            this.patch(itemBoxInstance.__proto__, "refresh", this.patchSign, (original) => function() {
              const originalThis = this;
              original.apply(originalThis, arguments);
              for (const extraField of Object.values(globalCache.fieldOptions)) {
                const fieldHeader = document.createElement(inZotero7 ? "th" : "label");
                fieldHeader.setAttribute("fieldname", extraField.field);
                const prefKey = `extensions.zotero.pluginToolkit.fieldCollapsed.${extraField.field}`;
                const collapsed = extraField.multiline && extraField.collapsible && Zotero2.Prefs.get(prefKey, true);
                let headerContent = extraField.displayName;
                if (collapsed) {
                  headerContent = `(...)${headerContent}`;
                }
                if (inZotero7) {
                  let label = document.createElement("label");
                  label.className = "key";
                  label.textContent = headerContent;
                  fieldHeader.appendChild(label);
                } else {
                  fieldHeader.setAttribute("value", headerContent);
                }
                const _clickable = originalThis.clickable;
                originalThis.clickable = extraField.editable;
                const fieldValue = originalThis.createValueElement(originalThis.item.getField(extraField.field), extraField.field, 1099);
                originalThis.clickable = _clickable;
                if (extraField.multiline && !Zotero2.Prefs.get(prefKey, true)) {
                  fieldValue.classList.add("multiline");
                } else if (!inZotero7) {
                  fieldValue.setAttribute("crop", "end");
                  fieldValue.setAttribute("value", fieldValue.innerHTML);
                  fieldValue.innerHTML = "";
                }
                if (extraField.collapsible) {
                  fieldHeader.addEventListener("click", function(ev) {
                    Zotero2.Prefs.set(prefKey, !(Zotero2.Prefs.get(prefKey, true) || false), true);
                    originalThis.refresh();
                  });
                }
                fieldHeader.addEventListener("click", inZotero7 ? function(ev) {
                  var _a;
                  const inputField = (_a = ev.currentTarget.nextElementSibling) === null || _a === void 0 ? void 0 : _a.querySelector("input, textarea");
                  if (inputField) {
                    inputField.blur();
                  }
                } : function(ev) {
                  var _a;
                  const inputField = (_a = ev.currentTarget.nextElementSibling) === null || _a === void 0 ? void 0 : _a.inputField;
                  if (inputField) {
                    inputField.blur();
                  }
                });
                const table = inZotero7 ? originalThis._infoTable : originalThis._dynamicFields;
                let fieldIndex = extraField.index;
                if (fieldIndex === 0) {
                  fieldIndex = 1;
                }
                if (fieldIndex && fieldIndex >= 0 && fieldIndex < table.children.length) {
                  originalThis._beforeRow = table.children[fieldIndex];
                  originalThis.addDynamicRow(fieldHeader, fieldValue, true);
                } else {
                  originalThis.addDynamicRow(fieldHeader, fieldValue);
                }
              }
            });
          }
          this.initializationLock.resolve();
        }
      };
      exports.ItemBoxManager = ItemBoxManager;
    }
  });

  // node_modules/zotero-plugin-toolkit/dist/index.js
  var require_dist = __commonJS({
    "node_modules/zotero-plugin-toolkit/dist/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.ZoteroToolkit = void 0;
      var basic_1 = require_basic();
      var ui_1 = require_ui();
      var reader_1 = require_reader();
      var extraField_1 = require_extraField();
      var itemTree_1 = require_itemTree();
      var prompt_1 = require_prompt();
      var libraryTabPanel_1 = require_libraryTabPanel();
      var readerTabPanel_1 = require_readerTabPanel();
      var menu_1 = require_menu();
      var preferencePane_1 = require_preferencePane();
      var shortcut_1 = require_shortcut();
      var clipboard_1 = require_clipboard();
      var filePicker_1 = require_filePicker();
      var progressWindow_1 = require_progressWindow();
      var virtualizedTable_1 = require_virtualizedTable();
      var dialog_1 = require_dialog();
      var readerInstance_1 = require_readerInstance();
      var fieldHook_1 = require_fieldHook();
      var itemBox_1 = require_itemBox();
      var ZoteroToolkit2 = class extends basic_1.BasicTool {
        constructor() {
          super();
          this.UI = new ui_1.UITool(this);
          this.Reader = new reader_1.ReaderTool(this);
          this.ExtraField = new extraField_1.ExtraFieldTool(this);
          this.FieldHooks = new fieldHook_1.FieldHookManager(this);
          this.ItemTree = new itemTree_1.ItemTreeManager(this);
          this.ItemBox = new itemBox_1.ItemBoxManager(this);
          this.Prompt = new prompt_1.PromptManager(this);
          this.LibraryTabPanel = new libraryTabPanel_1.LibraryTabPanelManager(this);
          this.ReaderTabPanel = new readerTabPanel_1.ReaderTabPanelManager(this);
          this.ReaderInstance = new readerInstance_1.ReaderInstanceManager(this);
          this.Menu = new menu_1.MenuManager(this);
          this.PreferencePane = new preferencePane_1.PreferencePaneManager(this);
          this.Shortcut = new shortcut_1.ShortcutManager(this);
          this.Clipboard = clipboard_1.ClipboardHelper;
          this.FilePicker = filePicker_1.FilePickerHelper;
          this.ProgressWindow = progressWindow_1.ProgressWindowHelper;
          this.VirtualizedTable = virtualizedTable_1.VirtualizedTableHelper;
          this.Dialog = dialog_1.DialogHelper;
        }
        /**
         * Unregister everything created by managers.
         */
        unregisterAll() {
          (0, basic_1.unregister)(this);
        }
      };
      exports.ZoteroToolkit = ZoteroToolkit2;
      exports.default = ZoteroToolkit2;
    }
  });

  // src/index.ts
  var import_basic2 = __toESM(require_basic());

  // src/addon.ts
  var import_zotero_plugin_toolkit = __toESM(require_dist());

  // package.json
  var config = {
    addonName: "Zotero Citation",
    addonID: "zoterocitation@polygon.org",
    addonRef: "zoterocitation",
    addonInstance: "ZoteroCitation",
    releasepage: "https://github.com/muisedestiny/zotero-citation/releases/latest/download/zotero-citation.xpi",
    updaterdf: "https://raw.githubusercontent.com/muisedestiny/zotero-citation/bootstrap/update.json"
  };

  // src/modules/locale.ts
  function initLocale() {
    addon.data.locale = {
      stringBundle: Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService).createBundle(`chrome://${config.addonRef}/locale/addon.properties`)
    };
  }
  function getString(localString) {
    var _a;
    return (_a = addon.data.locale) == null ? void 0 : _a.stringBundle.GetStringFromName(localString);
  }

  // src/modules/citation.ts
  var Citation = class {
    constructor() {
      this.sessions = {};
      this.filterFunctions = [];
      Zotero.ZoteroCitation.api.sessions = this.sessions;
      const filterFunctions = this.filterFunctions;
      try {
        ztoolkit.patch(
          Zotero.CollectionTreeRow.prototype,
          "getItems",
          config.addonRef,
          (original) => function() {
            return __async(this, null, function* () {
              let items = yield original.call(this);
              for (let i = 0; i < filterFunctions.length; i++) {
                items = filterFunctions[i](items);
              }
              return items;
            });
          }
        );
      } catch (e) {
      }
    }
    /**
     * 删除历史清除失效的文件夹
     */
    clearSearch() {
      return __async(this, null, function* () {
        var _a;
        let i = 0;
        while (true) {
          let row = ZoteroPane.collectionsView.getRow(i);
          if (!row) {
            break;
          }
          if (((_a = row == null ? void 0 : row.ref) == null ? void 0 : _a._ObjectType) == "Search") {
            const conditions = row.ref.getConditions();
            if (Object.values(conditions).length == 1) {
              const condition = conditions[0];
              if (condition.condition == "title" && condition.value == "") {
                const search = row.ref;
                if (Object.values(this.sessions).map((s) => {
                  var _a2;
                  return (_a2 = s.search) == null ? void 0 : _a2.key;
                }).indexOf(search.key) == -1) {
                  yield search.eraseTx();
                  console.log("delete", search.name);
                  i -= 1;
                }
              }
            }
          }
          i += 1;
        }
      });
    }
    /**
     * 监听session状态以生成搜索目录
     */
    listener(t) {
      return __async(this, null, function* () {
        let isExecCommand = false;
        this.intervalID = window.setInterval(() => __async(this, null, function* () {
          if (!Zotero.ZoteroCitation) {
            return this.clear();
          }
          if (!Zotero.Integration.currentSession || isExecCommand) {
            return;
          }
          let sessions = Zotero.Integration.sessions;
          let _sessions2 = this.sessions;
          for (let sessionID in sessions) {
            let session = sessions[sessionID], _session;
            if (!session.agent.includes("Word")) {
              continue;
            }
            if (sessionID in _sessions2) {
              _session = _sessions2[sessionID];
            } else {
              _sessions2[sessionID] = _session = { search: void 0, idData: {}, pending: true };
              yield this.initSearch(sessionID);
              _session.pending = false;
            }
            if (_session.pending == true && !_session.search) {
              return;
            }
            let citationsByItemID = session.citationsByItemID;
            let sortedItemIDs = this.getSortedItemIDs(session.citationsByIndex);
            this.updateCitations(sessionID, citationsByItemID, sortedItemIDs);
          }
        }), t);
        window.addEventListener("close", (event) => {
          event.preventDefault();
          try {
            this.clear();
          } catch (e) {
          }
          window.setTimeout(() => {
            window.close();
          });
        });
        const execCommand = Zotero.Integration.execCommand;
        let _sessions = this.sessions;
        const OS = window.OS;
        Zotero.Integration.execCommand = function(_0, _1, _2) {
          return __async(this, arguments, function* (agent, command, docId) {
            console.log(...arguments);
            isExecCommand = true;
            yield execCommand(...arguments);
            isExecCommand = false;
            if (docId.endsWith("__doc__")) {
              return;
            }
            let id = window.setInterval(() => __async(this, null, function* () {
              var _a, _b;
              const sessionID = (_b = (_a = Zotero.Integration) == null ? void 0 : _a.currentSession) == null ? void 0 : _b.sessionID;
              if (!sessionID) {
                console.log("sessionID is null, waiting...");
                return;
              }
              window.clearInterval(id);
              console.log("clear interval");
              let _session;
              while (!((_session != null ? _session : _session = _sessions[sessionID]) && _session.search)) {
                yield Zotero.Promise.delay(10);
              }
              console.log(_sessions);
              if ([sessionID, _session.lastName].indexOf(_session.search.name) != -1) {
                const targetName = OS.Path.basename(docId);
                console.log(`${_session.search.name}->${targetName}`);
                if (targetName && targetName.trim().length > 0) {
                  _session.search.name = _session.lastName = targetName;
                  yield _session.search.saveTx({ skipSelect: true });
                }
              }
            }), 0);
          });
        };
      });
    }
    getSortedItemIDs(citationsByIndex) {
      let SortedItemIDs = [];
      for (let i in citationsByIndex) {
        citationsByIndex[i].citationItems.forEach((item) => {
          if (SortedItemIDs.indexOf(item.id) == -1) {
            SortedItemIDs.push(item.id);
          }
        });
      }
      return SortedItemIDs;
    }
    updateCitations(sessionID, citationsByItemID, sortedItemIDs) {
      let getPlainCitation = (id) => sortedItemIDs.indexOf(Number(id)) + ": " + citationsByItemID[id].map((i) => i.properties.plainCitation).join(", ");
      const targetData = {};
      for (let id of Object.keys(citationsByItemID)) {
        targetData[id] = { plainCitation: getPlainCitation(id) };
      }
      if (JSON.stringify(targetData) == JSON.stringify(this.sessions[sessionID].idData)) {
        return;
      } else {
        this.sessions[sessionID].idData = targetData;
        ZoteroPane.itemsView.refreshAndMaintainSelection();
      }
    }
    initSearch(sessionID) {
      return __async(this, null, function* () {
        let search = new Zotero.Search();
        search.addCondition("title", "contains", "");
        yield search.search();
        search.name = sessionID;
        const session = this.sessions[sessionID];
        session.search = search = search.clone(1);
        yield search.saveTx({ skipSelect: true });
        this.filterFunctions.push(
          (items) => {
            let selectedSearch = ZoteroPane.collectionsView.getSelectedSearch();
            if (selectedSearch.key == search.key) {
              const ids = Object.keys(session.idData).map((id) => Number(id));
              return items.filter((item) => ids.indexOf(item.id) != -1);
            } else {
              return items;
            }
          }
        );
        window.setTimeout(() => __async(this, null, function* () {
          yield this.clearSearch();
        }), 233);
      });
    }
    /**
     * 退出时调用
     */
    clear() {
      window.clearInterval(this.intervalID);
      Object.values(this.sessions).forEach((session) => __async(this, null, function* () {
        yield session.search.eraseTx();
      }));
    }
  };

  // src/modules/cite.ts
  var citeItems = () => __async(void 0, null, function* () {
    var _a, _b, _c, _d;
    const cite = Zotero.Integration.Session.prototype.cite;
    Zotero.Integration.Session.prototype.cite = function(field, addNote = false) {
      return __async(this, null, function* () {
        var newField;
        var citation;
        if (field) {
          field = yield Zotero.Integration.Field.loadExisting(field);
          if (field.type != 1) {
            throw new Zotero.Exception.Alert("integration.error.notInCitation");
          }
          citation = new Zotero.Integration.Citation(field, yield field.unserialize(), yield field.getNoteIndex());
        } else {
          newField = true;
          field = new Zotero.Integration.CitationField(yield this.addField(true));
          citation = new Zotero.Integration.Citation(field);
        }
        yield citation.prepareForEditing();
        var fieldIndexPromise, citationsByItemIDPromise;
        if (!this.data.prefs.delayCitationUpdates || !Object.keys(this.citationsByItemID).length || this._sessionUpToDate) {
          fieldIndexPromise = this.getFields().then(function(fields2) {
            return __async(this, null, function* () {
              for (var i = 0, n = fields2.length; i < n; i++) {
                if (yield fields2[i].equals(field._field)) {
                  field = new Zotero.Integration.CitationField(fields2[i]);
                  return i;
                }
              }
              return -1;
            });
          });
          citationsByItemIDPromise = this.updateFromDocument(0).then(function() {
            return this.citationsByItemID;
          }.bind(this));
        } else {
          fieldIndexPromise = Zotero.Promise.resolve(-1);
          citationsByItemIDPromise = Zotero.Promise.resolve(this.citationsByItemID);
        }
        var io = new Zotero.Integration.CitationEditInterface(
          citation,
          this.style.opt.sort_citations,
          fieldIndexPromise,
          citationsByItemIDPromise
        );
        let items;
        if (Zotero_Tabs.selectedIndex == 0) {
          items = ZoteroPane.getSelectedItems();
        } else {
          items = [
            Zotero.Items.get(
              Zotero.Reader.getByTabID(Zotero_Tabs.selectedID).itemID
            ).parentItem
          ];
        }
        items.map((i) => {
          const id = i.id;
          if (!io.citation.citationItems.find((i2) => i2.id == id)) {
            io.citation.citationItems.push({ id });
          }
        });
        if (!io.citation.citationItems.length) {
          if (newField) {
            try {
              yield field.delete();
            } catch (e) {
            }
          }
          throw new Zotero.Exception.UserCancelled("inserting citation");
        }
        var fieldIndex = yield fieldIndexPromise;
        yield citationsByItemIDPromise;
        let citations = yield this._insertCitingResult(fieldIndex, field, io.citation);
        if (!this.data.prefs.delayCitationUpdates) {
          if (citations.length != 1) {
            var fields = yield this.getFields(true);
          }
          yield this.updateFromDocument(0);
        }
        for (let citation2 of citations) {
          if (fields) {
            citation2._field = new Zotero.Integration.CitationField(fields[citation2._fieldIndex]);
          }
          yield this.addCitation(citation2._fieldIndex, yield citation2._field.getNoteIndex(), citation2);
        }
        return citations;
      });
    };
    if (Zotero.isMac) {
      yield Zotero.Integration.execCommand(
        ((_b = (_a = Zotero.Integration) == null ? void 0 : _a.currentSession) == null ? void 0 : _b.agent) || "MacWord16",
        "addEditCitation",
        "/Applications/Microsoft Word.app/",
        1
      );
    } else {
      yield Zotero.Integration.execCommand(
        ((_d = (_c = Zotero.Integration) == null ? void 0 : _c.currentSession) == null ? void 0 : _d.agent) || "WinWord",
        "addEditCitation",
        "__doc__",
        1
      );
    }
    Zotero.Integration.Session.prototype.cite = cite;
  });

  // src/modules/views.ts
  var Views = class {
    constructor() {
      initLocale();
    }
    createCitationColumn() {
      return __async(this, null, function* () {
        const key = "citation";
        yield ztoolkit.ItemTree.register(
          key,
          getString("column.citation"),
          (field, unformatted, includeBaseMapped, item) => {
            try {
              let currentSession = Zotero.Integration.currentSession;
              if (!currentSession) {
                return "";
              }
              const search = ZoteroPane.collectionsView.getSelectedSearch() || Zotero.ZoteroCitation.api.sessions[currentSession.sessionID].search;
              if (!search) {
                return "";
              }
              const session = Object.values(Zotero.ZoteroCitation.api.sessions).find((session2) => session2.search.key == search.key);
              if (session) {
                return session.idData[item.id].plainCitation;
              }
            } catch (e) {
              return "";
            }
          },
          {
            renderCellHook(index, data, column) {
              const div = document.querySelector(`#item-tree-main-default-row-${index}`);
              if (div && div.getAttribute("_dragend") != "true") {
                div.addEventListener("dragend", (event) => {
                  const docRect = document.documentElement.getBoundingClientRect();
                  const winRect = { left: window.screenX, top: window.screenY, width: docRect.width, height: docRect.height };
                  const left = event.screenX, top = event.screenY;
                  if (left > winRect.left && left < winRect.left + winRect.width && top > winRect.top && left < winRect.top + winRect.height) {
                    return;
                  }
                  Zotero[config.addonInstance].api.citeItems();
                }, { passive: true });
                div.setAttribute("_dragend", "true");
              }
              const span = ztoolkit.UI.createElement(document, "span");
              if (data == "") {
                return span;
              } else {
                span.innerText = data.replace(/\d+:\s*/, "");
                return span;
              }
            }
          }
        );
      });
    }
    dragCite() {
      return __async(this, null, function* () {
        ztoolkit.patch(
          ZoteroPane.itemsView,
          "onDragStart",
          config.addonRef,
          (original) => (event, row) => __async(this, null, function* () {
            if (ZoteroPane.itemsView.tree._columns._columns.find((i) => i.dataKey == "citation").hidden) {
              yield original(event, row);
            } else {
              event.dataTransfer.setData("text/plain", " ");
              event.dataTransfer.setData("text/html", " ");
              event.dataTransfer.setData("zotero/item", "");
            }
          })
        );
      });
    }
    patchIcon() {
      return __async(this, null, function* () {
        try {
          ztoolkit.patch(
            ZoteroPane.collectionsView,
            "renderItem",
            config.addonRef,
            (original) => (index, selection, oldDiv, columns) => {
              var _a;
              const div = original.call(ZoteroPane.collectionsView, index, selection, oldDiv, columns);
              const row = ZoteroPane.collectionsView.getRow(index);
              if (Object.values(Zotero.ZoteroCitation.api.sessions).map((s) => {
                var _a2;
                return (_a2 = s.search) == null ? void 0 : _a2.key;
              }).indexOf((_a = row == null ? void 0 : row.ref) == null ? void 0 : _a.key) != -1) {
                const iconNode = div.querySelector(".cell-icon");
                iconNode.style.backgroundImage = `url(chrome://${config.addonRef}/content/icons/word.png)`;
              }
              return div;
            }
          );
        } catch (e) {
        }
      });
    }
  };
  var views_default = Views;

  // src/hooks.ts
  function onStartup() {
    return __async(this, null, function* () {
      yield Promise.all([
        Zotero.initializationPromise,
        Zotero.unlockPromise,
        Zotero.uiReadyPromise
      ]);
      initLocale();
      ztoolkit.UI.basicOptions.ui.enableElementRecord = false;
      ztoolkit.UI.basicOptions.ui.enableElementJSONLog = false;
      Zotero[config.addonInstance].api.citeItems = citeItems;
      const citation = new Citation();
      yield citation.listener(1e3);
      const views = new views_default();
      yield views.patchIcon();
      yield views.createCitationColumn();
      yield views.dragCite();
      document.addEventListener(
        "keydown",
        (event) => {
          if (event.key.toLowerCase() == "'") {
            if (event.originalTarget.isContentEditable || "value" in event.originalTarget) {
              return;
            }
            event.preventDefault();
            event.stopPropagation();
            citeItems();
          }
        },
        true
      );
    });
  }
  function onShutdown() {
    ztoolkit.unregisterAll();
    ztoolkit.Prompt.unregisterAll();
    addon.data.alive = false;
    delete Zotero[config.addonInstance];
  }
  var hooks_default = {
    onStartup,
    onShutdown
  };

  // src/addon.ts
  var import_basic = __toESM(require_basic());
  var import_ui = __toESM(require_ui());
  var import_preferencePane = __toESM(require_preferencePane());
  var Addon = class {
    constructor() {
      this.data = {
        alive: true,
        env: "production",
        // ztoolkit: new MyToolkit(),
        ztoolkit: new import_zotero_plugin_toolkit.default()
      };
      this.hooks = hooks_default;
      this.api = {};
    }
  };
  var addon_default = Addon;

  // src/index.ts
  var basicTool = new import_basic2.BasicTool();
  if (!basicTool.getGlobal("Zotero")[config.addonInstance]) {
    _globalThis.Zotero = basicTool.getGlobal("Zotero");
    _globalThis.ZoteroPane = basicTool.getGlobal("ZoteroPane");
    _globalThis.Zotero_Tabs = basicTool.getGlobal("Zotero_Tabs");
    _globalThis.window = basicTool.getGlobal("window");
    _globalThis.document = basicTool.getGlobal("document");
    _globalThis.addon = new addon_default();
    _globalThis.ztoolkit = addon.data.ztoolkit;
    ztoolkit.basicOptions.log.prefix = `[${config.addonName}]`;
    ztoolkit.basicOptions.log.disableConsole = addon.data.env === "production";
    ztoolkit.UI.basicOptions.ui.enableElementJSONLog = addon.data.env === "development";
    Zotero[config.addonInstance] = addon;
    addon.hooks.onStartup();
  }
})();
