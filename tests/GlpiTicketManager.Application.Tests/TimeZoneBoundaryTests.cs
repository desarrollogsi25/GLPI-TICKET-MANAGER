using System;
using FluentAssertions;
using GlpiTicketManager.Application.Services;
using Xunit;

namespace GlpiTicketManager.Application.Tests;

/// <summary>
/// QA-10: Cross-timezone and midnight date filtering tests.
/// Verifies that date bounds for Europe/Madrid, Europe/Paris and America/Lima
/// (and daylight saving time transitions) compute precise UTC bounds without
/// erroneously assuming the host server's local timezone.
/// </summary>
public class TimeZoneBoundaryTests
{
    [Fact]
    public void Madrid_WinterMidnight_ConvertsToPreviousDay2300Utc()
    {
        // 2026-11-09 00:00:00 local Madrid (CET = UTC+1) -> 2026-11-08 23:00:00 UTC
        var localDate = new DateTime(2026, 11, 9, 0, 0, 0, DateTimeKind.Unspecified);
        var startUtc = TicketService.ToUtcBound(localDate, endOfDay: false, "Europe/Madrid");
        var endUtc = TicketService.ToUtcBound(localDate, endOfDay: true, "Europe/Madrid");

        startUtc.Should().NotBeNull();
        endUtc.Should().NotBeNull();

        startUtc!.Value.Kind.Should().Be(DateTimeKind.Utc);
        startUtc.Value.Should().Be(new DateTime(2026, 11, 8, 23, 0, 0, DateTimeKind.Utc));

        // End of day: 2026-11-09 23:59:59.999 local Madrid -> 2026-11-09 22:59:59.999 UTC
        endUtc!.Value.Kind.Should().Be(DateTimeKind.Utc);
        endUtc.Value.Date.Should().Be(new DateTime(2026, 11, 9));
        endUtc.Value.Hour.Should().Be(22);
        endUtc.Value.Minute.Should().Be(59);
        endUtc.Value.Second.Should().Be(59);
    }

    [Fact]
    public void Madrid_SummerMidnight_ConvertsToPreviousDay2200Utc()
    {
        // 2026-07-15 00:00:00 local Madrid (CEST = UTC+2) -> 2026-07-14 22:00:00 UTC
        var localDate = new DateTime(2026, 7, 15, 0, 0, 0, DateTimeKind.Unspecified);
        var startUtc = TicketService.ToUtcBound(localDate, endOfDay: false, "Europe/Madrid");
        var endUtc = TicketService.ToUtcBound(localDate, endOfDay: true, "Europe/Madrid");

        startUtc!.Value.Should().Be(new DateTime(2026, 7, 14, 22, 0, 0, DateTimeKind.Utc));
        endUtc!.Value.Hour.Should().Be(21);
        endUtc.Value.Minute.Should().Be(59);
    }

    [Fact]
    public void Paris_WinterMidnight_MatchesMadridOffset()
    {
        // Paris operates on identical CET offset as Madrid
        var localDate = new DateTime(2026, 1, 15, 0, 0, 0, DateTimeKind.Unspecified);
        var startUtc = TicketService.ToUtcBound(localDate, endOfDay: false, "Europe/Paris");

        startUtc!.Value.Should().Be(new DateTime(2026, 1, 14, 23, 0, 0, DateTimeKind.Utc));
    }

    [Fact]
    public void Lima_Midnight_ConvertsTo0500UtcSameDay()
    {
        // America/Lima operates on constant UTC-5 (no daylight saving time)
        // 2026-11-09 00:00:00 local Lima -> 2026-11-09 05:00:00 UTC
        var localDate = new DateTime(2026, 11, 9, 0, 0, 0, DateTimeKind.Unspecified);
        var startUtc = TicketService.ToUtcBound(localDate, endOfDay: false, "America/Lima");
        var endUtc = TicketService.ToUtcBound(localDate, endOfDay: true, "America/Lima");

        startUtc.Should().NotBeNull();
        endUtc.Should().NotBeNull();

        startUtc!.Value.Should().Be(new DateTime(2026, 11, 9, 5, 0, 0, DateTimeKind.Utc));

        // End of day: 2026-11-09 23:59:59.999 local Lima -> 2026-11-10 04:59:59.999 UTC (next day in UTC!)
        endUtc!.Value.Date.Should().Be(new DateTime(2026, 11, 10));
        endUtc.Value.Hour.Should().Be(4);
        endUtc.Value.Minute.Should().Be(59);
        endUtc.Value.Second.Should().Be(59);
    }
}
