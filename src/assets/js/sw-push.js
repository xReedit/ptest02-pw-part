if ('serviceWorker' in navigator && 'PushManager' in window) {    
    navigator.serviceWorker.register('assets/js/sw-push.js')
    .then(function(swReg) {
      console.log('Service Worker is registered', swReg);
  
      swRegistration = swReg;
    })
    .catch(function(error) {
      console.error('Service Worker Error', error);
      // return;
    });
  } else {
    console.warn('Push messaging is not supported');
    // pushButton.textContent = 'Push Not Supported';
    // return;
  }

  // verificar si notificaciones estan activas
  function solicitaAcceso() {
    if (Notification.permission === 'granted') { 
      // notificacione concedidas
    } else if ( Notification.permission !== 'denied' || Notification.permission === 'default' )  {

      // solicita acceso
      Notification.requestPermission();
      // Notification.requestPermission( function (permission) {

      //     console.log( permission );

      //     if ( permission === 'granted' ) {
      //         new Notification('Hola Mundo! - pregunta');
      //         // enviarNotificacion();
      //     }

      // });

    }
  }

  solicitaAcceso();


  self.addEventListener('push', function(event) {
    console.log('[Service Worker] Push Received.');
    console.log(`[Service Worker] Push had this data: "${event.data.text()}"`);
  
    const title = 'Push Codelab';
    const options = {
      body: 'Yay it works.',
      icon: 'images/icon.png',
      badge: 'images/badge.png'
    };
  
    event.waitUntil(self.registration.showNotification(title, options));
  });