using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TowerGarden.Application.Interfaces;
using TowerGarden.Domain.Entities;

namespace TowerGarden.Infrastructure.Persistence
{
    /// <summary>
    /// Implémentation en mémoire pour stocker l'état de la Tower Garden.
    /// Thread-safe pour gérer les requêtes HTTP concurrentes et les appels d'arrière-plan du simulateur.
    /// </summary>
    public class InMemoryDeviceStateStore : IDeviceStateStore
    {
        private Pump _pump;
        private Light _light;
        private readonly ConcurrentQueue<SensorReading> _sensorHistory;
        private SensorReading _latestReading;
        private readonly object _lock = new object();
        private const int MaxHistorySize = 100; // Limite la taille de l'historique en mémoire

        public InMemoryDeviceStateStore()
        {
            // Initialisation avec des valeurs par défaut réalistes
            _pump = new Pump(Guid.NewGuid(), isActive: false, openDurationSeconds: 60, openIntervalMinutes: 15);
            _light = new Light(Guid.NewGuid(), isOn: false, red: 180, green: 70, blue: 240, startHour: 8, dailyDurationHours: 16);
            _sensorHistory = new ConcurrentQueue<SensorReading>();
            
            // Relevé initial fictif pour éviter les valeurs nulles au démarrage
            _latestReading = new SensorReading(
                Guid.NewGuid(),
                DateTime.UtcNow,
                temperature1: 21.5,
                temperature2: 22.0,
                humidityPercent: 55.0,
                lux1: 0.0,
                lux2: 0.0,
                lux3: 0.0,
                lux4: 0.0,
                floatSwitchState: true, // Eau OK
                waterDetector1: false,  // Pas de fuite
                waterDetector2: false,
                waterDetector3: false,
                waterDetector4: false,
                isPumpRunning: false
            );
            _sensorHistory.Enqueue(_latestReading);
        }

        public Task<Pump> GetPumpAsync()
        {
            lock (_lock)
            {
                return Task.FromResult(_pump);
            }
        }

        public Task SavePumpAsync(Pump pump)
        {
            lock (_lock)
            {
                _pump = pump;
            }
            return Task.CompletedTask;
        }

        public Task<Light> GetLightAsync()
        {
            lock (_lock)
            {
                return Task.FromResult(_light);
            }
        }

        public Task SaveLightAsync(Light light)
        {
            lock (_lock)
            {
                _light = light;
            }
            return Task.CompletedTask;
        }

        public Task AddSensorReadingAsync(SensorReading reading)
        {
            lock (_lock)
            {
                _latestReading = reading;
            }

            _sensorHistory.Enqueue(reading);

            // On purge l'historique s'il dépasse la limite pour éviter de saturer la RAM
            while (_sensorHistory.Count > MaxHistorySize)
            {
                _sensorHistory.TryDequeue(out _);
            }

            return Task.CompletedTask;
        }

        public Task<SensorReading> GetLatestSensorReadingAsync()
        {
            lock (_lock)
            {
                return Task.FromResult(_latestReading);
            }
        }

        public Task<IEnumerable<SensorReading>> GetSensorHistoryAsync(int count)
        {
            // Retourne les N derniers éléments de l'historique
            var history = _sensorHistory.TakeLast(count).ToList();
            return Task.FromResult<IEnumerable<SensorReading>>(history);
        }
    }
}
