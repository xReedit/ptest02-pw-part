import { ErrorHandler, Injectable } from '@angular/core';


@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
// manejo de errores en principio me maneja el error de carga inicial despues de una actualizacion

  handleError(error: any): void {
   const chunkFailedMessage = /Loading chunk [\d]+ failed/;

    // error carga inicial despues de actualizacion, recarga la pagina
   if (chunkFailedMessage.test(error.message)) {
      window.location.reload();
    }


    console.error(error);
  }
}
