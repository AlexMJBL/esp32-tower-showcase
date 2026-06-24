using System.Threading.Tasks;

namespace TowerGarden.Application.Interfaces
{
    /// <summary>
    /// Interface décrivant le service de communication MQTT.
    /// Elle permet à la couche Application de publier des commandes vers le matériel
    /// sans dépendre directement de la bibliothèque MQTTnet (respect du Dependency Inversion Principle).
    /// </summary>
    public interface IMqttClientService
    {
        /// <summary>
        /// Publie un message textuel/JSON sur un topic MQTT donné.
        /// </summary>
        /// <param name="topic">Le canal MQTT (ex: towergarden/pump/control).</param>
        /// <param name="payload">Le contenu sérialisé en JSON.</param>
        Task PublishAsync(string topic, string payload);
    }
}
