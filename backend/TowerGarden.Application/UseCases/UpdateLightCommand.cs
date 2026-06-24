using System.Text.Json;
using System.Threading.Tasks;
using TowerGarden.Application.DTOs;
using TowerGarden.Application.Interfaces;

namespace TowerGarden.Application.UseCases
{
    /// <summary>
    /// Cas d'utilisation : Mettre à jour la configuration d'éclairage (RGB, horaire, état d'allumage).
    /// </summary>
    public class UpdateLightCommand
    {
        private readonly IDeviceStateStore _stateStore;
        private readonly IMqttClientService _mqttClient;
        private readonly ISensorHubDispatcher _hubDispatcher;

        public UpdateLightCommand(IDeviceStateStore stateStore, IMqttClientService mqttClient, ISensorHubDispatcher hubDispatcher)
        {
            _stateStore = stateStore;
            _mqttClient = mqttClient;
            _hubDispatcher = hubDispatcher;
        }

        /// <summary>
        /// Exécute la mise à jour des paramètres de lumière.
        /// </summary>
        public async Task ExecuteAsync(LightDto dto)
        {
            // 1. Récupération de l'entité
            var light = await _stateStore.GetLightAsync();

            // 2. Mise à jour de l'état avec validation du domaine
            light.SetPowerState(dto.IsOn);
            light.UpdateColor(dto.Red, dto.Green, dto.Blue);
            light.UpdateSchedule(dto.StartHour, dto.DailyDurationHours);

            // 3. Sauvegarde de l'état
            await _stateStore.SaveLightAsync(light);

            // Diffusion SignalR immédiate pour le temps réel
            await _hubDispatcher.DispatchLightStateAsync(dto);

            // 4. Notification du matériel via MQTT
            var mqttPayload = JsonSerializer.Serialize(new
            {
                isOn = light.IsOn,
                red = light.Red,
                green = light.Green,
                blue = light.Blue,
                startHour = light.StartHour,
                dailyDurationHours = light.DailyDurationHours
            });

            await _mqttClient.PublishAsync("towergarden/light/control", mqttPayload);
        }
    }
}
