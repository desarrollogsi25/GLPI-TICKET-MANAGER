using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;

namespace GlpiTicketManager.Application.Dtos.Tickets;

/// <summary>
/// JSON DateTimeOffset normally accepts local datetimes without an offset. A
/// schedule must declare its offset explicitly so DST is not guessed by the API.
/// </summary>
public sealed class ExplicitOffsetDateTimeConverter : JsonConverter<DateTimeOffset>
{
    private static readonly Regex ExplicitZone = new(
        @"(?:Z|[+-](?:0\d|1[0-4]):[0-5]\d)$",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    public override DateTimeOffset Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.TokenType == JsonTokenType.String ? reader.GetString() : null;
        if (value is null || !ExplicitZone.IsMatch(value) ||
            !DateTimeOffset.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
        {
            throw new JsonException("La fecha debe ser ISO 8601 e incluir zona horaria (Z o +/-HH:MM).");
        }
        return date;
    }

    public override void Write(Utf8JsonWriter writer, DateTimeOffset value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.ToString("O", CultureInfo.InvariantCulture));
}
