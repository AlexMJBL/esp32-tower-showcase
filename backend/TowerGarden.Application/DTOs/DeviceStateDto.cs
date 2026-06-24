namespace TowerGarden.Application.DTOs
{
    /// <summary>
    /// Regroupe l'état complet du système pour l'envoi initial au frontend (State Synchronization).
    /// </summary>
    public class DeviceStateDto
    {
        public PumpDto Pump { get; set; }
        public LightDto Light { get; set; }
        public SensorReadingDto LatestReading { get; set; }
    }
}
