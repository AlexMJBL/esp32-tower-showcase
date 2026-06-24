using System;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MQTTnet;
using MQTTnet.Client;
using TowerGarden.Application.DTOs;
using TowerGarden.Application.Interfaces;
using TowerGarden.Application.UseCases;

namespace TowerGarden.Infrastructure.Mqtt
{
    /// <summary>
    /// Service gérant la connexion client MQTT vers le broker local.
    /// Il publie des commandes (IMqttClientService) et écoute en arrière-plan (IHostedService)
    /// les relevés de capteurs provenant du matériel simulé pour les réinjecter dans le domaine.
    /// </summary>
    public class MqttClientService : IMqttClientService, IHostedService
    {
        private readonly ILogger<MqttClientService> _logger;
        private readonly IServiceScopeFactory _scopeFactory;
        private IMqttClient _mqttClient;
        private MqttClientOptions _mqttOptions;

        public MqttClientService(ILogger<MqttClientService> logger, IServiceScopeFactory scopeFactory)
        {
            _logger = logger;
            _scopeFactory = scopeFactory;
        }

        public async Task StartAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("[MQTT Client] Initialisation du client MQTT de l'API...");

            var factory = new MqttFactory();
            _mqttClient = factory.CreateMqttClient();

            // Configuration du client pour se connecter au broker local sur le port 1883
            _mqttOptions = new MqttClientOptionsBuilder()
                .WithTcpServer("localhost", 1883)
                .WithClientId("TowerGarden_WebApi_Backend")
                .WithCredentials("garden_device", "SafeDeviceToken556!")
                .WithCleanSession()
                .Build();

            // Gestion de la réception des messages
            _mqttClient.ApplicationMessageReceivedAsync += HandleIncomingMessageAsync;

            // Reconnexion automatique si la connexion est coupée
            _mqttClient.DisconnectedAsync += async e =>
            {
                _logger.LogWarning("[MQTT Client] Client déconnecté. Tentative de reconnexion dans 5 secondes...");
                await Task.Delay(TimeSpan.FromSeconds(5), cancellationToken);
                try
                {
                    if (!cancellationToken.IsCancellationRequested)
                    {
                        await _mqttClient.ConnectAsync(_mqttOptions, cancellationToken);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "[MQTT Client] Échec de la tentative de reconnexion automatique.");
                }
            };

            // Souscription automatique lors de chaque connexion (initiale ou après reconnexion)
            _mqttClient.ConnectedAsync += async e =>
            {
                _logger.LogInformation("[MQTT Client] Client MQTT connecté. Configuration des souscriptions...");
                try
                {
                    await _mqttClient.SubscribeAsync("towergarden/sensors", MQTTnet.Protocol.MqttQualityOfServiceLevel.AtLeastOnce, cancellationToken);
                    _logger.LogInformation("[MQTT Client] Souscription effectuée au topic : towergarden/sensors");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "[MQTT Client] Échec de la souscription aux topics.");
                }
            };

            // Connexion initiale
            try
            {
                await _mqttClient.ConnectAsync(_mqttOptions, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[MQTT Client] Impossible de se connecter initialement au broker MQTT.");
            }
        }

        public async Task StopAsync(CancellationToken cancellationToken)
        {
            if (_mqttClient != null)
            {
                _logger.LogInformation("[MQTT Client] Déconnexion et libération du client MQTT...");
                if (_mqttClient.IsConnected)
                {
                    await _mqttClient.DisconnectAsync(new MqttClientDisconnectOptions(), cancellationToken);
                }
                _mqttClient.Dispose();
            }
        }

        /// <summary>
        /// Publie un message de commande (JSON) vers le matériel.
        /// Implémente IMqttClientService.
        /// </summary>
        public async Task PublishAsync(string topic, string payload)
        {
            if (_mqttClient == null || !_mqttClient.IsConnected)
            {
                _logger.LogWarning($"[MQTT Client] Impossible de publier sur {topic} car le client n'est pas connecté.");
                return;
            }

            var message = new MqttApplicationMessageBuilder()
                .WithTopic(topic)
                .WithPayload(payload)
                .WithQualityOfServiceLevel(MQTTnet.Protocol.MqttQualityOfServiceLevel.AtLeastOnce)
                .Build();

            await _mqttClient.PublishAsync(message);
            _logger.LogInformation($"[MQTT Client] Message publié sur {topic}");
        }

        /// <summary>
        /// Gère la réception des messages MQTT entrants et invoque les Use Cases appropriés.
        /// </summary>
        private async Task HandleIncomingMessageAsync(MqttApplicationMessageReceivedEventArgs e)
        {
            var topic = e.ApplicationMessage.Topic;
            var payloadSegment = e.ApplicationMessage.PayloadSegment;
            var payload = Encoding.UTF8.GetString(payloadSegment.Array, payloadSegment.Offset, payloadSegment.Count);

            _logger.LogInformation($"[MQTT Client] Message reçu sur {topic}");

            try
            {
                if (topic == "towergarden/sensors")
                {
                    // Désérialisation du relevé de capteurs
                    var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var sensorDto = JsonSerializer.Deserialize<SensorReadingDto>(payload, options);

                    if (sensorDto != null)
                    {
                        // On crée un scope d'injection de dépendances pour instancier notre Use Case (Scopie)
                        using var scope = _scopeFactory.CreateScope();
                        var processReadingCmd = scope.ServiceProvider.GetRequiredService<ProcessSensorReadingCommand>();
                        
                        await processReadingCmd.ExecuteAsync(sensorDto);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"[MQTT Client] Erreur lors du traitement du message MQTT sur le topic {topic}");
            }
        }
    }
}
