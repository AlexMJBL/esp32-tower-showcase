using System;
using TowerGarden.Domain.Exceptions;

namespace TowerGarden.Domain.Entities
{
    /// <summary>
    /// Représente l'état et la configuration de la pompe d'irrigation de la Tower Garden.
    /// Cette classe contient les règles métier pour s'assurer que la pompe ne fonctionne pas
    /// dans un état incohérent (par exemple, un intervalle d'arrosage plus court que la durée d'arrosage).
    /// </summary>
    public class Pump
    {
        // Identifiant unique pour la pompe (utile si on gère plusieurs pompes, ou pour le stockage)
        public Guid Id { get; private set; }

        // Indique si la pompe est actuellement en marche (true) ou arrêtée (false)
        public bool IsActive { get; private set; }

        // Durée pendant laquelle la pompe reste allumée lors d'un cycle (en secondes)
        public int OpenDurationSeconds { get; private set; }

        // Intervalle de temps entre deux cycles d'arrosage (en minutes)
        public int OpenIntervalMinutes { get; private set; }

        // Date et heure de la dernière mise à jour de la configuration
        public DateTime LastUpdatedAt { get; private set; }

        /// <summary>
        /// Constructeur pour initialiser une pompe avec des valeurs par défaut sécurisées.
        /// </summary>
        public Pump(Guid id, bool isActive, int openDurationSeconds, int openIntervalMinutes)
        {
            Id = id;
            IsActive = isActive;
            
            // On valide les paramètres avant de les assigner
            ValidatePumpParameters(openDurationSeconds, openIntervalMinutes);
            
            OpenDurationSeconds = openDurationSeconds;
            OpenIntervalMinutes = openIntervalMinutes;
            LastUpdatedAt = DateTime.UtcNow;
        }

        /// <summary>
        /// Permet d'allumer ou d'éteindre manuellement la pompe.
        /// </summary>
        /// <param name="isActive">Le nouvel état souhaité de la pompe.</param>
        public void SetActiveState(bool isActive)
        {
            // On évite de déclencher des événements ou de mettre à jour la date si l'état ne change pas
            if (IsActive == isActive) return;

            IsActive = isActive;
            LastUpdatedAt = DateTime.UtcNow;
        }

        /// <summary>
        /// Met à jour la planification de la pompe (durée et intervalle).
        /// </summary>
        /// <param name="openDurationSeconds">Durée d'ouverture en secondes.</param>
        /// <param name="openIntervalMinutes">Intervalle en minutes.</param>
        public void UpdateSchedule(int openDurationSeconds, int openIntervalMinutes)
        {
            // On valide d'abord pour éviter de polluer notre entité avec des données corrompues
            ValidatePumpParameters(openDurationSeconds, openIntervalMinutes);

            OpenDurationSeconds = openDurationSeconds;
            OpenIntervalMinutes = openIntervalMinutes;
            LastUpdatedAt = DateTime.UtcNow;
        }

        /// <summary>
        /// Valide la cohérence des paramètres de la pompe.
        /// C'est une règle métier critique pour éviter de brûler la pompe ou d'inonder les plantes.
        /// </summary>
        private static void ValidatePumpParameters(int durationSeconds, int intervalMinutes)
        {
            if (durationSeconds <= 0)
            {
                throw new InvalidDomainStateException("La durée d'arrosage de la pompe doit être supérieure à 0 seconde.");
            }

            if (intervalMinutes <= 0)
            {
                throw new InvalidDomainStateException("L'intervalle entre les arrosages doit être supérieur à 0 minute.");
            }

            // Un intervalle de temps converti en secondes doit logiquement être plus grand que la durée d'ouverture
            int intervalSeconds = intervalMinutes * 60;
            if (intervalSeconds <= durationSeconds)
            {
                throw new InvalidDomainStateException("L'intervalle d'arrosage doit être supérieur à la durée d'arrosage.");
            }
        }
    }
}
