var deferredPrompt;
var isPWAinBrowser = true; // si se esta abriendo desde el browser
var setupButton;

window.addEventListener('beforeinstallprompt', (e) => {
  // Stash the event so it can be triggered later.
  e.preventDefault();
  deferredPrompt = e;


    // replace standalone with fullscreen or minimal-ui according to your manifest
    // if (matchMedia('(display-mode: standalone)').matches) {
    //     // Android and iOS 11.3+
    //     isPWAinBrowser = false;
    // } else if ('standalone' in navigator) {
    //     // useful for iOS < 11.3
    //     isPWAinBrowser = !navigator.standalone;
    // }

    // if ( isPWAinBrowser ) {

        if (setupButton == undefined) {
            setupButton = document.getElementById("div-install");
        }
        // Show the setup button
        setupButton.style.display = "inline";
        setupButton.disabled = false;

    // }    
  
});


function installApp() {
    // Show the prompt
    deferredPrompt.prompt();
    setupButton.disabled = true;
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice
        .then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('PWA setup accepted');
                // hide our user interface that shows our A2HS button
                setupButton.style.display = 'none';
            } else {
                console.log('PWA setup rejected');
            }
            deferredPrompt = null;
        });
}


// ios
// Detects if device is on iOS 
// const isIos = () => {
//     const userAgent = window.navigator.userAgent.toLowerCase();
//     return /iphone|ipad|ipod/.test( userAgent );
//   }
//   // Detects if device is in standalone mode
//   const isInStandaloneMode = () => ('standalone' in window.navigator) && (window.navigator.standalone);
  
//   // Checks if should display install popup notification:
//   if (isIos() && !isInStandaloneMode()) {
//     this.setState({ showInstallMessage: true });
//   }