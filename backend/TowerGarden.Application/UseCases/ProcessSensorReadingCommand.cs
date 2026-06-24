using System;
using System.Text.Json;
using System.Threading.Tasks;
using TowerGarden.Application.DTOs;
using TowerGarden.Application.Interfaces;
using TowerGarden.Domain.Entities;

namespace TowerGarden.Application.UseCases
{
    /// <summary>
    /// Cas d'utilisation : Recevoir et traiter une nouvelle mesure de capteurs.
    /// Valide, sauvegarde et pousse la donnée vers les clients SignalR.
    /// Gère également l'arrêt d'urgence de la pompe en cas de fuite d'eau détectée (Safety Loop).
    /// </summary>
    public class ProcessSensorReadingCommand
    {
        private readonly IDeviceStateStore _stateStore;
        private readonly ISensorHubDispatcher _hubDispatcher;
        private readonly IMqttClientService _mqttClient;

        public ProcessSensorReadingCommand(
            IDeviceStateStore stateStore, 
            ISensorHubDispatcher hubDispatcher,
            IMqttClientService mqttClient)
        {
            _stateStore = stateStore;
            _hubDispatcher = hubDispatcher;
            _mqttClient = mqttClient;
        }

        /// <summary>
        /// Exécute la logique de réception de mesure des capteurs.
        /// </summary>
        public async Task ExecuteAsync(SensorReadingDto dto)
        {
            // 1. Création de l'entité de domaine
            var reading = new SensorReading(
                Guid.NewGuid(),
                dto.Timestamp == default ? DateTime.UtcNow : dto.Timestamp,
                dto.Temperature1,
                dto.Temperature2,
                dto.HumidityPercent,
                dto.Lux1,
                dto.Lux2,
                dto.Lux3,
                dto.Lux4,
                dto.FloatSwitchState,
                dto.WaterDetector1,
                dto.WaterDetector2,
                dto.WaterDetector3,
                dto.WaterDetector4,
                dto.IsPumpRunning
            );

            // 2. Persistance dans notre magasin en mémoire
            await _stateStore.AddSensorReadingAsync(reading);

            // 3. Boucle de sécurité (Safety Loop) : arrêt de la pompe en cas de détection de fuite
            // Les 4 détecteurs d'eau sont positionnés aux angles de la base de l'hydro.
            // Si l'un d'eux détecte de l'eau (true = fuite), on arrête d'urgence la pompe.
            if (dto.WaterDetector1 || dto.WaterDetector2 || dto.WaterDetector3 || dto.WaterDetector4)
            {
                var pump = await _stateStore.GetPumpAsync();
                if (pump.IsActive)
                {
                    // Désactivation de la pompe dans le domaine
                    pump.SetActiveState(false);
                    await _stateStore.SavePumpAsync(pump);

                    // Notification immédiate du frontend via SignalR
                    await _hubDispatcher.DispatchPumpStateAsync(new PumpDto
                    {
                        IsActive = pump.IsActive,
                        OpenDurationSeconds = pump.OpenDurationSeconds,
                        OpenIntervalMinutes = pump.OpenIntervalMinutes
                    });

                    // Publication de la commande d'arrêt d'urgence sur MQTT
                    var mqttPayload = JsonSerializer.Serialize(new
                    {
                        isActive = false,
                        openDurationSeconds = pump.OpenDurationSeconds,
                        openIntervalMinutes = pump.OpenIntervalMinutes
                    });

                    await _mqttClient.PublishAsync("towergarden/pump/control", mqttPayload);
                }
            }

            // 4. Diffusion en temps réel des capteurs vers le frontend
            await _hubDispatcher.DispatchSensorReadingAsync(dto);
        }
    }
}
