using System.Text.Json;
using System.Threading.Tasks;
using TowerGarden.Application.DTOs;
using TowerGarden.Application.Interfaces;

namespace TowerGarden.Application.UseCases
{
    /// <summary>
    /// Cas d'utilisation : Mettre à jour l'état et la configuration de la pompe.
    /// Met à jour le domaine, persiste le nouvel état et publie la commande vers MQTT.
    /// </summary>
    public class UpdatePumpCommand
    {
        private readonly IDeviceStateStore _stateStore;
        private readonly IMqttClientService _mqttClient;
        private readonly ISensorHubDispatcher _hubDispatcher;

        public UpdatePumpCommand(IDeviceStateStore stateStore, IMqttClientService mqttClient, ISensorHubDispatcher hubDispatcher)
        {
            _stateStore = stateStore;
            _mqttClient = mqttClient;
            _hubDispatcher = hubDispatcher;
        }

        /// <summary>
        /// Exécute la mise à jour de la configuration de la pompe.
        /// </summary>
        public async Task ExecuteAsync(PumpDto dto)
        {
            // 1. Récupération de l'entité de domaine
            var pump = await _stateStore.GetPumpAsync();

            // 2. Application des modifications et validations via le Domaine (SOLID / encapsulation)
            pump.SetActiveState(dto.IsActive);
            pump.UpdateSchedule(dto.OpenDurationSeconds, dto.OpenIntervalMinutes);

            // 3. Persistance du nouvel état
            await _stateStore.SavePumpAsync(pump);

            // Diffusion SignalR immédiate pour fluidité de l'interface
            await _hubDispatcher.DispatchPumpStateAsync(dto);

            // 4. Publication de l'événement / commande via MQTT pour avertir le matériel
            var mqttPayload = JsonSerializer.Serialize(new
            {
                isActive = pump.IsActive,
                openDurationSeconds = pump.OpenDurationSeconds,
                openIntervalMinutes = pump.OpenIntervalMinutes
            });

            // On publie sur le topic de contrôle de la pompe
            await _mqttClient.PublishAsync("towergarden/pump/control", mqttPayload);
        }
    }
}
