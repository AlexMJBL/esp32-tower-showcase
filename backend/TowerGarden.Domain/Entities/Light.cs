using System;
using TowerGarden.Domain.Exceptions;

namespace TowerGarden.Domain.Entities
{
    /// <summary>
    /// Représente l'état et la configuration d'éclairage LED (spectre RGB et cycle de lumière) de la Tower Garden.
    /// Contient les validations pour les canaux de couleur et le cycle d'heures d'allumage par jour.
    /// </summary>
    public class Light
    {
        public Guid Id { get; private set; }

        // Indique si la lumière est allumée manuellement ou selon le cycle programmé
        public bool IsOn { get; private set; }

        // Intensité du canal Rouge (0 à 255)
        public int Red { get; private set; }

        // Intensité du canal Vert (0 à 255)
        public int Green { get; private set; }

        // Intensité du canal Bleu (0 à 255)
        public int Blue { get; private set; }

        // L'heure de démarrage de l'éclairage dans la journée (0 à 23 heures)
        public int StartHour { get; private set; }

        // La durée d'éclairage souhaitée par jour (1 à 24 heures)
        public int DailyDurationHours { get; private set; }

        public DateTime LastUpdatedAt { get; private set; }

        /// <summary>
        /// Constructeur pour initialiser la configuration de la lumière avec des paramètres par défaut.
        /// </summary>
        public Light(Guid id, bool isOn, int red, int green, int blue, int startHour, int dailyDurationHours)
        {
            Id = id;
            IsOn = isOn;

            ValidateColorChannels(red, green, blue);
            ValidateSchedule(startHour, dailyDurationHours);

            Red = red;
            Green = green;
            Blue = blue;
            StartHour = startHour;
            DailyDurationHours = dailyDurationHours;
            LastUpdatedAt = DateTime.UtcNow;
        }

        /// <summary>
        /// Allume ou éteint manuellement la lumière.
        /// </summary>
        public void SetPowerState(bool isOn)
        {
            if (IsOn == isOn) return;

            IsOn = isOn;
            LastUpdatedAt = DateTime.UtcNow;
        }

        /// <summary>
        /// Modifie la couleur de la lumière (RGB).
        /// </summary>
        public void UpdateColor(int red, int green, int blue)
        {
            ValidateColorChannels(red, green, blue);

            Red = red;
            Green = green;
            Blue = blue;
            LastUpdatedAt = DateTime.UtcNow;
        }

        /// <summary>
        /// Met à jour la planification d'éclairage quotidien.
        /// </summary>
        public void UpdateSchedule(int startHour, int dailyDurationHours)
        {
            ValidateSchedule(startHour, dailyDurationHours);

            StartHour = startHour;
            DailyDurationHours = dailyDurationHours;
            LastUpdatedAt = DateTime.UtcNow;
        }

        /// <summary>
        /// Vérifie que les valeurs de couleurs transmises sont bien dans la plage acceptable d'un octet (0-255).
        /// </summary>
        private static void ValidateColorChannels(int red, int green, int blue)
        {
            if (red < 0 || red > 255)
                throw new InvalidDomainStateException("La valeur du canal Rouge doit être comprise entre 0 et 255.");

            if (green < 0 || green > 255)
                throw new InvalidDomainStateException("La valeur du canal Vert doit être comprise entre 0 et 255.");

            if (blue < 0 || blue > 255)
                throw new InvalidDomainStateException("La valeur du canal Bleu doit être comprise entre 0 et 255.");
        }

        /// <summary>
        /// Vérifie que la planification de l'éclairage correspond à des heures réelles de la journée.
        /// </summary>
        private static void ValidateSchedule(int startHour, int durationHours)
        {
            if (startHour < 0 || startHour > 23)
                throw new InvalidDomainStateException("L'heure de début de l'éclairage doit être comprise entre 0h et 23h.");

            if (durationHours < 1 || durationHours > 24)
                throw new InvalidDomainStateException("La durée d'éclairage quotidienne doit être comprise entre 1h et 24h.");
        }
    }
}
