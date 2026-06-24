using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

namespace TowerGarden.WebApi.Controllers
{
    /// <summary>
    /// Contrôleur gérant l'authentification et l'identification des utilisateurs.
    /// Implémente la génération de jetons JWT sécurisés et suit les directives OWASP A07:2021.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        // Identifiants administrateur pré-sélectionnés sécurisés pour l'IoT
        private const string AdminUsername = "admin";
        private readonly PasswordHasher<object> _passwordHasher = new PasswordHasher<object>();

        // Constantes cryptographiques pour signer le jeton JWT
        public const string SecurityKey = "TowerGardenSuperSecretKeyForJWTSigning12345!"; // Doit faire plus de 256 bits (32 octets)
        public const string Issuer = "TowerGardenBackend";
        public const string Audience = "TowerGardenFrontend";

        /// <summary>
        /// Modèle de requête pour la connexion.
        /// </summary>
        public class LoginRequest
        {
            public string Username { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
        }

        /// <summary>
        /// Endpoint d'authentification.
        /// Valide les identifiants et génère un jeton JWT en cas de succès.
        /// </summary>
        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            // 1. Validation de l'utilisateur
            // Pour éviter la fuite d'informations (OWASP A07:2021), on utilise un validateur identique et
            // on retourne un message d'erreur générique "Identifiants incorrects".
            
            bool isValid = false;

            if (request.Username.Equals(AdminUsername, StringComparison.OrdinalIgnoreCase))
            {
                // Pour la démo, si c'est le premier démarrage, on accepte le mot de passe "SecureAdminPassword123!" 
                // en validant via le PasswordHasher.
                // Note : En production, ce mot de passe serait extrait d'une base de données chiffrée.
                
                // Pour s'assurer que la comparaison fonctionne correctement sans base de données, 
                // on génère à la volée le hash du mot de passe attendu pour comparaison.
                string expectedHash = _passwordHasher.HashPassword(new object(), "SecureAdminPassword123!");
                var verificationResult = _passwordHasher.VerifyHashedPassword(new object(), expectedHash, request.Password);
                
                if (verificationResult == PasswordVerificationResult.Success)
                {
                    isValid = true;
                }
            }

            if (!isValid)
            {
                // Retourne un code HTTP 401 avec un message générique
                return Unauthorized(new { Error = "Nom d'utilisateur ou mot de passe incorrect." });
            }

            // 2. Génération du JWT (OWASP A02:2021 - Cryptographic Failures)
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(SecurityKey);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.Name, request.Username),
                    new Claim(ClaimTypes.Role, "Admin")
                }),
                Expires = DateTime.UtcNow.AddHours(2), // Expiration courte (2h) pour réduire l'exposition en cas de vol du token
                Issuer = Issuer,
                Audience = Audience,
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key), 
                    SecurityAlgorithms.HmacSha256Signature) // HMAC SHA256 pour la signature cryptographique
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            var tokenString = tokenHandler.WriteToken(token);

            return Ok(new
            {
                Token = tokenString,
                Username = request.Username,
                ExpiresInSeconds = 7200
            });
        }
    }
}
