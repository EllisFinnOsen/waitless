(function(global) {
    
    const waitless = {
        scripts: [],
        functions: [],
        isLibraryAvailable: isLibraryAvailable
    };

    // Lazy load iframes
    function loadIframes() {
        var iframeContainers = document.querySelectorAll('iframe[waitless]');
        if (iframeContainers.length > 0) {
            var observerOptions = {
                root: null,
                rootMargin: '0px',
                threshold: 0 // 100% = 1.0
            };
            var loadIframe = function(iframeEl) {
                var iframeSrc = iframeEl.getAttribute('waitless');
                try {
                    iframeEl.setAttribute('src', iframeSrc);
                    iframeEl.removeAttribute('waitless');
                } catch (error) {
                    return;
                }
            };
            var iframeObserver = new IntersectionObserver(function(entries, observer) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        loadIframe(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, observerOptions);
            iframeContainers.forEach(function(container) {
                iframeObserver.observe(container);
            });
            waitless.triggerLoad = function() {
                var iframeContainers = document.querySelectorAll('iframe[waitless]');
                iframeContainers.forEach(function(container) {
                    loadIframe(container);
                });
            };            
        }
    }

    // Lazy load scripts
    const interactionList = ['keydown', 'mousemove', 'wheel', 'touchmove', 'touchstart', 'touchend'];
    let fallbackDelay = 10000;
    let interactionDetected = false;
    function loadScripts(scriptConfigs, globalCallback) {
        removeEventListeners();
        let loadedScripts = 0;
        const totalScripts = scriptConfigs.length;
    
        function scriptLoaded(callback) {
            loadedScripts++;
            if (loadedScripts === totalScripts && typeof globalCallback === 'function') {
                globalCallback();
            }
            if (typeof callback === 'function') {
                callback();
            }
        }
    
        function scriptError(src, callback) {
            const error = new Error(`Failed to load script: ${src}`);
            loadedScripts++;
            if (typeof callback === 'function') {
                callback(error);
            }
            if (loadedScripts === totalScripts && typeof globalCallback === 'function') {
                globalCallback(error);
            }
        }
    
        // Loop through script configs and handle different triggers (immediate load or on click)
        scriptConfigs.forEach(function(config) {
            const { src, location = 'body', callback, triggerElement } = config;
    
            // Check if the script should be triggered by a click event on a specific element
            if (triggerElement) {
                const trigger = document.querySelector(triggerElement);
                if (trigger) {
                    trigger.addEventListener('click', function() {
                        loadScript(src, location, callback);
                    });
                } else {
                    console.warn(`Trigger element not found for: ${src}`);
                }
            } else {
                // Otherwise, load script immediately or based on user interaction
                loadScript(src, location, callback);
            }
        });
    
        // Load the script function
        function loadScript(src, location, callback) {
            const script = document.createElement('script');
            script.src = src;
    
            let loaded = false;
    
            script.onload = function() {
                if (!loaded) {
                    loaded = true;
                    scriptLoaded(callback);
                }
            };
            script.onerror = function() {
                if (!loaded) {
                    loaded = true;
                    scriptError(src, callback);
                }
            };
    
            // Append the script to the correct location (head or body)
            if (location === 'head') {
                document.head.appendChild(script);
            } else if (location === 'body') {
                document.body.appendChild(script);
            }
        }
    
        const waitlessScripts = document.querySelectorAll('script[waitless]');
        const urlRegex = /^(?:https?:\/\/)?(?:[a-zA-Z0-9-]+\.)?[a-zA-Z0-9-]+\.[a-zA-Z0-9]+(?:\/(?:[^\/.]+\/)*[^\/.]+\.[a-zA-Z0-9]+)?\/?$/;
        waitlessScripts.forEach(script => {
            const waitlessUrl = script.getAttribute('waitless');
            if (urlRegex.test(waitlessUrl)) {
                script.src = waitlessUrl;
                script.removeAttribute('waitless');
            } else {
                console.error(`Invalid URL: ${waitlessUrl}`);
            }
        });
    }
    const scriptLoadTimeout = setTimeout(() => {
        if (!interactionDetected) {
            loadScripts(waitless.scripts, allScriptsReady);
        }
    }, fallbackDelay);
    function loadScriptsOnFirstInteraction() {
        if (!interactionDetected) {
            loadScripts(waitless.scripts, allScriptsReady);
        }
        interactionDetected = true;
        clearTimeout(scriptLoadTimeout);
    }
    function allScriptsReady() {
        waitless.functions.forEach(func => {
            if (typeof func === 'function') {
                func();
            }
        });
    }
    function isLibraryAvailable(libraryName) {
        return typeof window[libraryName] !== 'undefined';
    }
    function removeEventListeners() {
        interactionList.forEach(event => {
            document.removeEventListener(event, loadScriptsOnFirstInteraction);
        });    
    }

    // Load iframes
    document.addEventListener('DOMContentLoaded', function() {
        loadIframes();
    });
    // Load scripts
    interactionList.forEach(event => {
        document.addEventListener(event, loadScriptsOnFirstInteraction);
    });

    global.waitless = waitless;
    console.log('waitless 1.0.7');
})(this);
