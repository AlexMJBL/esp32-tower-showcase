using System;

namespace TowerGarden.Application.DTOs
{
    /// <summary>
    /// Objet de transfert de données pour envoyer les relevés de capteurs en temps réel.
    /// </summary>
    public class SensorReadingDto
    {
        public DateTime Timestamp { get; set; }
        public double Temperature1 { get; set; }
        public double Temperature2 { get; set; }
        public double HumidityPercent { get; set; }
        public double Lux1 { get; set; }
        public double Lux2 { get; set; }
        public double Lux3 { get; set; }
        public double Lux4 { get; set; }
        public bool FloatSwitchState { get; set; }
        public bool WaterDetector1 { get; set; }
        public bool WaterDetector2 { get; set; }
        public bool WaterDetector3 { get; set; }
        public bool WaterDetector4 { get; set; }
        public bool IsPumpRunning { get; set; }
    }
}
