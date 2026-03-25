(function () {
    'use strict';

    var storageKey = 'accessibilityToolbarSettings';
    var minimumContrastRatio = 4.5;
    var dynamicStyleId = 'accessibility-toolbar-dynamic-style';
    var widgetBaseStyleId = 'accessibility-toolbar-widget-base-style';

    var defaultSettings = {
        textSize: 100,
        font: 'default',
        highContrast: false,
        underlineLinks: false,
        lineSpacing: false,
        letterSpacing: false,
        enhancedFocus: false,
        customColours: false,
        customTextColour: '#111111',
        customBackgroundColour: '#ffffff'
    };

    var settings = loadSettings();

    document.addEventListener('DOMContentLoaded', function () {
        var wrapper = document.getElementById('accessibility-toolbar-wrapper');
        var toggleButton = document.getElementById('accessibility-toggle');
        var panel = document.getElementById('accessibility-panel');
        var fontSelect = document.getElementById('accessibility-font-select');
        var textColourInput = document.getElementById('accessibility-text-colour');
        var backgroundColourInput = document.getElementById('accessibility-background-colour');

        if (!wrapper || !toggleButton || !panel) {
            return;
        }

        moveWidgetToTopOfBody(wrapper);
        ensureWidgetBaseStyleElement();
        ensureDynamicStyleElement();
        applySettings();
        syncUiStates();

        toggleButton.addEventListener('click', function () {
            togglePanel(toggleButton, panel);
        });

        panel.addEventListener('click', function (event) {
            var target = event.target.closest('button');

            if (!target) {
                return;
            }

            var action = target.getAttribute('data-action');

            if (!action) {
                return;
            }

            handleAction(action);
            applySettings();
            syncUiStates();
            saveSettings();

            if (action === 'reset-all') {
                announce(wrapper.getAttribute('data-msg-reset-all'));
            } else if (action === 'text-increase' || action === 'text-decrease' || action === 'text-reset') {
                announceTextSize(wrapper);
            } else if (action === 'reset-custom-colours') {
                announce(wrapper.getAttribute('data-msg-custom-colours-reset'));
            }
        });

        if (fontSelect) {
            fontSelect.addEventListener('change', function () {
                settings.font = this.value;
                applySettings();
                syncUiStates();
                saveSettings();
                announce(formatMessage(wrapper.getAttribute('data-msg-font'), getFontLabel(this)));
            });
        }

        if (textColourInput) {
            textColourInput.addEventListener('input', function () {
                settings.customTextColour = normalizeHexColour(this.value, defaultSettings.customTextColour);
                applySettings();
                syncUiStates();
                saveSettings();

                if (settings.customColours) {
                    announceCustomColourState(wrapper);
                }
            });
        }

        if (backgroundColourInput) {
            backgroundColourInput.addEventListener('input', function () {
                settings.customBackgroundColour = normalizeHexColour(this.value, defaultSettings.customBackgroundColour);
                applySettings();
                syncUiStates();
                saveSettings();

                if (settings.customColours) {
                    announceCustomColourState(wrapper);
                }
            });
        }

        panel.addEventListener('change', function (event) {
            var target = event.target;

            if (!target || !target.matches('[data-toggle]')) {
                return;
            }

            var toggleName = target.getAttribute('data-toggle');
            var previousHighContrast = settings.highContrast;
            var previousCustomColours = settings.customColours;

            handleToggle(toggleName, target.checked);
            applySettings();
            syncUiStates();
            saveSettings();

            var label = getToggleLabel(target);
            var messageTemplate = target.checked
                ? wrapper.getAttribute('data-msg-enabled')
                : wrapper.getAttribute('data-msg-disabled');

            announce(formatMessage(messageTemplate, label));

            if (toggleName === 'custom-colours' && target.checked) {
                if (previousHighContrast) {
                    announce(wrapper.getAttribute('data-msg-high-contrast-disabled'));
                }
                announceCustomColourState(wrapper);
            }

            if (toggleName === 'high-contrast' && target.checked && previousCustomColours) {
                announce(wrapper.getAttribute('data-msg-custom-colours-disabled'));
            }
        });

        enableEnterOnToggleCards(panel);

        document.addEventListener('click', function (event) {
            if (
                !panel.hasAttribute('hidden') &&
                !panel.contains(event.target) &&
                !toggleButton.contains(event.target)
            ) {
                panel.setAttribute('hidden', 'hidden');
                toggleButton.setAttribute('aria-expanded', 'false');
            }
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && !panel.hasAttribute('hidden')) {
                panel.setAttribute('hidden', 'hidden');
                toggleButton.setAttribute('aria-expanded', 'false');
                toggleButton.focus();
            }
        });
    });

    function moveWidgetToTopOfBody(wrapper) {
        if (!document.body || !wrapper) {
            return;
        }

        if (document.body.firstChild !== wrapper) {
            document.body.insertBefore(wrapper, document.body.firstChild);
        }
    }

    function togglePanel(toggleButton, panel) {
        var isHidden = panel.hasAttribute('hidden');

        if (isHidden) {
            panel.removeAttribute('hidden');
            toggleButton.setAttribute('aria-expanded', 'true');
            panel.focus();
        } else {
            panel.setAttribute('hidden', 'hidden');
            toggleButton.setAttribute('aria-expanded', 'false');
        }
    }

    function handleAction(action) {
        switch (action) {
            case 'text-increase':
                settings.textSize = Math.min(settings.textSize + 10, 200);
                break;

            case 'text-decrease':
                settings.textSize = Math.max(settings.textSize - 10, 70);
                break;

            case 'text-reset':
                settings.textSize = 100;
                break;

            case 'reset-custom-colours':
                settings.customTextColour = defaultSettings.customTextColour;
                settings.customBackgroundColour = defaultSettings.customBackgroundColour;
                break;

            case 'reset-all':
                settings = cloneDefaults();
                break;
        }
    }

    function handleToggle(toggle, state) {
        switch (toggle) {
            case 'high-contrast':
                settings.highContrast = state;
                if (state) {
                    settings.customColours = false;
                }
                break;

            case 'underline-links':
                settings.underlineLinks = state;
                break;

            case 'line-spacing':
                settings.lineSpacing = state;
                break;

            case 'letter-spacing':
                settings.letterSpacing = state;
                break;

            case 'enhanced-focus':
                settings.enhancedFocus = state;
                break;

            case 'custom-colours':
                settings.customColours = state;
                if (state) {
                    settings.highContrast = false;
                }
                break;
        }
    }

    function applySettings() {
        var body = document.body;
        var root = document.documentElement;

        if (!body) {
            return;
        }

        body.style.setProperty('--at-text-scale', String(settings.textSize / 100));
        body.style.setProperty('--at-custom-text-colour', settings.customTextColour);
        body.style.setProperty('--at-custom-background-colour', settings.customBackgroundColour);

        if (root) {
            root.style.setProperty('--at-custom-text-colour', settings.customTextColour);
            root.style.setProperty('--at-custom-background-colour', settings.customBackgroundColour);
        }

        body.classList.add('at-text-resize');

        body.classList.remove(
            'at-font-arial',
            'at-font-verdana',
            'at-font-comic-sans',
            'at-font-open-dyslexic'
        );

        if (settings.font === 'arial') {
            body.classList.add('at-font-arial');
        } else if (settings.font === 'verdana') {
            body.classList.add('at-font-verdana');
        } else if (settings.font === 'comic-sans') {
            body.classList.add('at-font-comic-sans');
        } else if (settings.font === 'open-dyslexic') {
            body.classList.add('at-font-open-dyslexic');
        }

        var customColoursEnabled = settings.customColours && hasValidCustomContrast();

        body.classList.toggle('at-high-contrast', settings.highContrast);
        body.classList.toggle('at-underline-links', settings.underlineLinks);
        body.classList.toggle('at-line-spacing', settings.lineSpacing);
        body.classList.toggle('at-letter-spacing', settings.letterSpacing);
        body.classList.toggle('at-enhanced-focus', settings.enhancedFocus);
        body.classList.toggle('at-custom-colours', customColoursEnabled);

        if (root) {
            root.classList.toggle('at-high-contrast', settings.highContrast);
            root.classList.toggle('at-custom-colours', customColoursEnabled);
        }

        updateDynamicStyles();
    }

    function ensureWidgetBaseStyleElement() {
        var styleElement = document.getElementById(widgetBaseStyleId);

        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = widgetBaseStyleId;
            styleElement.textContent = buildWidgetBaseCss();
            document.head.appendChild(styleElement);
        }
    }

    function buildWidgetBaseCss() {
        return [
            'html body #accessibility-toolbar-wrapper {',
            '  position: fixed !important;',
            '  top: 50% !important;',
            '  right: 1rem !important;',
            '  transform: translateY(-50%) !important;',
            '  z-index: 99999 !important;',
            '  font-size: 14px !important;',
            '  line-height: 1.4 !important;',
            '}',

            'html body #accessibility-toolbar-wrapper,',
            'html body #accessibility-toolbar-wrapper * {',
            '  font-family: Arial, Helvetica, sans-serif !important;',
            '  box-sizing: border-box !important;',
            '}',

            'html body #accessibility-toolbar-wrapper svg,',
            'html body #accessibility-toolbar-wrapper svg * {',
            '  font-family: initial !important;',
            '}',

            'html body #accessibility-toolbar-wrapper .accessibility-toggle {',
            '  width: 58px !important;',
            '  height: 58px !important;',
            '  border: none !important;',
            '  border-radius: 10px !important;',
            '  background: #222 !important;',
            '  background-color: #222 !important;',
            '  color: #fff !important;',
            '  font-size: 29px !important;',
            '  cursor: pointer !important;',
            '  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.20) !important;',
            '  display: inline-flex !important;',
            '  align-items: center !important;',
            '  justify-content: center !important;',
            '  padding: 0 !important;',
            '  text-transform: none !important;',
            '  letter-spacing: normal !important;',
            '  text-decoration: none !important;',
            '}',

            'html body #accessibility-toolbar-wrapper .accessibility-toggle:hover {',
            '  background: #111 !important;',
            '  background-color: #111 !important;',
            '}',

            'html body #accessibility-toolbar-wrapper .accessibility-toggle:focus {',
            '  outline: 3px solid #0b57d0 !important;',
            '  outline-offset: 3px !important;',
            '}',

            'html body #accessibility-toolbar-wrapper .accessibility-toggle-icon {',
            '  width: 1em !important;',
            '  height: 1em !important;',
            '  display: block !important;',
            '  fill: currentColor !important;',
            '}',

            'html body #accessibility-toolbar-wrapper .accessibility-panel {',
            '  position: absolute !important;',
            '  right: 76px !important;',
            '  top: 50% !important;',
            '  transform: translateY(-50%) !important;',
            '  width: 560px !important;',
            '  max-width: min(96vw, 560px) !important;',
            '  max-height: calc(100vh - 2rem) !important;',
            '  overflow-y: auto !important;',
            '  overflow-x: hidden !important;',
            '  overscroll-behavior: contain !important;',
            '  background: #fff !important;',
            '  background-color: #fff !important;',
            '  color: #111 !important;',
            '  border: 1px solid #d8d8d8 !important;',
            '  border-radius: 16px !important;',
            '  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.18) !important;',
            '  padding: 1.25rem !important;',
            '}',

            'html body #accessibility-toolbar-wrapper .accessibility-panel-inner {',
            '  font-size: 16px !important;',
            '  padding-bottom: 0.25rem !important;',
            '}',

            'html body #accessibility-toolbar-wrapper .accessibility-title {',
            '  margin: 0 0 1rem 0 !important;',
            '  font-size: 24px !important;',
            '  line-height: 1.2 !important;',
            '  font-weight: 700 !important;',
            '  color: #111 !important;',
            '}',

            'html body #accessibility-toolbar-wrapper .accessibility-group {',
            '  margin: 0 !important;',
            '  padding: 1rem 0 !important;',
            '  border-top: 1px solid #e4e4e4 !important;',
            '}',

            'html body #accessibility-toolbar-wrapper .accessibility-group:first-of-type {',
            '  border-top: none !important;',
            '  padding-top: 0.25rem !important;',
            '}',

            'html body #accessibility-toolbar-wrapper .accessibility-group-last {',
            '  padding-bottom: 0 !important;',
            '}',

            'html body #accessibility-toolbar-wrapper .accessibility-section-header {',
            '  margin-bottom: 0.85rem !important;',
            '}',

            'html body #accessibility-toolbar-wrapper .accessibility-group-title {',
            '  margin: 0 0 0.3rem 0 !important;',
            '  font-size: 21px !important;',
            '  line-height: 1.25 !important;',
            '  font-weight: 700 !important;',
            '  color: #111 !important;',
            '}',

            'html body #accessibility-toolbar-wrapper .accessibility-group-help,',
            'html body #accessibility-toolbar-wrapper .accessibility-toggle-card-description,',
            'html body #accessibility-toolbar-wrapper .accessibility-contrast-status {',
            '  font-size: 16px !important;',
            '  line-height: 1.45 !important;',
            '  color: #555 !important;',
            '}',

            'html body #accessibility-toolbar-wrapper .accessibility-inline-row {',
            '  display: flex !important;',
            '  flex-wrap: wrap !important;',
            '  align-items: center !important;',
            '  gap: 0.85rem !important;',
            '}',

            'html body #accessibility-toolbar-wrapper .accessibility-stepper {',
            '  display: inline-flex !important;',
            '  align-items: center !important;',
            '  border: 1px solid #cfcfcf !important;',
            '  border-radius: 12px !important;',
            '  overflow: hidden !important;',
            '  background: #fafafa !important;',
            '}',

            'html body #accessibility-toolbar-wrapper .accessibility-stepper-button {',
            '  min-width: 56px !important;',
            '  min-height: 50px !important;',
            '  border: none !important;',
            '  background: #f4f4f4 !important;',
            '  color: #111 !important;',
            '  cursor: pointer !important;',
            '  font-size: 24px !important;',
            '  line-height: 1 !important;',
            '  padding: 0 !important;',
            '  display: inline-flex !important;',
            '  align-items: center !important;',
            '  justify-content: center !important;',
            '}',

            'html body #accessibility-toolbar-wrapper .accessibility-stepper-button > span {',
            '  display: inline-flex !important;',
            '  align-items: center !important;',
            '  justify-content: center !important;',
            '  width: 100% !important;',
            '  height: 100% !important;',
            '  line-height: 1 !important;',
            '}',

            'html body #accessibility-toolbar-wrapper .accessibility-stepper-button:hover {',
            '  background: #ebebeb !important;',
            '}',

            'html body #accessibility-toolbar-wrapper .accessibility-stepper-button:focus {',
            '  outline: 3px solid #0b57d0 !important;',
            '  outline-offset: -3px !important;',
            '}',

            'html body #accessibility-toolbar-wrapper .accessibility-stepper-value {',
            '  min-width: 96px !important;',
            '  min-height: 50px !important;',
            '  display: inline-flex !important;',
            '  align-items: center !important;',
            '  justify-content: center !important;',
            '  padding: 0 1rem !important;',
            '  background: #fff !important;',
            '  color: #111 !important;',
            '  border-left: 1px solid #d8d8d8 !important;',
            '  border-right: 1px solid #d8d8d8 !important;',
            '  font-size: 16px !important;',
            '  font-weight: 700 !important;',
            '}',

            'html body #accessibility-toolbar-wrapper .accessibility-secondary-button,',
            'html body #accessibility-toolbar-wrapper .accessibility-reset-button {',
            '  display: inline-flex !important;',
            '  align-items: center !important;',
            '  justify-content: center !important;',
            '  min-height: 48px !important;',
            '  padding: 0.75rem 1rem !important;',
            '  border: 1px solid #444 !important;',
            '  background: #f4f4f4 !important;',
            '  color: #111 !important;',
            '  border-radius: 12px !important;',
            '  cursor: pointer !important;',
            '  font-size: 16px !important;',
            '  line-height: 1.2 !important;',
            '  text-transform: none !important;',
            '  letter-spacing: normal !important;',
            '  text-decoration: none !important;',
            '  box-shadow: none !important;',
            '}',

            'html body #accessibility-toolbar-wrapper .accessibility-secondary-button:hover,',
            'html body #accessibility-toolbar-wrapper .accessibility-reset-button:hover {',
            '  background: #e9e9e9 !important;',
            '}',

            'html body #accessibility-toolbar-wrapper .accessibility-secondary-button:focus,',
            'html body #accessibility-toolbar-wrapper .accessibility-reset-button:focus,',
            'html body #accessibility-toolbar-wrapper .accessibility-select:focus,',
            'html body #accessibility-toolbar-wrapper .accessibility-colour-input:focus,',
            'html body #accessibility-toolbar-wrapper .accessibility-toggle-card:focus-within {',
            '  outline: 3px solid #0b57d0 !important;',
            '  outline-offset: 3px !important;',
            '}',

            'html body #accessibility-toolbar-wrapper .accessibility-reset-button {',
            '  width: 100% !important;',
            '}',

            'html body #accessibility-toolbar-wrapper .accessibility-select {',
            '  width: 100% !important;',
            '  min-height: 50px !important;',
            '  border: 1px solid #cfcfcf !important;',
            '  border-radius: 12px !important;',
            '  background: #fff !important;',
            '  color: #111 !important;',
            '  padding: 0.85rem 0.95rem !important;',
            '  font-size: 16px !important;',
            '  line-height: 1.2 !important;',
            '}',

            'html body #accessibility-toolbar-wrapper .accessibility-toggle-list {',
            '  display: grid !important;',
            '  gap: 0.8rem !important;',
            '}',

            'html body #accessibility-toolbar-wrapper .accessibility-toggle-list-two-columns {',
            '  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;',
            '}',

            'html body #accessibility-toolbar-wrapper .accessibility-toggle-card {',
            '  position: relative !important;',
            '  display: grid !important;',
            '  grid-template-columns: 1fr auto !important;',
            '  gap: 1rem !important;',
            '  align-items: center !important;',
            '  padding: 0.95rem 1rem !important;',
            '  border: 1px solid #d8d8d8 !important;',
            '  border-radius: 14px !important;',
            '  background: #fafafa !important;',
            '  cursor: pointer !important;',
            '}',

            'html body #accessibility-toolbar-wrapper .accessibility-checkbox {',
            '  position: absolute !important;',
            '  opacity: 0 !important;',
            '  pointer-events: none !important;',
            '}',

            'html body #accessibility-toolbar-wrapper .accessibility-toggle-card-title,',
            'html body #accessibility-toolbar-wrapper .accessibility-colour-label {',
            '  font-size: 16px !important;',
            '  font-weight: 700 !important;',
            '  color: #111 !important;',
            '}',

            'html body #accessibility-toolbar-wrapper .accessibility-switch {',
            '  position: relative !important;',
            '  width: 48px !important;',
            '  height: 28px !important;',
            '  border-radius: 999px !important;',
            '  background: #cfcfcf !important;',
            '}',

            'html body #accessibility-toolbar-wrapper .accessibility-switch::after {',
            '  content: "" !important;',
            '  position: absolute !important;',
            '  top: 3px !important;',
            '  left: 3px !important;',
            '  width: 22px !important;',
            '  height: 22px !important;',
            '  border-radius: 50% !important;',
            '  background: #fff !important;',
            '  box-shadow: 0 1px 3px rgba(0,0,0,.2) !important;',
            '}',

            'html body #accessibility-toolbar-wrapper .accessibility-checkbox:checked + .accessibility-toggle-card-main + .accessibility-switch {',
            '  background: #222 !important;',
            '}',

            'html body #accessibility-toolbar-wrapper .accessibility-checkbox:checked + .accessibility-toggle-card-main + .accessibility-switch::after {',
            '  transform: translateX(20px) !important;',
            '}',

            'html body #accessibility-toolbar-wrapper .accessibility-colour-grid {',
            '  display: grid !important;',
            '  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;',
            '  gap: 0.85rem !important;',
            '  margin-top: 1rem !important;',
            '  margin-bottom: 0.8rem !important;',
            '}',

            'html body #accessibility-toolbar-wrapper .accessibility-colour-field {',
            '  display: flex !important;',
            '  flex-direction: column !important;',
            '  gap: 0.45rem !important;',
            '  padding: 0.85rem 0.95rem !important;',
            '  border: 1px solid #d8d8d8 !important;',
            '  border-radius: 14px !important;',
            '  background: #fafafa !important;',
            '}',

            'html body #accessibility-toolbar-wrapper .accessibility-colour-input {',
            '  width: 100% !important;',
            '  min-height: 52px !important;',
            '  border: 1px solid #cfcfcf !important;',
            '  border-radius: 10px !important;',
            '  background: #fff !important;',
            '  cursor: pointer !important;',
            '  padding: 0.3rem !important;',
            '}',

            'html body #accessibility-toolbar-wrapper .accessibility-contrast-status.is-valid {',
            '  color: #1b5e20 !important;',
            '}',

            'html body #accessibility-toolbar-wrapper .accessibility-contrast-status.is-invalid {',
            '  color: #b3261e !important;',
            '}',

            '@media (max-width: 680px) {',
            '  html body #accessibility-toolbar-wrapper .accessibility-panel {',
            '    width: min(96vw, 96vw) !important;',
            '  }',
            '  html body #accessibility-toolbar-wrapper .accessibility-toggle-list-two-columns,',
            '  html body #accessibility-toolbar-wrapper .accessibility-colour-grid {',
            '    grid-template-columns: 1fr !important;',
            '  }',
            '  html body #accessibility-toolbar-wrapper .accessibility-inline-row {',
            '    flex-direction: column !important;',
            '    align-items: stretch !important;',
            '  }',
            '  html body #accessibility-toolbar-wrapper .accessibility-secondary-button {',
            '    width: 100% !important;',
            '  }',
            '}',

            '@media (max-height: 820px) {',
            '  html body #accessibility-toolbar-wrapper {',
            '    top: 1rem !important;',
            '    transform: none !important;',
            '  }',
            '  html body #accessibility-toolbar-wrapper .accessibility-panel {',
            '    top: 0 !important;',
            '    transform: none !important;',
            '    max-height: calc(100vh - 2rem) !important;',
            '  }',
            '}'
        ].join('\n');
    }

    function ensureDynamicStyleElement() {
        var styleElement = document.getElementById(dynamicStyleId);

        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = dynamicStyleId;
            document.head.appendChild(styleElement);
        }
    }

    function updateDynamicStyles() {
        var styleElement = document.getElementById(dynamicStyleId);

        if (!styleElement) {
            return;
        }

        var css = '';

        if (settings.highContrast) {
            css += buildHighContrastCss();
        }

        if (settings.customColours && hasValidCustomContrast()) {
            css += buildCustomColoursCss(settings.customTextColour, settings.customBackgroundColour);
        }

        styleElement.textContent = css;
    }

    function buildHighContrastCss() {
        return [
            'html.at-high-contrast, body.at-high-contrast {',
            '  background: #000 !important;',
            '  background-color: #000 !important;',
            '  color: #ffff00 !important;',
            '}',
            'html.at-high-contrast :not(#accessibility-toolbar-wrapper):not(#accessibility-toolbar-wrapper *) {',
            '  color: #ffff00 !important;',
            '  border-color: #ffff00 !important;',
            '}',
            'html.at-high-contrast :not(#accessibility-toolbar-wrapper):not(#accessibility-toolbar-wrapper *)::before,',
            'html.at-high-contrast :not(#accessibility-toolbar-wrapper):not(#accessibility-toolbar-wrapper *)::after,',
            'body.at-high-contrast :not(#accessibility-toolbar-wrapper):not(#accessibility-toolbar-wrapper *)::before,',
            'body.at-high-contrast :not(#accessibility-toolbar-wrapper):not(#accessibility-toolbar-wrapper *)::after {',
            '  color: #ffff00 !important;',
            '  border-color: #ffff00 !important;',
            '}',
            'html.at-high-contrast :not(img):not(svg):not(video):not(canvas):not(iframe):not(#accessibility-toolbar-wrapper):not(#accessibility-toolbar-wrapper *) {',
            '  background: #000 !important;',
            '  background-color: #000 !important;',
            '  background-image: none !important;',
            '  box-shadow: none !important;',
            '  text-shadow: none !important;',
            '}',
            'html.at-high-contrast [style*="background"]:not(#accessibility-toolbar-wrapper):not(#accessibility-toolbar-wrapper *),',
            'html.at-high-contrast [style*="background-color"]:not(#accessibility-toolbar-wrapper):not(#accessibility-toolbar-wrapper *),',
            'html.at-high-contrast [style*="background-image"]:not(#accessibility-toolbar-wrapper):not(#accessibility-toolbar-wrapper *),',
            'body.at-high-contrast [style*="background"]:not(#accessibility-toolbar-wrapper):not(#accessibility-toolbar-wrapper *),',
            'body.at-high-contrast [style*="background-color"]:not(#accessibility-toolbar-wrapper):not(#accessibility-toolbar-wrapper *),',
            'body.at-high-contrast [style*="background-image"]:not(#accessibility-toolbar-wrapper):not(#accessibility-toolbar-wrapper *) {',
            '  background: #000 !important;',
            '  background-color: #000 !important;',
            '  background-image: none !important;',
            '}'
        ].join('\n');
    }

    function buildCustomColoursCss(textColour, backgroundColour) {
        return [
            'html.at-custom-colours, body.at-custom-colours {',
            '  background: ' + backgroundColour + ' !important;',
            '  background-color: ' + backgroundColour + ' !important;',
            '  color: ' + textColour + ' !important;',
            '}',
            'html.at-custom-colours :not(#accessibility-toolbar-wrapper):not(#accessibility-toolbar-wrapper *) {',
            '  color: ' + textColour + ' !important;',
            '  border-color: ' + textColour + ' !important;',
            '}',
            'html.at-custom-colours :not(#accessibility-toolbar-wrapper):not(#accessibility-toolbar-wrapper *)::before,',
            'html.at-custom-colours :not(#accessibility-toolbar-wrapper):not(#accessibility-toolbar-wrapper *)::after,',
            'body.at-custom-colours :not(#accessibility-toolbar-wrapper):not(#accessibility-toolbar-wrapper *)::before,',
            'body.at-custom-colours :not(#accessibility-toolbar-wrapper):not(#accessibility-toolbar-wrapper *)::after {',
            '  color: ' + textColour + ' !important;',
            '  border-color: ' + textColour + ' !important;',
            '}',
            'html.at-custom-colours :not(img):not(svg):not(video):not(canvas):not(iframe):not(#accessibility-toolbar-wrapper):not(#accessibility-toolbar-wrapper *) {',
            '  background: ' + backgroundColour + ' !important;',
            '  background-color: ' + backgroundColour + ' !important;',
            '  background-image: none !important;',
            '  box-shadow: none !important;',
            '  text-shadow: none !important;',
            '}',
            'html.at-custom-colours a:not(#accessibility-toolbar-wrapper a),',
            'html.at-custom-colours a:link:not(#accessibility-toolbar-wrapper a),',
            'html.at-custom-colours a:visited:not(#accessibility-toolbar-wrapper a),',
            'html.at-custom-colours a:hover:not(#accessibility-toolbar-wrapper a),',
            'html.at-custom-colours a:focus:not(#accessibility-toolbar-wrapper a),',
            'html.at-custom-colours a:active:not(#accessibility-toolbar-wrapper a),',
            'body.at-custom-colours a:not(#accessibility-toolbar-wrapper a),',
            'body.at-custom-colours a:link:not(#accessibility-toolbar-wrapper a),',
            'body.at-custom-colours a:visited:not(#accessibility-toolbar-wrapper a),',
            'body.at-custom-colours a:hover:not(#accessibility-toolbar-wrapper a),',
            'body.at-custom-colours a:focus:not(#accessibility-toolbar-wrapper a),',
            'body.at-custom-colours a:active:not(#accessibility-toolbar-wrapper a) {',
            '  color: ' + textColour + ' !important;',
            '}',
            'html.at-custom-colours button:not(#accessibility-toolbar-wrapper button),',
            'html.at-custom-colours input:not(#accessibility-toolbar-wrapper input),',
            'html.at-custom-colours textarea:not(#accessibility-toolbar-wrapper textarea),',
            'html.at-custom-colours select:not(#accessibility-toolbar-wrapper select),',
            'html.at-custom-colours option:not(#accessibility-toolbar-wrapper option),',
            'body.at-custom-colours button:not(#accessibility-toolbar-wrapper button),',
            'body.at-custom-colours input:not(#accessibility-toolbar-wrapper input),',
            'body.at-custom-colours textarea:not(#accessibility-toolbar-wrapper textarea),',
            'body.at-custom-colours select:not(#accessibility-toolbar-wrapper select),',
            'body.at-custom-colours option:not(#accessibility-toolbar-wrapper option) {',
            '  background: ' + backgroundColour + ' !important;',
            '  background-color: ' + backgroundColour + ' !important;',
            '  color: ' + textColour + ' !important;',
            '  border: 1px solid ' + textColour + ' !important;',
            '}',
            'html.at-custom-colours [style*="background"]:not(#accessibility-toolbar-wrapper):not(#accessibility-toolbar-wrapper *),',
            'html.at-custom-colours [style*="background-color"]:not(#accessibility-toolbar-wrapper):not(#accessibility-toolbar-wrapper *),',
            'html.at-custom-colours [style*="background-image"]:not(#accessibility-toolbar-wrapper):not(#accessibility-toolbar-wrapper *),',
            'body.at-custom-colours [style*="background"]:not(#accessibility-toolbar-wrapper):not(#accessibility-toolbar-wrapper *),',
            'body.at-custom-colours [style*="background-color"]:not(#accessibility-toolbar-wrapper):not(#accessibility-toolbar-wrapper *),',
            'body.at-custom-colours [style*="background-image"]:not(#accessibility-toolbar-wrapper):not(#accessibility-toolbar-wrapper *) {',
            '  background: ' + backgroundColour + ' !important;',
            '  background-color: ' + backgroundColour + ' !important;',
            '  background-image: none !important;',
            '}'
        ].join('\n');
    }

    function syncUiStates() {
        updateTextSizeValue();
        updateFontSelect();
        updateCustomColourInputs();
        updateToggleCheckboxes();
        updateStepperDisabledState();
        updateToggleCardStates();
        updateContrastStatus();
    }

    function updateTextSizeValue() {
        var valueElement = document.getElementById('accessibility-text-size-value');

        if (valueElement) {
            valueElement.textContent = settings.textSize + '%';
        }
    }

    function updateFontSelect() {
        var fontSelect = document.getElementById('accessibility-font-select');

        if (fontSelect) {
            fontSelect.value = settings.font;
        }
    }

    function updateCustomColourInputs() {
        var textColourInput = document.getElementById('accessibility-text-colour');
        var backgroundColourInput = document.getElementById('accessibility-background-colour');
        var invalid = settings.customColours && !hasValidCustomContrast();

        if (textColourInput) {
            textColourInput.value = settings.customTextColour;
            textColourInput.setAttribute('aria-invalid', invalid ? 'true' : 'false');
        }

        if (backgroundColourInput) {
            backgroundColourInput.value = settings.customBackgroundColour;
            backgroundColourInput.setAttribute('aria-invalid', invalid ? 'true' : 'false');
        }
    }

    function updateToggleCheckboxes() {
        updateSingleCheckbox('high-contrast', settings.highContrast);
        updateSingleCheckbox('underline-links', settings.underlineLinks);
        updateSingleCheckbox('line-spacing', settings.lineSpacing);
        updateSingleCheckbox('letter-spacing', settings.letterSpacing);
        updateSingleCheckbox('enhanced-focus', settings.enhancedFocus);
        updateSingleCheckbox('custom-colours', settings.customColours);
    }

    function updateSingleCheckbox(toggleName, state) {
        var checkbox = document.querySelector('[data-toggle="' + toggleName + '"]');

        if (!checkbox) {
            return;
        }

        checkbox.checked = state;
        checkbox.setAttribute('aria-checked', state ? 'true' : 'false');
    }

    function updateToggleCardStates() {
        var cards = document.querySelectorAll('.accessibility-toggle-card');

        cards.forEach(function (card) {
            var checkbox = card.querySelector('.accessibility-checkbox');

            if (!checkbox) {
                return;
            }

            card.setAttribute('aria-checked', checkbox.checked ? 'true' : 'false');
        });
    }

    function updateStepperDisabledState() {
        var decreaseButton = document.querySelector('[data-action="text-decrease"]');
        var increaseButton = document.querySelector('[data-action="text-increase"]');

        if (decreaseButton) {
            decreaseButton.disabled = settings.textSize <= 70;
            decreaseButton.setAttribute('aria-disabled', decreaseButton.disabled ? 'true' : 'false');
        }

        if (increaseButton) {
            increaseButton.disabled = settings.textSize >= 200;
            increaseButton.setAttribute('aria-disabled', increaseButton.disabled ? 'true' : 'false');
        }
    }

    function updateContrastStatus() {
        var wrapper = document.getElementById('accessibility-toolbar-wrapper');
        var status = document.getElementById('accessibility-contrast-status');

        if (!wrapper || !status) {
            return;
        }

        var ratio = getContrastRatio(settings.customTextColour, settings.customBackgroundColour);
        var ratioText = formatRatio(ratio);

        status.classList.remove('is-valid', 'is-invalid');

        if (hasValidCustomContrast()) {
            status.textContent = formatMessage(wrapper.getAttribute('data-msg-contrast-status-valid'), ratioText);
            status.classList.add('is-valid');
        } else {
            status.textContent = formatMessage(wrapper.getAttribute('data-msg-contrast-status-invalid'), ratioText);
            status.classList.add('is-invalid');
        }
    }

    function enableEnterOnToggleCards(panel) {
        var cards = panel.querySelectorAll('.accessibility-toggle-card');

        cards.forEach(function (card) {
            card.addEventListener('keydown', function (event) {
                var checkbox = card.querySelector('.accessibility-checkbox');

                if (!checkbox) {
                    return;
                }

                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    checkbox.checked = !checkbox.checked;
                    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });
        });
    }

    function announceTextSize(wrapper) {
        announce(formatMessage(wrapper.getAttribute('data-msg-text-size'), settings.textSize + '%'));
    }

    function announceCustomColourState(wrapper) {
        var ratioText = formatRatio(getContrastRatio(settings.customTextColour, settings.customBackgroundColour));

        if (hasValidCustomContrast()) {
            announce(formatMessage(wrapper.getAttribute('data-msg-contrast-valid'), ratioText));
        } else {
            announce(formatMessage(wrapper.getAttribute('data-msg-contrast-invalid'), ratioText));
        }
    }

    function announce(message) {
        var liveRegion = document.getElementById('accessibility-live-region');

        if (!liveRegion || !message) {
            return;
        }

        liveRegion.textContent = '';

        window.setTimeout(function () {
            liveRegion.textContent = message;
        }, 30);
    }

    function formatMessage(template, value) {
        if (!template) {
            return value;
        }

        return template.replace('%s', value);
    }

    function getFontLabel(selectElement) {
        if (!selectElement || !selectElement.options.length) {
            return '';
        }

        return selectElement.options[selectElement.selectedIndex].text;
    }

    function getToggleLabel(inputElement) {
        var card = inputElement.closest('.accessibility-toggle-card');

        if (!card) {
            return '';
        }

        var title = card.querySelector('.accessibility-toggle-card-title');

        return title ? title.textContent.trim() : '';
    }

    function hasValidCustomContrast() {
        return getContrastRatio(settings.customTextColour, settings.customBackgroundColour) >= minimumContrastRatio;
    }

    function getContrastRatio(foregroundHex, backgroundHex) {
        var foreground = hexToRgb(foregroundHex);
        var background = hexToRgb(backgroundHex);

        if (!foreground || !background) {
            return 1;
        }

        var foregroundLuminance = relativeLuminance(foreground);
        var backgroundLuminance = relativeLuminance(background);

        var lighter = Math.max(foregroundLuminance, backgroundLuminance);
        var darker = Math.min(foregroundLuminance, backgroundLuminance);

        return (lighter + 0.05) / (darker + 0.05);
    }

    function hexToRgb(hex) {
        var normalized = normalizeHexColour(hex, null);

        if (!normalized) {
            return null;
        }

        return {
            r: parseInt(normalized.substring(1, 3), 16),
            g: parseInt(normalized.substring(3, 5), 16),
            b: parseInt(normalized.substring(5, 7), 16)
        };
    }

    function normalizeHexColour(value, fallback) {
        if (typeof value !== 'string') {
            return fallback;
        }

        var normalized = value.trim().toLowerCase();

        if (/^#[0-9a-f]{6}$/.test(normalized)) {
            return normalized;
        }

        return fallback;
    }

    function relativeLuminance(rgb) {
        var channels = [rgb.r, rgb.g, rgb.b].map(function (channel) {
            var sRgb = channel / 255;
            return sRgb <= 0.03928
                ? sRgb / 12.92
                : Math.pow((sRgb + 0.055) / 1.055, 2.4);
        });

        return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    }

    function formatRatio(ratio) {
        return ratio.toFixed(2) + ':1';
    }

    function saveSettings() {
        try {
            localStorage.setItem(storageKey, JSON.stringify(settings));
        } catch (error) {
        }
    }

    function loadSettings() {
        try {
            var savedSettings = localStorage.getItem(storageKey);

            if (!savedSettings) {
                return cloneDefaults();
            }

            var parsed = JSON.parse(savedSettings);

            return Object.assign(cloneDefaults(), parsed, {
                customTextColour: normalizeHexColour(parsed.customTextColour, defaultSettings.customTextColour),
                customBackgroundColour: normalizeHexColour(parsed.customBackgroundColour, defaultSettings.customBackgroundColour)
            });
        } catch (error) {
            return cloneDefaults();
        }
    }

    function cloneDefaults() {
        return {
            textSize: defaultSettings.textSize,
            font: defaultSettings.font,
            highContrast: defaultSettings.highContrast,
            underlineLinks: defaultSettings.underlineLinks,
            lineSpacing: defaultSettings.lineSpacing,
            letterSpacing: defaultSettings.letterSpacing,
            enhancedFocus: defaultSettings.enhancedFocus,
            customColours: defaultSettings.customColours,
            customTextColour: defaultSettings.customTextColour,
            customBackgroundColour: defaultSettings.customBackgroundColour
        };
    }
})();
