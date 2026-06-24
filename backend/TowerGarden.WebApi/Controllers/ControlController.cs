using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using TowerGarden.Application.DTOs;
using TowerGarden.Application.UseCases;
using TowerGarden.Domain.Exceptions;

namespace TowerGarden.WebApi.Controllers
{
    /// <summary>
    /// Contrôleur gérant les commandes envoyées à la Tower Garden (pompe et lumières).
    /// </summary>
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ControlController : ControllerBase
    {
        private readonly UpdatePumpCommand _updatePumpCommand;
        private readonly UpdateLightCommand _updateLightCommand;

        public ControlController(UpdatePumpCommand updatePumpCommand, UpdateLightCommand updateLightCommand)
        {
            _updatePumpCommand = updatePumpCommand;
            _updateLightCommand = updateLightCommand;
        }

        /// <summary>
        /// Met à jour la configuration ou l'état actif de la pompe.
        /// </summary>
        [HttpPost("pump")]
        public async Task<IActionResult> UpdatePump([FromBody] PumpDto dto)
        {
            try
            {
                await _updatePumpCommand.ExecuteAsync(dto);
                return Ok(new { Message = "Commande de la pompe mise à jour et envoyée avec succès." });
            }
            catch (InvalidDomainStateException ex)
            {
                // Retourne une erreur de validation 400 personnalisée pour le domaine
                return BadRequest(new { Error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Une erreur interne est survenue.", Details = ex.Message });
            }
        }

        /// <summary>
        /// Met à jour la configuration (RGB, planification) ou l'état actif des lumières.
        /// </summary>
        [HttpPost("light")]
        public async Task<IActionResult> UpdateLight([FromBody] LightDto dto)
        {
            try
            {
                await _updateLightCommand.ExecuteAsync(dto);
                return Ok(new { Message = "Commande d'éclairage mise à jour et envoyée avec succès." });
            }
            catch (InvalidDomainStateException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Une erreur interne est survenue.", Details = ex.Message });
            }
        }
    }
}
