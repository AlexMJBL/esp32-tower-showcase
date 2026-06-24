using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using TowerGarden.Application.DTOs;
using TowerGarden.Application.Interfaces;

namespace TowerGarden.WebApi.Hubs
{
    /// <summary>
    /// Implémentation du diffuseur de hub SignalR. Elle implémente ISensorHubDispatcher
    /// de la couche Application, respectant ainsi le principe SOLID de Dependency Inversion.
    /// </summary>
    public class SensorHubDispatcher : ISensorHubDispatcher
    {
        private readonly IHubContext<SensorHub> _hubContext;

        public SensorHubDispatcher(IHubContext<SensorHub> hubContext)
        {
            _hubContext = hubContext;
        }

        public async Task DispatchSensorReadingAsync(SensorReadingDto reading)
        {
            // Diffuse le relevé de capteurs à tous les clients connectés
            await _hubContext.Clients.All.SendAsync("ReceiveSensorReading", reading);
        }

        public async Task DispatchPumpStateAsync(PumpDto pump)
        {
            // Diffuse l'état de la pompe à tous les clients
            await _hubContext.Clients.All.SendAsync("ReceivePumpState", pump);
        }

        public async Task DispatchLightStateAsync(LightDto light)
        {
            // Diffuse l'état de l'éclairage à tous les clients
            await _hubContext.Clients.All.SendAsync("ReceiveLightState", light);
        }
    }
}
