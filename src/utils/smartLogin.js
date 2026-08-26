import fs from "node:fs/promises";

// --- Configuration ---
const DEFAULT_TIMEOUT = 10000; // 10 seconds

async function isElementVisible(page, selector) {
    try {
        // Playwright handles visibility checks natively and safely
        return await page.locator(selector).first().isVisible();
    } catch { 
        return false; 
    }
}

async function smartLogin(page, email, password, loginType = 'Normal', landedFunction, logFn = () => { }) {
    const log = (msg) => logFn(`[SmartLogin][${loginType}] ${msg}`);

    log(`STARTED. Current URL: ${page.url()}`);

    page.setDefaultTimeout(DEFAULT_TIMEOUT);

    const EMAIL_SELECTORS = [
    'input[name="loginfmt"]',
    'input[type="email"]',
    'input[name="identifier"]',
    '#i0116',
    '#Email',
    'input[autocomplete="username"]'
].join(',');
    const PASSWORD_SELECTORS = [
    'input[name="passwd"]',
    'input[name="Passwd"]',
    'input[type="password"]',
    '#i0118',
    'input[autocomplete="current-password"]'
].join(',');
    
    /*
    const TWO_FACTOR_SELECTORS = ['input[name="otc"]', '#idTxtBx_SAOTCC_OTC', 'input[name="code"]', '#idTxtBx_SMSOTP_OTC'].join(',');
    const AUTHENTICATOR_DISPLAY_SELECTORS = ['#idRichContext_DisplaySign', '.displaySign'].join(',');
    const ANOTHER_WAY_LINK = '#signInAnotherWay';
    const OPTION_List = 'div[data-bind*="options"] .table, #idDiv_SAOTCS_Proofs .table';
    */
    
    // Note: Puppeteer's ::-p-text() was replaced with Playwright's :has-text()
    const SUBMIT_BUTTONS = [
    '#idSIButton9',
    '#identifierNext',
    '#passwordNext',
    '#submit',
    '#idSubmit_ProofUp_Redirect',
    'button[type="submit"]',
    'button[id*="Next"]',
    '#identity-provider-linking-continue',
    'span:has-text("Continue")'
].join(',');

    const ERROR_INDICATORS = ['#usernameError', '#passwordError', 'div[aria-live="assertive"]', '.error', '.text-danger'].join(',');

    let filledEmail = false;
    let filledPassword = false;
    let lastUrl = page.url();
    /*
    let last2FANumber = null;
    let lastAuthType = null;
    let isWaitingForUser = false;
    let userDecisionPromise = null;
    */

    const ALL_INTERACTIVE = `${EMAIL_SELECTORS},${PASSWORD_SELECTORS},${SUBMIT_BUTTONS}`;

    for (let attempt = 0; attempt < 120; attempt++) {
        const url = page.url();
        const safeUrl = (() => {
    try {
        const u = new URL(url);
        return `${u.origin}${u.pathname}`;
    } catch {
        return url.split("?")[0];
    }
})();

log(`Current URL: ${safeUrl}`);

        if (url.includes("login.microsoftonline.com/common/login")) {
        await page.screenshot({
    path: "microsoft-login-debug.png",
    fullPage: true
});

await fs.writeFile(
    "microsoft-login-debug.html",
    await page.content(),
    "utf8"
);
    try {
        const debug = await page.locator("input").evaluateAll(elements =>
            elements.map(input => ({
                type: input.type,
                name: input.name,
                id: input.id,
                placeholder: input.placeholder,
                autocomplete: input.autocomplete,
                ariaLabel: input.getAttribute("aria-label")
            }))
        );

        log(`Microsoft inputs: ${JSON.stringify(debug)}`);

        const buttons = await page.locator("button").evaluateAll(elements =>
            elements.map(button => ({
                text: button.innerText,
                id: button.id,
                type: button.type,
                ariaLabel: button.getAttribute("aria-label")
            }))
        );

        log(`Microsoft buttons: ${JSON.stringify(buttons)}`);
    } catch (error) {
        log(`DEBUG INSPECTION FAILED: ${error.message}`);
    }
}

// 1. Microsoft security registration MUST be handled before success detection
const isMicrosoftRegistration =
    url.includes('mysignins.microsoft.com/register') ||
    url.includes('mysignins.microsoft.com/api/post/registerSsprMethodsInterrupt');

if (isMicrosoftRegistration) {
    log('Microsoft security registration page detected.');

    try {
        const skipSetup = page.getByRole('button', {
            name: 'Skip setup',
            exact: true
        }).first();

        await skipSetup.waitFor({
            state: 'visible',
            timeout: 10000
        });

        log('Microsoft "Skip setup" button detected.');
        log('Clicking Microsoft "Skip setup"...');

        await skipSetup.click({
            force: true,
            timeout: 5000
        });

        log('Microsoft "Skip setup" clicked.');

        await page.waitForLoadState('domcontentloaded', {
            timeout: 10000
        }).catch(() => {});

        await page.waitForTimeout(1500).catch(() => {});

        log(`After "Skip setup": ${page.url()}`);

        filledEmail = false;
        filledPassword = false;
        lastUrl = page.url();

        continue;

    } catch (error) {
        log(`Skip setup handling failed: ${error.message}`);
        await page.waitForTimeout(1000).catch(() => {});
        continue;
    }
}

// 2. Success Check
if (landedFunction({ url, page })) {
    return { filledEmail, filledPassword };
}

// 3. Navigation State Reset
if (url !== lastUrl) {
    log(`Navigated: ${url.substring(0, 40)}...`);
    lastUrl = url;
    filledPassword = false;
}

try {
    await page.locator(ALL_INTERACTIVE).first().waitFor({
        state: 'visible',
        timeout: 3000
    });
} catch (_error) {
    // Ignore timeout
}

// 3. Microsoft Proof-Up / Security Registration
if (
    url.includes('login.microsoftonline.com/common/login') &&
    await page.locator('#idSubmit_ProofUp_Redirect').count()
) {
    log('Microsoft security-registration page detected.');

    try {
        const proofUpButton = page.locator('#idSubmit_ProofUp_Redirect').first();

        if (await proofUpButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            log('Microsoft Proof-Up "Next" button detected.');
            log('Clicking Microsoft Proof-Up "Next"...');

            await proofUpButton.click({ force: true });

            log('Proof-Up "Next" clicked. Waiting for Microsoft registration flow...');

            // Give Microsoft time to perform the redirect/navigation.
            await page.waitForLoadState('domcontentloaded', {
                timeout: 10000
            }).catch(() => {});

            await page.waitForTimeout(1500);

            log(`After Proof-Up Next: ${page.url()}`);

            // Reset state because Microsoft may have navigated
            // to a completely different authentication page.
            filledEmail = false;
            filledPassword = false;
            lastUrl = page.url();

            continue;
        }

        log('Proof-Up "Next" button is not visible yet.');

        await page.waitForTimeout(1000);
        continue;

    } catch (error) {
        log(`Proof-Up handling failed: ${error.message}`);
        await page.waitForTimeout(1000);
        continue;
    }
}

// 5. Speedbump Handling
if (url.includes('samlconfirmaccount') || url.includes('speedbump')) {
            log(`Speedbump page detected.`);
            try {
                const continueBtn = page.locator('#identity-provider-linking-continue, span:has-text("Continue")').first();
                if (await continueBtn.isVisible()) {
                    await continueBtn.click();
                    await page.waitForLoadState('networkidle', { timeout: 1000 }).catch(() => { });
                    continue;
                }
            } catch (_error) {
    // Ignore if button isn't available
}
        }

        // 5. Error Detection
        if (await isElementVisible(page, ERROR_INDICATORS)) {
            // Check PASSWORD selectors first. 
            // If the password field is visible, any error on screen is likely a password error.
            if (filledEmail && await isElementVisible(page, PASSWORD_SELECTORS)) {
                log(`Password Error. Retrying...`);
                filledPassword = false;
            }
            // Only if Password field is NOT visible do we assume it's an email error.
            else if (await isElementVisible(page, EMAIL_SELECTORS)) {
                try {
                    const currentVal = await page.locator(EMAIL_SELECTORS).first().inputValue();
                    if (currentVal !== email) {
                        log(`Email Error (Field mismatch). Retrying...`);
                        filledEmail = false;
                    }
                } catch {
                    log(`Email Error. Retrying...`);
                    filledEmail = false;
                }
            }
        }

        // --- Explicit State Check ---
        if (filledPassword) {
            try {
                const passVal = await page.locator(PASSWORD_SELECTORS).first().inputValue().catch(() => 'unknown');
                if (passVal === '') {
                    log('Password field detected empty. Retrying typing...');
                    filledPassword = false;
                }
            } catch (_error) {
    // Ignore password read failure
}
        }

        // 6. Handle 2FA Prompt (Commented but ported logic to Playwright APIs just in case)
        /*
        if (on2FA) {
            let authType = null;
            let value = null;
            let methods = [];

            if (await isElementVisible(page, AUTHENTICATOR_DISPLAY_SELECTORS)) {
                authType = 'approval';
                try {
                    value = await page.locator(AUTHENTICATOR_DISPLAY_SELECTORS).first().innerText();
                    value = value.trim();
                    if (value !== last2FANumber) {
                        last2FANumber = value;
                        isWaitingForUser = false;
                    }
                } catch (e) { log(`Error processing Authenticator number: ${e.message}`); }
            } else if (await isElementVisible(page, TWO_FACTOR_SELECTORS)) {
                authType = 'code';
            } else if (await isElementVisible(page, OPTION_List)) {
                authType = 'select_method';
                try {
                    const rows = page.locator('.table-row');
                    const rowCount = await rows.count();
                    for (let i = 0; i < rowCount; i++) {
                        const r = rows.nth(i);
                        const text = (await r.innerText()).split('\n')[0].trim();
                        const val = await r.locator('div[data-value]').first().getAttribute('data-value').catch(()=>null);
                        methods.push({ text, value: val, index: i });
                    }
                } catch (e) { log(`Error extracting methods: ${e.message}`); }
            }

            if (authType) {
                if (isWaitingForUser && (lastAuthType !== authType || (authType === 'approval' && value !== last2FANumber))) {
                    isWaitingForUser = false;
                    userDecisionPromise = null;
                }

                if (!isWaitingForUser) {
                    isWaitingForUser = true;
                    lastAuthType = authType;
                    last2FANumber = value;

                    userDecisionPromise = on2FA({
                        type: authType,
                        value: value,
                        methods: methods
                    });
                }

                const result = await Promise.race([
                    userDecisionPromise,
                    new Promise(r => setTimeout(() => r(null), 2000))
                ]);

                if (result) {
                    isWaitingForUser = false;
                    userDecisionPromise = null;

                    if (result.action === 'select_method') {
                        log(`User selected method index: ${result.index}`);
                        await page.evaluate((idx) => {
                            const domRows = document.querySelectorAll('.table-row');
                            if (domRows[idx]) domRows[idx].click();
                        }, result.index);
                        await new Promise(r => setTimeout(r, 1000));
                        continue;
                    } else if (result.action === 'code') {
                        log('User entered code.');
                        const input = page.locator(TWO_FACTOR_SELECTORS).first();
                        if (await input.isVisible()) {
                            await input.fill(result.code);
                            await page.keyboard.press('Enter');
                        }
                        continue;
                    }
                } else {
                    continue;
                }
            } else {
                isWaitingForUser = false;
                userDecisionPromise = null;
            }
        }
        */

        // 7. Handle Email
        // 7. Handle Email
if (!filledEmail) {
    try {
        const emailLoc = page.locator(EMAIL_SELECTORS).first();

        if (await emailLoc.isVisible()) {
            log('Email field detected.');

            await emailLoc.click({ force: true });

            // Clear whatever Microsoft has placed in the field.
            await emailLoc.fill('');

            log(`Filling email: ${email}`);

            await emailLoc.fill(email);

            // Verify that Playwright actually entered it.
            const enteredEmail = await emailLoc.inputValue();

            log(`Email field now contains: ${enteredEmail}`);

            if (enteredEmail.trim().toLowerCase() === email.trim().toLowerCase()) {
                filledEmail = true;
                log('Email successfully filled.');
            } else {
                log('WARNING: Email field did not contain the expected email.');
            }

            // Do NOT press Enter here yet.
            // Let the submit-button section handle Microsoft's Next button.
            continue;
        }
    } catch (error) {
        log(`Email handling error: ${error.message}`);
    }
}

        // 8. Handle Password
        if (filledEmail && !filledPassword) {
            try {
                const passLoc = page.locator(PASSWORD_SELECTORS).first();
                if (await passLoc.isVisible()) {
                    log(`Typing Password...`);
                    
                    await new Promise(r => setTimeout(r, 300));
                    
                    // .fill clears pre-existing fields, removing the need for manual focus & backspace overrides
                    await passLoc.fill(password);
                    
                    filledPassword = true;
                    await page.keyboard.press('Enter');
                    continue;
                }
            } catch (_error) {
    // Ignore password input errors
}
        }

        // 9. Click Next/Submit
        try {
            const buttonsLoc = page.locator(SUBMIT_BUTTONS);
            const count = await buttonsLoc.count();
            
            for (let i = 0; i < count; i++) {
                const btn = buttonsLoc.nth(i);
                if (await btn.isVisible()) {
                    // Prevention 1: Don't click Next if Email is visible but empty/wrong
                    if (!filledEmail && await isElementVisible(page, EMAIL_SELECTORS)) continue;

                    // Prevention 2: Don't click "Sign In" if password visible but not typed
                    if (await isElementVisible(page, PASSWORD_SELECTORS) && !filledPassword) continue;

                    log(`Clicking Next/Continue...`);
                    await btn.click({ force: true });
                    await new Promise(r => setTimeout(r, 500));
                    break;
                }
            }
        } catch (_error) {
    // Ignore submit button errors
}
    }

    return { filledEmail, filledPassword };
}

export default smartLogin;