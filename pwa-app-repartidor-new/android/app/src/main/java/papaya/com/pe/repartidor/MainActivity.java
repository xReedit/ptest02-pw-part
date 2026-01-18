package papaya.com.pe.repartidor;

import android.os.Bundle;
import android.os.Build;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import com.getcapacitor.BridgeActivity;
import androidx.core.splashscreen.SplashScreen;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);
        
        // Crear canal de notificaciones para Android 8+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                "fcm_default_channel",
                "Pedidos",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Notificaciones de nuevos pedidos");
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{200, 100, 200});
            
            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            notificationManager.createNotificationChannel(channel);
        }
    }
}
