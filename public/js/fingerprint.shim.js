// Placeholder/Shim for Fingerprint SDK
// This file attempts to mock the missing FingerprintReader to allow the app to load
// You should replace this with the actual fingerprint.sdk.min.js from the vendor

(function() {
    if (!window.Fingerprint) {
        window.Fingerprint = {};
    }

    window.Fingerprint.FingerprintReader = function() {
        console.warn("FingerprintReader ejecutándose en modo DE PRUEBA (MOCK). El hardware real no funcionará.");
        
        this.handlers = {};

        this.on = function(event, callback) {
            this.handlers[event] = callback;
        };

        this.off = function() {
            this.handlers = {};
        };

        this.startCapture = function(deviceId) {
            console.log("Prueba: startCapture (Iniciar Captura)", deviceId);
            return Promise.resolve();
        };

        this.stopCapture = function(deviceId) {
            console.log("Prueba: stopCapture (Detener Captura)", deviceId);
            return Promise.resolve();
        };

        this.enumerateDevices = function() {
            console.log("Prueba: enumerateDevices (Enumerar Dispositivos)");
            return Promise.resolve(["Dispositivo de Prueba 1"]);
        };
    };
    
    // Also attach to WebSdk if it exists, just in case
    if (window.WebSdk) {
        window.WebSdk.FingerprintReader = window.Fingerprint.FingerprintReader;
    }
})();
