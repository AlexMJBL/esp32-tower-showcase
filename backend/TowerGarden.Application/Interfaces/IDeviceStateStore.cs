using System.Collections.Generic;
using System.Threading.Tasks;
using TowerGarden.Domain.Entities;

namespace TowerGarden.Application.Interfaces
{
    /// <summary>
    /// Définit le contrat pour l'accès aux données persistées (actuellement en mémoire, mais respecte SOLID
    /// en permettant de remplacer l'implémentation par une base de données sans modifier l'application).
    /// </summary>
    public interface IDeviceStateStore
    {
        /// <summary>
        /// Récupère la configuration actuelle de la pompe.
        /// </summary>
        Task<Pump> GetPumpAsync();

        /// <summary>
        /// Enregistre la configuration de la pompe.
        /// </summary>
        Task SavePumpAsync(Pump pump);

        /// <summary>
        /// Récupère la configuration actuelle de l'éclairage.
        /// </summary>
        Task<Light> GetLightAsync();

        /// <summary>
        /// Enregistre la configuration de l'éclairage.
        /// </summary>
        Task SaveLightAsync(Light light);

        /// <summary>
        /// Ajoute une nouvelle lecture des capteurs à l'historique et met à jour la valeur courante.
        /// </summary>
        Task AddSensorReadingAsync(SensorReading reading);

        /// <summary>
        /// Récupère la lecture de capteurs la plus récente.
        /// </summary>
        Task<SensorReading> GetLatestSensorReadingAsync();

        /// <summary>
        /// Récupère l'historique des relevés (par exemple les N derniers pour l'affichage graphique).
        /// </summary>
        Task<IEnumerable<SensorReading>> GetSensorHistoryAsync(int count);
    }
}
