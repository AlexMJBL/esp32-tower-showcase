using System.Threading.Tasks;
using TowerGarden.Application.DTOs;

namespace TowerGarden.Application.Interfaces
{
    /// <summary>
    /// Contrat pour distribuer les mises à jour en temps réel aux clients connectés (ex: navigateurs Web).
    /// Permet de notifier le frontend sans coupler l'Application à SignalR directement.
    /// </summary>
    public interface ISensorHubDispatcher
    {
        /// <summary>
        /// Envoie un relevé de capteurs récent à tous les clients.
        /// </summary>
        Task DispatchSensorReadingAsync(SensorReadingDto reading);

        /// <summary>
        /// Envoie le nouvel état de la pompe à tous les clients.
        /// </summary>
        Task DispatchPumpStateAsync(PumpDto pump);

        /// <summary>
        /// Envoie le nouvel état de l'éclairage à tous les clients.
        /// </summary>
        Task DispatchLightStateAsync(LightDto light);
    }
}
