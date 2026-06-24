using System;
using TowerGarden.Domain.Entities;
using TowerGarden.Domain.Exceptions;
using Xunit;

namespace TowerGarden.Tests.DomainTests
{
    /// <summary>
    /// Tests unitaires pour valider les règles métier de l'entité Light (Éclairage).
    /// </summary>
    public class LightTests
    {
        [Fact]
        public void CreateLight_WithValidParameters_ShouldInitializeCorrectly()
        {
            // Arrange
            var id = Guid.NewGuid();
            var isOn = false;
            var r = 255;
            var g = 120;
            var b = 0;
            var startHour = 8;
            var duration = 16;

            // Act
            var light = new Light(id, isOn, r, g, b, startHour, duration);

            // Assert
            Assert.Equal(id, light.Id);
            Assert.Equal(isOn, light.IsOn);
            Assert.Equal(r, light.Red);
            Assert.Equal(g, light.Green);
            Assert.Equal(b, light.Blue);
            Assert.Equal(startHour, light.StartHour);
            Assert.Equal(duration, light.DailyDurationHours);
        }

        [Theory]
        [InlineData(-1, 0, 0)]    // Rouge sous la limite
        [InlineData(256, 0, 0)]   // Rouge au-dessus
        [InlineData(0, -5, 0)]    // Vert sous la limite
        [InlineData(0, 300, 0)]   // Vert au-dessus
        [InlineData(0, 0, -1)]    // Bleu sous la limite
        [InlineData(0, 0, 256)]   // Bleu au-dessus
        public void CreateLight_WithInvalidRGB_ShouldThrowInvalidDomainStateException(int r, int g, int b)
        {
            // Act & Assert
            Assert.Throws<InvalidDomainStateException>(() =>
                new Light(Guid.NewGuid(), true, r, g, b, 8, 16));
        }

        [Theory]
        [InlineData(-1, 16)]  // Heure négative
        [InlineData(24, 16)]  // Heure invalide
        [InlineData(8, 0)]    // Durée nulle
        [InlineData(8, 25)]   // Durée supérieure à 24h
        public void CreateLight_WithInvalidSchedule_ShouldThrowInvalidDomainStateException(int startHour, int duration)
        {
            // Act & Assert
            Assert.Throws<InvalidDomainStateException>(() =>
                new Light(Guid.NewGuid(), true, 255, 255, 255, startHour, duration));
        }

        [Fact]
        public void UpdateColor_WithValidParams_ShouldChangeRGBValues()
        {
            // Arrange
            var light = new Light(Guid.NewGuid(), true, 100, 100, 100, 8, 16);

            // Act
            light.UpdateColor(200, 150, 50);

            // Assert
            Assert.Equal(200, light.Red);
            Assert.Equal(150, light.Green);
            Assert.Equal(50, light.Blue);
        }
    }
}
