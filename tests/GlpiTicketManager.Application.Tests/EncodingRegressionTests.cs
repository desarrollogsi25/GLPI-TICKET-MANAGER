using System.Text.RegularExpressions;
using Xunit;

namespace GlpiTicketManager.Application.Tests;

public sealed class EncodingRegressionTests
{
    private static readonly Regex MojibakePattern = new(@"Ã[¡±©³º­éíóú]|\uFFFD", RegexOptions.Compiled);

    [Fact]
    public void Source_files_must_not_contain_corrupted_mojibake_characters()
    {
        var root = FindRepoRoot();
        var violations = new List<string>();

        var targetDirs = new[]
        {
            Path.Combine(root, "src"),
            Path.Combine(root, "frontend", "src")
        };

        foreach (var dir in targetDirs)
        {
            if (!Directory.Exists(dir)) continue;

            foreach (var file in Directory.EnumerateFiles(dir, "*.*", SearchOption.AllDirectories))
            {
                var ext = Path.GetExtension(file);
                if (ext is not (".cs" or ".ts" or ".tsx")) continue;

                var text = File.ReadAllText(file);
                if (MojibakePattern.IsMatch(text))
                {
                    violations.Add(Path.GetRelativePath(root, file));
                }
            }
        }

        Assert.Empty(violations);
    }

    private static string FindRepoRoot()
    {
        var current = AppDomain.CurrentDomain.BaseDirectory;
        while (!string.IsNullOrEmpty(current))
        {
            if (File.Exists(Path.Combine(current, "GLPI-TICKET-MANAGER.sln")) ||
                Directory.Exists(Path.Combine(current, ".git")))
            {
                return current;
            }

            var parent = Directory.GetParent(current);
            if (parent is null) break;
            current = parent.FullName;
        }

        return Directory.GetCurrentDirectory();
    }
}
