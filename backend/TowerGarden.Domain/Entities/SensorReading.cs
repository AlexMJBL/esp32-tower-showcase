using System;

namespace TowerGarden.Domain.Entities
{
    /// <summary>
    /// Représente un relevé de l'ensemble des capteurs installés sur la Tower Garden à un instant précis.
    /// Il s'agit d'un objet de valeur (Value Object) ou d'une entité en lecture seule qui stocke l'état physique du jardin.
    /// </summary>
    public class SensorReading
    {
        public Guid Id { get; private set; }

        // Date et heure de la prise de mesure
        public DateTime Timestamp { get; private set; }

        // Température ambiante ou de l'eau (Capteur 1) en degrés Celsius
        public double Temperature1 { get; private set; }

        // Température ambiante ou de la zone racinaire (Capteur 2) en degrés Celsius
        public double Temperature2 { get; private set; }

        // Taux d'humidité relative dans l'air (en %)
        public double HumidityPercent { get; private set; }

        // Luminosité capteur 1 (en Lux) - Zone supérieure
        public double Lux1 { get; private set; }

        // Luminosité capteur 2 (en Lux) - Zone supérieure-milieu
        public double Lux2 { get; private set; }

        // Luminosité capteur 3 (en Lux) - Zone milieu-basse
        public double Lux3 { get; private set; }

        // Luminosité capteur 4 (en Lux) - Zone basse
        public double Lux4 { get; private set; }

        // Interrupteur à flotteur (True = niveau d'eau OK dans le réservoir principal, False = niveau critique bas)
        public bool FloatSwitchState { get; private set; }

        // Détecteurs de présence d'eau ou de fuite.
        // Par exemple: détecteur de trop-plein, détecteur de débordement au sol, etc.
        // True = eau détectée, False = zone sèche.
        public bool WaterDetector1 { get; private set; }
        public bool WaterDetector2 { get; private set; }
        public bool WaterDetector3 { get; private set; }
        public bool WaterDetector4 { get; private set; }
        public bool IsPumpRunning { get; private set; }

        /// <summary>
        /// Constructeur pour initialiser une capture de capteurs.
        /// </summary>
        public SensorReading(
            Guid id,
            DateTime timestamp,
            double temperature1,
            double temperature2,
            double humidityPercent,
            double lux1,
            double lux2,
            double lux3,
            double lux4,
            bool floatSwitchState,
            bool waterDetector1,
            bool waterDetector2,
            bool waterDetector3,
            bool waterDetector4,
            bool isPumpRunning)
        {
            Id = id;
            Timestamp = timestamp;
            Temperature1 = temperature1;
            Temperature2 = temperature2;
            HumidityPercent = humidityPercent;
            Lux1 = lux1;
            Lux2 = lux2;
            Lux3 = lux3;
            Lux4 = lux4;
            FloatSwitchState = floatSwitchState;
            WaterDetector1 = waterDetector1;
            WaterDetector2 = waterDetector2;
            WaterDetector3 = waterDetector3;
            WaterDetector4 = waterDetector4;
            IsPumpRunning = isPumpRunning;
        }
    }
}
