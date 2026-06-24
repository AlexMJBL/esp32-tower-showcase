using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace TowerGarden.WebApi.Hubs
{
    /// <summary>
    /// Hub SignalR permettant aux clients Web (frontend React) de s'abonner aux
    /// notifications en temps réel du serveur via WebSocket.
    /// </summary>
    public class SensorHub : Hub
    {
        // Les clients se connectent simplement à ce hub.
        // Les push de données s'effectuent via IHubContext de manière asynchrone.
    }
}
