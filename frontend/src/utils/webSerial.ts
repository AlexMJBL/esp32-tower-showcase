/**
 * Web Serial API Manager pour ESP32
 * Permet de connecter l'ESP32 directement en USB au navigateur
 * et de décoder en temps réel les trames du multiplexeur TCA9548A, AHT20, BMP280 et VEML7700.
 */

export interface SerialCallbacks {
  onZoneData?: (channel: number, ahtTemp: number, ahtHum: number, bmpTemp: number, pressure: number) => void;
  onLightData?: (channel: number, lux: number) => void;
  onLog?: (text: string, type: 'sensor' | 'command' | 'sys') => void;
  onStatusChange?: (isConnected: boolean, portName?: string) => void;
  onError?: (error: string) => void;
}

export class WebSerialManager {
  private port: any = null;
  private reader: any = null;
  private keepReading = false;
  private currentChannel = 0;
  private tempAht: number | null = null;
  private humAht: number | null = null;

  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  public async connect(baudRate: number = 115200, callbacks: SerialCallbacks): Promise<boolean> {
    if (!this.isSupported()) {
      callbacks.onError?.("L'API Web Serial n'est pas supportée par ce navigateur. Utilisez Chrome, Edge, Brave ou Opera.");
      return false;
    }

    try {
      // @ts-expect-error navigator.serial is standard in modern Chromium browsers
      this.port = await navigator.serial.requestPort();
      await this.port.open({ baudRate });

      this.keepReading = true;
      callbacks.onStatusChange?.(true, "ESP32 (USB Série)");
      callbacks.onLog?.("Connexion série USB établie à 115200 bauds. Réception des capteurs...", "sys");

      this.readLoop(callbacks);
      return true;
    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        // Utilisateur a annulé la sélection
        return false;
      }
      callbacks.onError?.(`Erreur de connexion série : ${err.message || err}`);
      callbacks.onStatusChange?.(false);
      return false;
    }
  }

  public async disconnect(callbacks?: SerialCallbacks) {
    this.keepReading = false;
    try {
      if (this.reader) {
        await this.reader.cancel();
        this.reader = null;
      }
      if (this.port) {
        await this.port.close();
        this.port = null;
      }
      callbacks?.onStatusChange?.(false);
      callbacks?.onLog?.("Port série USB déconnecté.", "sys");
    } catch (err: any) {
      console.warn("Erreur lors de la fermeture du port série:", err);
    }
  }

  private async readLoop(callbacks: SerialCallbacks) {
    const textDecoder = new TextDecoderStream();
    this.port.readable.pipeTo(textDecoder.writable);
    this.reader = textDecoder.readable.getReader();

    let buffer = '';

    try {
      while (this.keepReading) {
        const { value, done } = await this.reader.read();
        if (done) break;
        if (value) {
          buffer += value;
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() || ''; // Garde la dernière ligne incomplète dans le tampon

          for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line) continue;
            this.parseLine(line, callbacks);
          }
        }
      }
    } catch (err: any) {
      if (this.keepReading) {
        callbacks.onError?.(`Interruption du flux série : ${err.message || err}`);
        callbacks.onStatusChange?.(false);
      }
    } finally {
      if (this.reader) {
        this.reader.releaseLock();
      }
    }
  }

  /**
   * Analyseur automatique de la trame ESP32 envoyée par l'utilisateur :
   * Exemples pris en charge :
   * [Canal 0] Module AHT+BMP #1 :
   *    AHT20  | Temp: 26.8 C | Hum: 60.7 %
   *    BMP280 | Temp: 27.6 C | Pression: 769.6 hPa
   * Ou avec timestamp :
   * 20:55:25.591 ->    AHT20  | Temp: 26.8 C | Hum: 60.7 %
   * VEML7700 [Canal 4] : Lux: 20.28
   */
  private parseLine(line: string, callbacks: SerialCallbacks) {
    // Nettoie l'éventuel préfixe du moniteur Arduino "20:55:25.591 -> "
    const cleanLine = line.replace(/^\d{2}:\d{2}:\d{2}\.\d{3}\s*->\s*/, '').trim();

    // 1. Détection de changement de canal
    const channelMatch = cleanLine.match(/\[Canal\s*(\d+)\]/i);
    if (channelMatch) {
      this.currentChannel = parseInt(channelMatch[1], 10);
      this.tempAht = null;
      this.humAht = null;
      return;
    }

    // 2. Détection AHT20
    // "AHT20  | Temp: 26.8 C | Hum: 60.7 %"
    const ahtMatch = cleanLine.match(/AHT20\s*\|\s*Temp:\s*([0-9.]+)\s*C\s*\|\s*Hum:\s*([0-9.]+)\s*%/i);
    if (ahtMatch) {
      this.tempAht = parseFloat(ahtMatch[1]);
      this.humAht = parseFloat(ahtMatch[2]);
      return;
    }

    // 3. Détection BMP280
    // "BMP280 | Temp: 27.6 C | Pression: 1004.7 hPa"
    const bmpMatch = cleanLine.match(/BMP280\s*\|\s*Temp:\s*([0-9.]+)\s*C\s*\|\s*Pression:\s*([0-9.]+)\s*hPa/i);
    if (bmpMatch) {
      const bmpTemp = parseFloat(bmpMatch[1]);
      const pressure = parseFloat(bmpMatch[2]);
      const ahtTemp = this.tempAht !== null ? this.tempAht : bmpTemp;
      const ahtHum = this.humAht !== null ? this.humAht : 60.0;

      if (this.currentChannel >= 0 && this.currentChannel <= 2) {
        callbacks.onZoneData?.(this.currentChannel, ahtTemp, ahtHum, bmpTemp, pressure);
        callbacks.onLog?.(`[USB Étage ${this.currentChannel + 1}] T=${ahtTemp}°C | H=${ahtHum}% | P=${pressure} hPa`, 'sensor');
      }
      return;
    }

    // 4. Détection Capteur de Lumière VEML7700
    // "VEML7700 | Lux: 20.28" ou "Canal 4 : 20.28 Lux" ou "Lux: 20.28"
    const luxMatch = cleanLine.match(/(?:Lux:\s*([0-9.]+)|([0-9.]+)\s*Lux)/i);
    if (luxMatch) {
      const luxValue = parseFloat(luxMatch[1] || luxMatch[2]);
      if (!isNaN(luxValue)) {
        const lightChan = (this.currentChannel >= 4 && this.currentChannel <= 7) ? this.currentChannel : 4;
        callbacks.onLightData?.(lightChan, luxValue);
        callbacks.onLog?.(`[USB Lumière Niveau ${8 - lightChan}] ${luxValue} Lux`, 'sensor');
      }
      return;
    }

    // Ligne générale ou debug
    if (cleanLine.length > 3) {
      callbacks.onLog?.(cleanLine, 'sys');
    }
  }
}

export const webSerial = new WebSerialManager();
