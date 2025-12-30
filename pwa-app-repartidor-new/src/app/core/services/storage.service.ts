import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

@Injectable({
    providedIn: 'root'
})
export class StorageService {

    constructor() { }

    async set(key: string, value: any): Promise<void> {
        await Preferences.set({
            key: key,
            value: JSON.stringify(value)
        });
    }

    async get(key: string): Promise<any> {
        const { value } = await Preferences.get({ key: key });
        if (value) {
            try {
                return JSON.parse(value);
            } catch (e) {
                return value;
            }
        }
        return null;
    }

    async remove(key: string): Promise<void> {
        await Preferences.remove({ key: key });
    }

    async clear(): Promise<void> {
        await Preferences.clear();
    }
}
