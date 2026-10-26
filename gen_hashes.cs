using System;
using BCrypt.Net;

class Program {
    static void Main() {
        string[] passwords = { "AdminPass!", "TechGsiPass!", "TechHardPass!", "SuperGsiPass!", "SoliPass!" };
        foreach (var pwd in passwords) {
            var hash = BCrypt.Net.BCrypt.HashPassword(pwd, 12);
            Console.WriteLine($"{pwd} -> {hash}");
        }
    }
}