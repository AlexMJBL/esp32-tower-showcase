using Microsoft.AspNetCore.Mvc;
using System.Dynamic;
using TowerGarden.WebApi.Controllers;
using Xunit;

namespace TowerGarden.Tests.SecurityTests
{
    /// <summary>
    /// Tests unitaires pour s'assurer du respect des règles d'authentification et de sécurité
    /// (protection contre le brute-force, non-divulgation d'infos lors des échecs - OWASP A07:2021).
    /// </summary>
    public class SecurityTests
    {
        private readonly AuthController _authController;

        public SecurityTests()
        {
            _authController = new AuthController();
        }

        [Fact]
        public void Login_WithCorrectCredentials_ShouldReturnOkWithJwtToken()
        {
            // Arrange
            var request = new AuthController.LoginRequest
            {
                Username = "admin",
                Password = "SecureAdminPassword123!"
            };

            // Act
            var result = _authController.Login(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            
            // Réflexion pour extraire la propriété Token du type anonyme retourné par le contrôleur
            var tokenProperty = okResult.Value?.GetType().GetProperty("Token");
            var usernameProperty = okResult.Value?.GetType().GetProperty("Username");

            Assert.NotNull(tokenProperty);
            Assert.NotNull(usernameProperty);

            var token = tokenProperty?.GetValue(okResult.Value) as string;
            var username = usernameProperty?.GetValue(okResult.Value) as string;

            Assert.NotEmpty(token);
            Assert.Equal("admin", username);
        }

        [Theory]
        [InlineData("admin", "WrongPassword!")] // Mauvais mot de passe
        [InlineData("hacker", "SecureAdminPassword123!")] // Mauvais utilisateur
        [InlineData("", "")] // Champs vides
        public void Login_WithInvalidCredentials_ShouldReturnUnauthorizedWithGenericError(string username, string password)
        {
            // Arrange
            var request = new AuthController.LoginRequest
            {
                Username = username,
                Password = password
            };

            // Act
            var result = _authController.Login(request);

            // Assert
            var unauthorizedResult = Assert.IsType<UnauthorizedObjectResult>(result);
            
            // Extraction du message d'erreur
            var errorProperty = unauthorizedResult.Value?.GetType().GetProperty("Error");
            Assert.NotNull(errorProperty);

            var errorMessage = errorProperty?.GetValue(unauthorizedResult.Value) as string;
            
            // OWASP A07:2021 : L'erreur doit être générique pour empêcher la découverte d'utilisateurs
            Assert.Equal("Nom d'utilisateur ou mot de passe incorrect.", errorMessage);
        }
    }
}
