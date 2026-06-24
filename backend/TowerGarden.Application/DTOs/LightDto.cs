namespace TowerGarden.Application.DTOs
{
    /// <summary>
    /// Objet de transfert de données représentant l'état, la couleur et le cycle d'éclairage.
    /// </summary>
    public class LightDto
    {
        public bool IsOn { get; set; }
        public int Red { get; set; }
        public int Green { get; set; }
        public int Blue { get; set; }
        public int StartHour { get; set; }
        public int DailyDurationHours { get; set; }
    }
}
