using System.Threading.Tasks;
using TowerGarden.Application.DTOs;
using TowerGarden.Application.Interfaces;

namespace TowerGarden.Application.UseCases
{
    /// <summary>
    /// Cas d'utilisation : Récupérer l'état complet actuel de la Tower Garden.
    /// Suit le principe SOLID de Single Responsibility.
    /// </summary>
    public class GetDeviceStateQuery
    {
        private readonly IDeviceStateStore _stateStore;

        public GetDeviceStateQuery(IDeviceStateStore stateStore)
        {
            _stateStore = stateStore;
        }

        /// <summary>
        /// Exécute la requête pour agréger et retourner l'état actuel de la pompe, de la lumière et du dernier relevé de capteurs.
        /// </summary>
        public async Task<DeviceStateDto> ExecuteAsync()
        {
            var pump = await _stateStore.GetPumpAsync();
            var light = await _stateStore.GetLightAsync();
            var latestReading = await _stateStore.GetLatestSensorReadingAsync();

            var pumpDto = new PumpDto
            {
                IsActive = pump.IsActive,
                OpenDurationSeconds = pump.OpenDurationSeconds,
                OpenIntervalMinutes = pump.OpenIntervalMinutes
            };

            var lightDto = new LightDto
            {
                IsOn = light.IsOn,
                Red = light.Red,
                Green = light.Green,
                Blue = light.Blue,
                StartHour = light.StartHour,
                DailyDurationHours = light.DailyDurationHours
            };

            SensorReadingDto readingDto = null;
            if (latestReading != null)
            {
                readingDto = new SensorReadingDto
                {
                    Timestamp = latestReading.Timestamp,
                    Temperature1 = latestReading.Temperature1,
                    Temperature2 = latestReading.Temperature2,
                    HumidityPercent = latestReading.HumidityPercent,
                    Lux1 = latestReading.Lux1,
                    Lux2 = latestReading.Lux2,
                    Lux3 = latestReading.Lux3,
                    Lux4 = latestReading.Lux4,
                    FloatSwitchState = latestReading.FloatSwitchState,
                    WaterDetector1 = latestReading.WaterDetector1,
                    WaterDetector2 = latestReading.WaterDetector2,
                    WaterDetector3 = latestReading.WaterDetector3,
                    WaterDetector4 = latestReading.WaterDetector4,
                    IsPumpRunning = latestReading.IsPumpRunning
                };
            }

            return new DeviceStateDto
            {
                Pump = pumpDto,
                Light = lightDto,
                LatestReading = readingDto
            };
        }
    }
}
