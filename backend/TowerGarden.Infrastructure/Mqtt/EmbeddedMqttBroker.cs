using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MQTTnet;
using MQTTnet.Server;

namespace TowerGarden.Infrastructure.Mqtt
{
    /// <summary>
    /// Service d'arrière-plan démarrant un Broker MQTT local intégré à l'application sur le port 1883.
    /// Évite d'avoir à installer un service tiers (ex: Mosquitto) pour faire fonctionner l'écosystème.
    /// </summary>
    public class EmbeddedMqttBroker : IHostedService
    {
        private readonly ILogger<EmbeddedMqttBroker> _logger;
        private MqttServer _mqttServer;

        public EmbeddedMqttBroker(ILogger<EmbeddedMqttBroker> logger)
        {
            _logger = logger;
        }

        public async Task StartAsync(CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogInformation("[MQTT Broker] Démarrage du broker MQTT embarqué...");

                var mqttFactory = new MqttFactory();
                
                // Configurer le serveur pour écouter sur localhost:1883
                var options = new MqttServerOptionsBuilder()
                    .WithDefaultEndpoint()
                    .WithDefaultEndpointPort(1883)
                    .Build();

                _mqttServer = mqttFactory.CreateMqttServer(options);

                // Authentification sécurisée des appareils MQTT (OWASP A07:2021)
                _mqttServer.ValidatingConnectionAsync += e =>
                {
                    if (e.UserName != "garden_device" || e.Password != "SafeDeviceToken556!")
                    {
                        e.ReasonCode = MQTTnet.Protocol.MqttConnectReasonCode.BadUserNameOrPassword;
                        _logger.LogWarning($"[MQTT Broker] Connexion refusée pour ClientId = {e.ClientId} (Identifiants invalides)");
                    }
                    else
                    {
                        e.ReasonCode = MQTTnet.Protocol.MqttConnectReasonCode.Success;
                    }
                    return Task.CompletedTask;
                };

                // Ajouter des logs lors des connexions et déconnexions de clients pour le debug
                _mqttServer.ClientConnectedAsync += e =>
                {
                    _logger.LogInformation($"[MQTT Broker] Client connecté : ClientId = {e.ClientId}, Adresse = {e.Endpoint}");
                    return Task.CompletedTask;
                };

                _mqttServer.ClientDisconnectedAsync += e =>
                {
                    _logger.LogInformation($"[MQTT Broker] Client déconnecté : ClientId = {e.ClientId}, Type = {e.DisconnectType}");
                    return Task.CompletedTask;
                };

                await _mqttServer.StartAsync();
                _logger.LogInformation("[MQTT Broker] Broker MQTT embarqué démarré avec succès sur le port 1883.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[MQTT Broker] Échec du démarrage du broker MQTT.");
                throw;
            }
        }

        public async Task StopAsync(CancellationToken cancellationToken)
        {
            if (_mqttServer != null)
            {
                _logger.LogInformation("[MQTT Broker] Arrêt du broker MQTT embarqué...");
                await _mqttServer.StopAsync();
                _mqttServer.Dispose();
                _logger.LogInformation("[MQTT Broker] Broker MQTT embarqué arrêté proprement.");
            }
        }
    }
}
