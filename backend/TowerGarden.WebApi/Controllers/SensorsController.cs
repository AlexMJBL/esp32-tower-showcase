using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using TowerGarden.Application.DTOs;
using TowerGarden.Application.Interfaces;
using TowerGarden.Application.UseCases;

namespace TowerGarden.WebApi.Controllers
{
    /// <summary>
    /// Contrôleur permettant de consulter l'état des capteurs et l'historique de la Tower Garden.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class SensorsController : ControllerBase
    {
        private readonly GetDeviceStateQuery _getDeviceStateQuery;
        private readonly IDeviceStateStore _stateStore;

        public SensorsController(GetDeviceStateQuery getDeviceStateQuery, IDeviceStateStore stateStore)
        {
            _getDeviceStateQuery = getDeviceStateQuery;
            _stateStore = stateStore;
        }

        /// <summary>
        /// Retourne l'état complet actuel (pompe, éclairage, dernier relevé capteur).
        /// Requis au chargement initial du frontend pour la synchronisation.
        /// </summary>
        [HttpGet("state")]
        public async Task<ActionResult<DeviceStateDto>> GetCurrentState()
        {
            try
            {
                var state = await _getDeviceStateQuery.ExecuteAsync();
                return Ok(state);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Erreur lors de la récupération de l'état.", Details = ex.Message });
            }
        }

        /// <summary>
        /// Récupère l'historique récent des relevés de capteurs (ex: pour tracer un graphique).
        /// </summary>
        /// <param name="limit">Le nombre maximum de relevés à retourner (par défaut 30).</param>
        [HttpGet("history")]
        public async Task<IActionResult> GetHistory([FromQuery] int limit = 30)
        {
            try
            {
                // Validation du paramètre limit pour éviter les abus de mémoire
                if (limit <= 0 || limit > 100)
                {
                    limit = 30;
                }

                var history = await _stateStore.GetSensorHistoryAsync(limit);
                
                // Mappage de la liste d'entités de domaine vers des DTOs
                var historyDtos = history.Select(h => new SensorReadingDto
                {
                    Timestamp = h.Timestamp,
                    Temperature1 = h.Temperature1,
                    Temperature2 = h.Temperature2,
                    HumidityPercent = h.HumidityPercent,
                    Lux1 = h.Lux1,
                    Lux2 = h.Lux2,
                    Lux3 = h.Lux3,
                    Lux4 = h.Lux4,
                    FloatSwitchState = h.FloatSwitchState,
                    WaterDetector1 = h.WaterDetector1,
                    WaterDetector2 = h.WaterDetector2,
                    WaterDetector3 = h.WaterDetector3,
                    WaterDetector4 = h.WaterDetector4
                }).ToList();

                return Ok(historyDtos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Erreur lors de la récupération de l'historique.", Details = ex.Message });
            }
        }
    }
}
