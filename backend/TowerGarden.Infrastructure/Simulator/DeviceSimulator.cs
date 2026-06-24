using System;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MQTTnet;
using MQTTnet.Client;

namespace TowerGarden.Infrastructure.Simulator
{
    /// <summary>
    /// Simulateur matériel d'arrière-plan représentant la Tower Garden physique.
    /// Il se connecte au broker MQTT local, s'abonne aux commandes de contrôle et
    /// publie des données de capteurs simulées de manière périodique.
    /// </summary>
    public class DeviceSimulator : BackgroundService
    {
        private readonly ILogger<DeviceSimulator> _logger;
        private IMqttClient _mqttClient;
        private readonly Random _random = new Random();

        // État interne simulé de l'appareil
        private bool _pumpActive = false;
        private int _pumpDurationSeconds = 60;
        private int _pumpIntervalMinutes = 15;
        private int _pumpCycleSeconds = 0;
        private int _pumpRunSeconds = 0;

        private bool _lightOn = false;
        private int _red = 180;
        private int _green = 70;
        private int _blue = 240;
        private int _lightStartHour = 8;
        private int _lightDurationHours = 16;

        // Variables physiques simulées
        private double _waterLevelPercent = 85.0; // Niveau d'eau (%)
        private double _baseTemp = 21.0;
        private double _baseHumidity = 55.0;
        private bool _leakDetected = false;
        private int _leakDryingSeconds = 0;

        public DeviceSimulator(ILogger<DeviceSimulator> logger)
        {
            _logger = logger;
        }

        private bool IsPumpCurrentlyRunning()
        {
            return _pumpActive && _pumpCycleSeconds < _pumpDurationSeconds;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("[Device Simulator] Démarrage de la simulation de la Tower Garden...");

            // Attendre un peu que le broker MQTT soit démarré
            await Task.Delay(TimeSpan.FromSeconds(2), stoppingToken);

            var factory = new MqttFactory();
            _mqttClient = factory.CreateMqttClient();

            var options = new MqttClientOptionsBuilder()
                .WithTcpServer("localhost", 1883)
                .WithClientId("TowerGarden_Hardware_Simulator")
                .WithCredentials("garden_device", "SafeDeviceToken556!")
                .WithCleanSession()
                .Build();

            _mqttClient.ApplicationMessageReceivedAsync += HandleControlCommandsAsync;

            // Reconnexion automatique et réabonnement en cas de déconnexion (grâce à ConnectedAsync)
            _mqttClient.ConnectedAsync += async e =>
            {
                _logger.LogInformation("[Device Simulator] Simulateur connecté au broker MQTT local. Configuration des souscriptions...");
                try
                {
                    await _mqttClient.SubscribeAsync("towergarden/pump/control", MQTTnet.Protocol.MqttQualityOfServiceLevel.AtLeastOnce, stoppingToken);
                    await _mqttClient.SubscribeAsync("towergarden/light/control", MQTTnet.Protocol.MqttQualityOfServiceLevel.AtLeastOnce, stoppingToken);
                    _logger.LogInformation("[Device Simulator] Abonnements configurés sur les commandes de pompe et d'éclairage.");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "[Device Simulator] Échec de la souscription aux topics de commande.");
                }
            };

            // Connexion initiale au broker
            try
            {
                await _mqttClient.ConnectAsync(options, stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Device Simulator] Impossible de connecter le simulateur au broker.");
                return;
            }

            // Boucle principale de la simulation (toutes les 3 secondes)
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    if (_mqttClient.IsConnected)
                    {
                        await PublishSimulatedSensorsAsync();
                    }
                    else
                    {
                        _logger.LogWarning("[Device Simulator] Client déconnecté du broker MQTT. Tentative de reconnexion...");
                        await _mqttClient.ConnectAsync(options, stoppingToken);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "[Device Simulator] Erreur lors de la publication de la simulation.");
                }

                // Cycle de simulation
                UpdatePhysicalState();

                await Task.Delay(TimeSpan.FromSeconds(3), stoppingToken);
            }
        }

        /// <summary>
        /// Simule le comportement physique du réservoir d'eau, du calendrier d'arrosage et des fuites.
        /// </summary>
        private void UpdatePhysicalState()
        {
            var isRunning = IsPumpCurrentlyRunning();

            if (_pumpActive)
            {
                _pumpCycleSeconds += 3;
                if (_pumpCycleSeconds >= _pumpIntervalMinutes * 60)
                {
                    _pumpCycleSeconds = 0;
                }
            }
            else
            {
                _pumpCycleSeconds = 0;
            }

            // Si la pompe tourne physiquement, le niveau d'eau diminue très lentement (par évaporation/absorption)
            if (isRunning)
            {
                _waterLevelPercent -= 0.05;
                if (_waterLevelPercent < 0) _waterLevelPercent = 0;

                _pumpRunSeconds += 3;
                // Si la pompe tourne depuis plus de 15 secondes consécutives, une fuite est détectée
                if (_pumpRunSeconds > 15 && !_leakDetected)
                {
                    _logger.LogWarning("[Device Simulator] Fuite d'eau simulée détectée à la base (côté Sud) !");
                    _leakDetected = true;
                    _leakDryingSeconds = 12;
                }
            }
            else
            {
                // Simulation d'une légère condensation
                _waterLevelPercent -= 0.005;
                if (_waterLevelPercent < 0) _waterLevelPercent = 0;

                _pumpRunSeconds = 0;

                // Si on a eu une fuite et que la pompe est arrêtée, la base sèche progressivement
                if (_leakDetected)
                {
                    if (_leakDryingSeconds > 0)
                    {
                        _leakDryingSeconds -= 3;
                    }
                    if (_leakDryingSeconds <= 0)
                    {
                        _logger.LogInformation("[Device Simulator] La base a séché. Fuite résolue.");
                        _leakDetected = false;
                    }
                }
            }

            // Remise à niveau automatique si le réservoir est vide (pour le besoin de la démo utilisateur)
            if (_waterLevelPercent < 5.0)
            {
                _logger.LogInformation("[Device Simulator] Réservoir presque vide. Simulation d'un remplissage automatique...");
                _waterLevelPercent = 90.0;
            }
        }

        /// <summary>
        /// Génère et publie les relevés des capteurs au format JSON.
        /// </summary>
        private async Task PublishSimulatedSensorsAsync()
        {
            // Fluctuation aléatoire de la température et humidité
            double t1 = _baseTemp + (_random.NextDouble() * 1.0 - 0.5);
            double t2 = _baseTemp + 0.5 + (_random.NextDouble() * 0.8 - 0.4);
            double hum = _baseHumidity + (_random.NextDouble() * 4.0 - 2.0);

            // Ajustement des Lux selon l'état de la lumière
            double baseLux = _lightOn ? 10000.0 : 120.0;
            // Chaque lux aura une valeur légèrement différente selon sa position par rapport aux LED
            double lux1 = Math.Max(0, baseLux + (_random.NextDouble() * 500 - 250) * (_lightOn ? 1 : 0.1));
            double lux2 = Math.Max(0, baseLux * 0.9 + (_random.NextDouble() * 400 - 200) * (_lightOn ? 1 : 0.1));
            double lux3 = Math.Max(0, baseLux * 0.8 + (_random.NextDouble() * 300 - 150) * (_lightOn ? 1 : 0.1));
            double lux4 = Math.Max(0, baseLux * 0.6 + (_random.NextDouble() * 200 - 100) * (_lightOn ? 1 : 0.1));

            // Interrupteur à flotteur (actif/vrai si niveau d'eau > 20%)
            bool floatSwitch = _waterLevelPercent > 20.0;

            // 4 détecteurs de fuite à la base de l'hydro (Nord, Est, Sud, Ouest)
            // Ils sont secs (false) par défaut, sauf le Sud (waterDetector3) si une fuite est simulée.
            bool d1 = false;
            bool d2 = false;
            bool d3 = _leakDetected;
            bool d4 = false;

            var payloadObj = new
            {
                timestamp = DateTime.UtcNow,
                temperature1 = Math.Round(t1, 2),
                temperature2 = Math.Round(t2, 2),
                humidityPercent = Math.Round(hum, 1),
                lux1 = Math.Round(lux1, 0),
                lux2 = Math.Round(lux2, 0),
                lux3 = Math.Round(lux3, 0),
                lux4 = Math.Round(lux4, 0),
                floatSwitchState = floatSwitch,
                waterDetector1 = d1,
                waterDetector2 = d2,
                waterDetector3 = d3,
                waterDetector4 = d4,
                isPumpRunning = IsPumpCurrentlyRunning()
            };

            var payloadStr = JsonSerializer.Serialize(payloadObj);
            
            var message = new MqttApplicationMessageBuilder()
                .WithTopic("towergarden/sensors")
                .WithPayload(payloadStr)
                .WithQualityOfServiceLevel(MQTTnet.Protocol.MqttQualityOfServiceLevel.AtLeastOnce)
                .Build();

            await _mqttClient.PublishAsync(message);
        }

        /// <summary>
        /// Gère la réception des commandes provenant du backend.
        /// </summary>
        private Task HandleControlCommandsAsync(MqttApplicationMessageReceivedEventArgs e)
        {
            var topic = e.ApplicationMessage.Topic;
            var payloadSegment = e.ApplicationMessage.PayloadSegment;
            var payload = Encoding.UTF8.GetString(payloadSegment.Array, payloadSegment.Offset, payloadSegment.Count);

            _logger.LogInformation($"[Device Simulator] Commande reçue sur {topic}");

            try
            {
                using var doc = JsonDocument.Parse(payload);
                var root = doc.RootElement;

                if (topic == "towergarden/pump/control")
                {
                    if (root.TryGetProperty("isActive", out var activeProp))
                    {
                        var oldActive = _pumpActive;
                        _pumpActive = activeProp.GetBoolean();
                        if (oldActive != _pumpActive)
                        {
                            _pumpCycleSeconds = 0; // Réinitialise le calendrier lors d'une modification
                        }
                    }
                    
                    if (root.TryGetProperty("openDurationSeconds", out var durationProp))
                        _pumpDurationSeconds = durationProp.GetInt32();
                    
                    if (root.TryGetProperty("openIntervalMinutes", out var intervalProp))
                        _pumpIntervalMinutes = intervalProp.GetInt32();

                    _logger.LogInformation($"[Device Simulator] Pompe mise à jour -> Activée: {_pumpActive}, Durée: {_pumpDurationSeconds}s, Intervalle: {_pumpIntervalMinutes}m");
                }
                else if (topic == "towergarden/light/control")
                {
                    if (root.TryGetProperty("isOn", out var onProp))
                        _lightOn = onProp.GetBoolean();
                    
                    if (root.TryGetProperty("red", out var rProp))
                        _red = rProp.GetInt32();
                    
                    if (root.TryGetProperty("green", out var gProp))
                        _green = gProp.GetInt32();
                    
                    if (root.TryGetProperty("blue", out var bProp))
                        _blue = bProp.GetInt32();
                    
                    if (root.TryGetProperty("startHour", out var startProp))
                        _lightStartHour = startProp.GetInt32();
                    
                    if (root.TryGetProperty("dailyDurationHours", out var durationProp))
                        _lightDurationHours = durationProp.GetInt32();

                    _logger.LogInformation($"[Device Simulator] Lumière mise à jour -> Allumée: {_lightOn}, RGB: ({_red},{_green},{_blue}), Début: {_lightStartHour}h, Durée: {_lightDurationHours}h");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Device Simulator] Erreur de parsing de la commande.");
            }

            return Task.CompletedTask;
        }

        public override async Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("[Device Simulator] Arrêt de la simulation...");
            if (_mqttClient != null)
            {
                if (_mqttClient.IsConnected)
                {
                    await _mqttClient.DisconnectAsync(new MqttClientDisconnectOptions(), cancellationToken);
                }
                _mqttClient.Dispose();
            }
            await base.StopAsync(cancellationToken);
        }
    }
}
