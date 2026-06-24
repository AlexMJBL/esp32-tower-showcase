using System;

namespace TowerGarden.Domain.Exceptions
{
    /// <summary>
    /// Exception personnalisée levée lorsque les règles métier du domaine de la Tower Garden ne sont pas respectées.
    /// Cela permet de séparer proprement les erreurs de validation logique des autres exceptions techniques.
    /// </summary>
    public class InvalidDomainStateException : Exception
    {
        public InvalidDomainStateException() : base() { }

        public InvalidDomainStateException(string message) : base(message) { }

        public InvalidDomainStateException(string message, Exception innerException) : base(message, innerException) { }
    }
}
