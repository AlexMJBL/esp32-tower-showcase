namespace TowerGarden.Application.DTOs
{
    /// <summary>
    /// Objet de transfert de données représentant l'état et la configuration de la pompe.
    /// Utilisé pour communiquer entre l'API web et le frontend.
    /// </summary>
    public class PumpDto
    {
        public bool IsActive { get; set; }
        public int OpenDurationSeconds { get; set; }
        public int OpenIntervalMinutes { get; set; }
    }
}
