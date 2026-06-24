using System;
using TowerGarden.Domain.Entities;
using TowerGarden.Domain.Exceptions;
using Xunit;

namespace TowerGarden.Tests.DomainTests
{
    /// <summary>
    /// Tests unitaires pour valider les règles métier de l'entité Pump (Pompe).
    /// </summary>
    public class PumpTests
    {
        [Fact]
        public void CreatePump_WithValidParameters_ShouldInitializeCorrectly()
        {
            // Arrange
            var id = Guid.NewGuid();
            var isActive = true;
            var duration = 30; // 30s
            var interval = 10; // 10 minutes (600s)

            // Act
            var pump = new Pump(id, isActive, duration, interval);

            // Assert
            Assert.Equal(id, pump.Id);
            Assert.Equal(isActive, pump.IsActive);
            Assert.Equal(duration, pump.OpenDurationSeconds);
            Assert.Equal(interval, pump.OpenIntervalMinutes);
        }

        [Theory]
        [InlineData(-10, 15)] // Durée négative
        [InlineData(0, 15)]  // Durée nulle
        [InlineData(30, -5)] // Intervalle négatif
        [InlineData(30, 0)]  // Intervalle nul
        public void CreatePump_WithInvalidParams_ShouldThrowInvalidDomainStateException(int duration, int interval)
        {
            // Act & Assert
            var ex = Assert.Throws<InvalidDomainStateException>(() => 
                new Pump(Guid.NewGuid(), true, duration, interval));
            
            Assert.NotEmpty(ex.Message);
        }

        [Fact]
        public void CreatePump_WithIntervalLessThanDuration_ShouldThrowInvalidDomainStateException()
        {
            // Arrange
            // 2 minutes d'intervalle = 120s. Si la durée est 150s, c'est incohérent !
            var duration = 150; 
            var interval = 2; 

            // Act & Assert
            var ex = Assert.Throws<InvalidDomainStateException>(() => 
                new Pump(Guid.NewGuid(), true, duration, interval));

            Assert.Contains("L'intervalle d'arrosage doit être supérieur à la durée d'arrosage", ex.Message);
        }

        [Fact]
        public void UpdateSchedule_WithValidParams_ShouldModifyPropertiesAndLastUpdatedAt()
        {
            // Arrange
            var pump = new Pump(Guid.NewGuid(), false, 60, 15);
            var originalUpdateTime = pump.LastUpdatedAt;

            // Attendre un tout petit peu pour s'assurer que DateTime.UtcNow change (si le CPU est trop rapide)
            System.Threading.Thread.Sleep(10); 

            // Act
            pump.UpdateSchedule(120, 30);

            // Assert
            Assert.Equal(120, pump.OpenDurationSeconds);
            Assert.Equal(30, pump.OpenIntervalMinutes);
            Assert.True(pump.LastUpdatedAt > originalUpdateTime);
        }
    }
}
