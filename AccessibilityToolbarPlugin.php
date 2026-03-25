<?php

class AccessibilityToolbarPlugin extends Omeka_Plugin_AbstractPlugin
{
    protected $_hooks = array(
        'initialize',
        'public_head',
        'public_footer',
    );

    public function hookInitialize($args)
    {
        add_translation_source(dirname(__FILE__) . DIRECTORY_SEPARATOR . 'languages');
    }

    public function hookPublicHead($args)
    {
        queue_css_url(WEB_ROOT . '/plugins/AccessibilityToolbar/css/accessibility-toolbar.css');
        queue_js_url(WEB_ROOT . '/plugins/AccessibilityToolbar/javascripts/accessibility-toolbar.js');
    }

    public function hookPublicFooter($args)
    {
        echo $this->_getToolbarHtml();
    }

    protected function _getToolbarHtml()
    {
        $toggleLabel = html_escape(__('Open accessibility options'));
        $panelLabel = html_escape(__('Accessibility options'));
        $title = html_escape(__('Accessibility'));

        $textSizeTitle = html_escape(__('Text size'));
        $textSizeHelp = html_escape(__('Use the minus and plus buttons to adjust the text size. The current value is announced automatically.'));
        $decreaseText = html_escape(__('Decrease text size'));
        $increaseText = html_escape(__('Increase text size'));
        $resetTextSize = html_escape(__('Reset text size'));

        $fontTitle = html_escape(__('Font'));
        $fontHelp = html_escape(__('Choose a reading font.'));
        $defaultFont = html_escape(__('Default'));
        $arialFont = html_escape(__('Arial'));
        $verdanaFont = html_escape(__('Verdana'));
        $comicSansFont = html_escape(__('Comic Sans'));
        $openDyslexicFont = html_escape(__('OpenDyslexic'));

        $appearanceTitle = html_escape(__('Appearance'));
        $highContrast = html_escape(__('High contrast'));
        $highContrastDesc = html_escape(__('Black background and yellow text.'));
        $underlineLinks = html_escape(__('Underline links'));
        $underlineLinksDesc = html_escape(__('Always underline hyperlinks for easier recognition.'));
        $lineSpacing = html_escape(__('Increase line spacing'));
        $lineSpacingDesc = html_escape(__('Add more vertical space between lines of text.'));
        $letterSpacing = html_escape(__('Increase letter spacing'));
        $letterSpacingDesc = html_escape(__('Add more space between letters.'));
        $enhancedFocus = html_escape(__('Enhanced focus'));
        $enhancedFocusDesc = html_escape(__('Stronger and more visible keyboard focus indicators.'));

        $customColoursTitle = html_escape(__('Custom colours'));
        $customColoursHelp = html_escape(__('Choose your own text and background colours. Custom colours are applied only when the contrast ratio is at least 4.5:1.'));
        $enableCustomColours = html_escape(__('Enable custom colours'));
        $enableCustomColoursDesc = html_escape(__('Use your own text and background colours instead of the default theme colours.'));
        $textColourLabel = html_escape(__('Text colour'));
        $backgroundColourLabel = html_escape(__('Background colour'));
        $resetCustomColours = html_escape(__('Reset custom colours'));

        $resetAll = html_escape(__('Reset all settings'));

        $msgTextSize = html_escape(__('Text size set to %s.'));
        $msgFont = html_escape(__('Font set to %s.'));
        $msgEnabled = html_escape(__('%s enabled.'));
        $msgDisabled = html_escape(__('%s disabled.'));
        $msgResetAll = html_escape(__('All accessibility settings have been reset.'));
        $msgCustomColoursReset = html_escape(__('Custom colours have been reset.'));
        $msgContrastValid = html_escape(__('Custom colours enabled. Contrast ratio %s.'));
        $msgContrastInvalid = html_escape(__('Custom colours cannot be applied. Contrast ratio %s is below 4.5:1.'));
        $msgContrastStatusValid = html_escape(__('Contrast ratio: %s. This meets the minimum requirement.'));
        $msgContrastStatusInvalid = html_escape(__('Contrast ratio: %s. This is below the minimum requirement of 4.5:1.'));
        $msgHighContrastDisabled = html_escape(__('High contrast was disabled because custom colours were enabled.'));
        $msgCustomColoursDisabled = html_escape(__('Custom colours were disabled because high contrast was enabled.'));

        return '
        <div
            id="accessibility-toolbar-wrapper"
            data-msg-text-size="' . $msgTextSize . '"
            data-msg-font="' . $msgFont . '"
            data-msg-enabled="' . $msgEnabled . '"
            data-msg-disabled="' . $msgDisabled . '"
            data-msg-reset-all="' . $msgResetAll . '"
            data-msg-custom-colours-reset="' . $msgCustomColoursReset . '"
            data-msg-contrast-valid="' . $msgContrastValid . '"
            data-msg-contrast-invalid="' . $msgContrastInvalid . '"
            data-msg-contrast-status-valid="' . $msgContrastStatusValid . '"
            data-msg-contrast-status-invalid="' . $msgContrastStatusInvalid . '"
            data-msg-high-contrast-disabled="' . $msgHighContrastDisabled . '"
            data-msg-custom-colours-disabled="' . $msgCustomColoursDisabled . '">

            <button
                id="accessibility-toggle"
                class="accessibility-toggle"
                type="button"
                aria-label="' . $toggleLabel . '"
                aria-expanded="false"
                aria-controls="accessibility-panel">
                <svg
                    class="accessibility-toggle-icon"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                    focusable="false">
                    <path d="M9.5 1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0M6 5.5l-4.535-.442A.531.531 0 0 1 1.531 4H14.47a.531.531 0 0 1 .066 1.058L10 5.5V9l.452 6.42a.535.535 0 0 1-1.053.174L8.243 9.97c-.064-.252-.422-.252-.486 0l-1.156 5.624a.535.535 0 0 1-1.053-.174L6 9z"/>
                </svg>
            </button>

            <div
                id="accessibility-panel"
                class="accessibility-panel"
                hidden
                tabindex="-1"
                aria-label="' . $panelLabel . '">

                <div class="accessibility-panel-inner">
                    <h2 class="accessibility-title">' . $title . '</h2>

                    <div id="accessibility-live-region" class="visually-hidden" aria-live="polite" aria-atomic="true"></div>

                    <section class="accessibility-group" aria-labelledby="accessibility-text-size-heading">
                        <div class="accessibility-section-header">
                            <h3 id="accessibility-text-size-heading" class="accessibility-group-title">' . $textSizeTitle . '</h3>
                            <p id="accessibility-text-size-help" class="accessibility-group-help">' . $textSizeHelp . '</p>
                        </div>

                        <div class="accessibility-inline-row">
                            <div
                                class="accessibility-stepper"
                                role="group"
                                aria-labelledby="accessibility-text-size-heading"
                                aria-describedby="accessibility-text-size-help">

                                <button
                                    type="button"
                                    class="accessibility-stepper-button"
                                    data-action="text-decrease"
                                    aria-label="' . $decreaseText . '"
                                    aria-controls="accessibility-text-size-value">
                                    <span aria-hidden="true">−</span>
                                </button>

                                <output
                                    id="accessibility-text-size-value"
                                    class="accessibility-stepper-value"
                                    aria-live="polite"
                                    aria-atomic="true">100%</output>

                                <button
                                    type="button"
                                    class="accessibility-stepper-button"
                                    data-action="text-increase"
                                    aria-label="' . $increaseText . '"
                                    aria-controls="accessibility-text-size-value">
                                    <span aria-hidden="true">+</span>
                                </button>
                            </div>

                            <button
                                type="button"
                                class="accessibility-secondary-button"
                                data-action="text-reset">'
                                . $resetTextSize .
                            '</button>
                        </div>
                    </section>

                    <section class="accessibility-group" aria-labelledby="accessibility-font-heading">
                        <div class="accessibility-section-header">
                            <h3 id="accessibility-font-heading" class="accessibility-group-title">' . $fontTitle . '</h3>
                            <p id="accessibility-font-help" class="accessibility-group-help">' . $fontHelp . '</p>
                        </div>

                        <label class="visually-hidden" for="accessibility-font-select">' . $fontTitle . '</label>
                        <select
                            id="accessibility-font-select"
                            class="accessibility-select"
                            data-control="font-select"
                            aria-describedby="accessibility-font-help">
                            <option value="default" style="font-family: Arial, Helvetica, sans-serif;">' . $defaultFont . '</option>
                            <option value="arial" style="font-family: Arial, Helvetica, sans-serif;">' . $arialFont . '</option>
                            <option value="verdana" style="font-family: Verdana, Geneva, sans-serif;">' . $verdanaFont . '</option>
                            <option value="comic-sans" style="font-family: \'Comic Sans MS\', \'Comic Sans\', cursive;">' . $comicSansFont . '</option>
                            <option value="open-dyslexic" style="font-family: OpenDyslexic, Arial, Helvetica, sans-serif;">' . $openDyslexicFont . '</option>
                        </select>
                    </section>

                    <section class="accessibility-group" aria-labelledby="accessibility-appearance-heading">
                        <div class="accessibility-section-header">
                            <h3 id="accessibility-appearance-heading" class="accessibility-group-title">' . $appearanceTitle . '</h3>
                        </div>

                        <div class="accessibility-toggle-list accessibility-toggle-list-two-columns">
                            <label class="accessibility-toggle-card" tabindex="0" role="switch" aria-checked="false">
                                <input type="checkbox" class="accessibility-checkbox" data-toggle="high-contrast">
                                <span class="accessibility-toggle-card-main">
                                    <span class="accessibility-toggle-card-title">' . $highContrast . '</span>
                                    <span class="accessibility-toggle-card-description">' . $highContrastDesc . '</span>
                                </span>
                                <span class="accessibility-switch" aria-hidden="true"></span>
                            </label>

                            <label class="accessibility-toggle-card" tabindex="0" role="switch" aria-checked="false">
                                <input type="checkbox" class="accessibility-checkbox" data-toggle="underline-links">
                                <span class="accessibility-toggle-card-main">
                                    <span class="accessibility-toggle-card-title">' . $underlineLinks . '</span>
                                    <span class="accessibility-toggle-card-description">' . $underlineLinksDesc . '</span>
                                </span>
                                <span class="accessibility-switch" aria-hidden="true"></span>
                            </label>

                            <label class="accessibility-toggle-card" tabindex="0" role="switch" aria-checked="false">
                                <input type="checkbox" class="accessibility-checkbox" data-toggle="line-spacing">
                                <span class="accessibility-toggle-card-main">
                                    <span class="accessibility-toggle-card-title">' . $lineSpacing . '</span>
                                    <span class="accessibility-toggle-card-description">' . $lineSpacingDesc . '</span>
                                </span>
                                <span class="accessibility-switch" aria-hidden="true"></span>
                            </label>

                            <label class="accessibility-toggle-card" tabindex="0" role="switch" aria-checked="false">
                                <input type="checkbox" class="accessibility-checkbox" data-toggle="letter-spacing">
                                <span class="accessibility-toggle-card-main">
                                    <span class="accessibility-toggle-card-title">' . $letterSpacing . '</span>
                                    <span class="accessibility-toggle-card-description">' . $letterSpacingDesc . '</span>
                                </span>
                                <span class="accessibility-switch" aria-hidden="true"></span>
                            </label>

                            <label class="accessibility-toggle-card" tabindex="0" role="switch" aria-checked="false">
                                <input type="checkbox" class="accessibility-checkbox" data-toggle="enhanced-focus">
                                <span class="accessibility-toggle-card-main">
                                    <span class="accessibility-toggle-card-title">' . $enhancedFocus . '</span>
                                    <span class="accessibility-toggle-card-description">' . $enhancedFocusDesc . '</span>
                                </span>
                                <span class="accessibility-switch" aria-hidden="true"></span>
                            </label>
                        </div>
                    </section>

                    <section class="accessibility-group" aria-labelledby="accessibility-custom-colours-heading">
                        <div class="accessibility-section-header">
                            <h3 id="accessibility-custom-colours-heading" class="accessibility-group-title">' . $customColoursTitle . '</h3>
                            <p id="accessibility-custom-colours-help" class="accessibility-group-help">' . $customColoursHelp . '</p>
                        </div>

                        <div class="accessibility-toggle-list">
                            <label class="accessibility-toggle-card" tabindex="0" role="switch" aria-checked="false">
                                <input type="checkbox" class="accessibility-checkbox" data-toggle="custom-colours">
                                <span class="accessibility-toggle-card-main">
                                    <span class="accessibility-toggle-card-title">' . $enableCustomColours . '</span>
                                    <span class="accessibility-toggle-card-description">' . $enableCustomColoursDesc . '</span>
                                </span>
                                <span class="accessibility-switch" aria-hidden="true"></span>
                            </label>
                        </div>

                        <div class="accessibility-colour-grid" aria-describedby="accessibility-custom-colours-help">
                            <div class="accessibility-colour-field">
                                <label for="accessibility-text-colour" class="accessibility-colour-label">' . $textColourLabel . '</label>
                                <input
                                    id="accessibility-text-colour"
                                    class="accessibility-colour-input"
                                    type="color"
                                    value="#111111"
                                    data-control="custom-text-colour">
                            </div>

                            <div class="accessibility-colour-field">
                                <label for="accessibility-background-colour" class="accessibility-colour-label">' . $backgroundColourLabel . '</label>
                                <input
                                    id="accessibility-background-colour"
                                    class="accessibility-colour-input"
                                    type="color"
                                    value="#ffffff"
                                    data-control="custom-background-colour">
                            </div>
                        </div>

                        <div
                            id="accessibility-contrast-status"
                            class="accessibility-contrast-status"
                            role="status"
                            aria-live="polite"
                            aria-atomic="true"></div>

                        <button
                            type="button"
                            class="accessibility-secondary-button"
                            data-action="reset-custom-colours">'
                            . $resetCustomColours .
                        '</button>
                    </section>

                    <section class="accessibility-group accessibility-group-last">
                        <button
                            type="button"
                            class="accessibility-reset-button"
                            data-action="reset-all">'
                            . $resetAll .
                        '</button>
                    </section>
                </div>
            </div>
        </div>';
    }
}
?>
