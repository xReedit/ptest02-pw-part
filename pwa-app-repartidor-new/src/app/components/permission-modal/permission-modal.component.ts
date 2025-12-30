import { Component, EventEmitter, Output, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeolocationService } from '../../core/services/geolocation.service';
import { NotificationService } from '../../core/services/notification.service';
import { Capacitor } from '@capacitor/core';


@Component({
    selector: 'app-permission-modal',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './permission-modal.component.html',
    styleUrl: './permission-modal.component.scss'
})
export class PermissionModalComponent implements OnInit {
    @Output() permissionsGranted = new EventEmitter<void>();

    isChecking = true;
    gpsGranted = false;
    gpsOff = false;
    notificationsGranted = false;

    get allGranted() {
        return this.gpsGranted && this.notificationsGranted && !this.gpsOff;
    }

    constructor(
        private geoService: GeolocationService,
        private notificationService: NotificationService,
        private cdr: ChangeDetectorRef
    ) { }

    async ngOnInit() {
        await this.checkCurrentStatus();
    }

    async checkCurrentStatus() {
        this.isChecking = true;
        this.cdr.detectChanges();

        try {
            const geoStatus = await this.geoService.getPermissionStatus();
            this.gpsGranted = (geoStatus === 'granted');
            this.gpsOff = (geoStatus === 'off');

            const notifStatus = await this.notificationService.getPermissionStatus();
            this.notificationsGranted = (notifStatus === 'granted');

            this.isChecking = false;
            this.cdr.detectChanges();

            if (this.allGranted) {
                this.permissionsGranted.emit();
            }
        } catch (error) {

            this.isChecking = false;
            this.cdr.detectChanges();
        }
    }

    async requestAll() {
        this.isChecking = true;
        this.cdr.detectChanges();

        try {
            // 1. Handle GPS Permissions & Service
            if (!this.gpsGranted) {
                // Standard permission request
                const granted = await this.geoService.checkPermissions();

                // Si se concedió el permiso pero el GPS está apagado, intentar activarlo
                if (granted) {
                    const geoStatus = await this.geoService.getPermissionStatus();
                    if (geoStatus === 'off') {

                        await this.geoService.enableLocation();
                    }
                }
            } else if (this.gpsOff) {
                // Permission granted but service OFF -> Try to enable automatically

                await this.geoService.enableLocation();
            }

            // 2. Handle Notifications
            if (!this.notificationsGranted) {
                const notifGranted = await this.notificationService.requestPermission();

            }

            // 3. Re-check final status
            await this.checkCurrentStatus();

        } catch (error: any) {

            this.isChecking = false;
            this.cdr.detectChanges();
        }
    }
}
