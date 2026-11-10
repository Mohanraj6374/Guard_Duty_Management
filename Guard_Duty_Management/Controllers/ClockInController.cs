using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Linq;
namespace Guard_Duty_Management.Controllers
{
    public class ClockInController:Controller
    {
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<ClockInController> _logger;
        public ClockInController(IWebHostEnvironment environment, ILogger<ClockInController> logger)   
        {
            _environment = environment;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetClockInStatus(string guardId)
        {
            var filePath = Path.Combine(_environment.WebRootPath, "data", "clock-in-data.json");
            if (!System.IO.File.Exists(filePath))
            {
                return NotFound(new
                {
                    message = "Clock-in data dile not found."
                });
            }
            var json = await System.IO.File.ReadAllTextAsync(filePath);
            using var document = JsonDocument.Parse(json);
            var records = document.RootElement.GetProperty("records");
            var activeRecord = records.EnumerateArray()
                .FirstOrDefault(record =>
                    record.GetProperty("guardId").GetString() == guardId &&
                    record.GetProperty("isClockedIn").GetBoolean()
                );
            if (activeRecord.ValueKind == JsonValueKind.Undefined)
            {
                return Ok(new
                {
                    isClockedIn = false,
                    record = (object?)null
                });
            }
            return Ok(new
            {
                isClockedIn = true,
                record = activeRecord.Clone()
            });
        }
        [HttpPost]
        public async Task<IActionResult> ClockIn([FromBody] JsonElement request)
        {
            var filePath = Path.Combine(
                _environment.WebRootPath,
                "data",
                "clock-in-data.json"
            );

            var json = await System.IO.File.ReadAllTextAsync(filePath);

            var document = JsonNode.Parse(json);

            var records = document?["records"]?.AsArray();

            if (records == null)
            {
                return BadRequest(new { message = "Invalid clock-in data." });
            }

            string guardId = request.GetProperty("guardId").GetString()!;

            // Check whether the guard is already clocked in
            bool alreadyClockedIn = records.Any(record =>
                record?["guardId"]?.GetValue<string>() == guardId &&
                record?["isClockedIn"]?.GetValue<bool>() == true
            );

            if (alreadyClockedIn)
            {
                return Conflict(new
                {
                    message = "Guard is already clocked in."
                });
            }

            var newRecord = new JsonObject
            {
                ["guardId"] = guardId,
                ["siteId"] = JsonNode.Parse(request.GetProperty("siteId").GetRawText()),
                ["shiftId"] = JsonNode.Parse(request.GetProperty("shiftId").GetRawText()),
                ["guardPostId"] = JsonNode.Parse(request.GetProperty("guardPostId").GetRawText()),
                ["isClockedIn"] = true,
                ["clockInTime"] = DateTimeOffset.UtcNow.ToString("O"),
                ["clockOutTime"] = null
            };

            records.Add(newRecord);

            await System.IO.File.WriteAllTextAsync(
                filePath,
                document!.ToJsonString(new JsonSerializerOptions
                {
                    WriteIndented = true
                })
            );

            return Ok(new
            {
                success = true,
                message = "Clocked in successfully.",
                record = newRecord
            });
        }

        [HttpPost]
        public async Task<IActionResult> ClockOut([FromBody] JsonElement request)
        {
            var filePath = Path.Combine(
                _environment.WebRootPath,
                "data",
                "clock-in-data.json"
            );

            var json = await System.IO.File.ReadAllTextAsync(filePath);
            var document = JsonNode.Parse(json);

            var records = document?["records"]?.AsArray();

            if (records == null)
            {
                return BadRequest(new { message = "Invalid clock-in data." });
            }

            string guardId = request.GetProperty("guardId").GetString()!;

            var activeRecord = records.FirstOrDefault(record =>
                record?["guardId"]?.GetValue<string>() == guardId &&
                record?["isClockedIn"]?.GetValue<bool>() == true
            );

            if (activeRecord == null)
            {
                return NotFound(new
                {
                    message = "No active clock-in record found."
                });
            }

            activeRecord["isClockedIn"] = false;
            activeRecord["clockOutTime"] = DateTimeOffset.UtcNow.ToString("O");

            await System.IO.File.WriteAllTextAsync(
                filePath,
                document!.ToJsonString(new JsonSerializerOptions
                {
                    WriteIndented = true
                })
            );

            return Ok(new
            {
                success = true,
                message = "Clocked out successfully.",
                record = activeRecord
            });
        }

        [HttpGet]
        public async Task<IActionResult> GetShiftActivityLog(string guardId)
        {
            var filePath = Path.Combine(_environment.WebRootPath, "data", "clock-in-data.json");

            var json = await System.IO.File.ReadAllTextAsync(filePath);

            var document = JsonDocument.Parse(json);
            var records = document.RootElement.GetProperty("records");

            _logger.LogInformation("Guard ID received: " + guardId);

            foreach (var record in records.EnumerateArray())
            {
                _logger.LogInformation(
                    "Guard ID in JSON: " +
                    record.GetProperty("guardId").GetString()
                );
            }
            var activityLogs = records.EnumerateArray()
                .Where(record => record.GetProperty("guardId").GetString() == guardId)
                .Select(record => record.Clone())
                .ToList();

            document.Dispose();
            return Ok(activityLogs);
        }
    }
}
