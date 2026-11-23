
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System;
using System.Net.Http;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading.Tasks;
using System.Linq;
using System.Collections.Generic;


namespace Guard_Duty_Management.Controllers
{
    public class IncidentController : Controller
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;
        private readonly string? _azureMapsKey;

        public IncidentController(
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration)
        {
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
            _azureMapsKey = _configuration["AzureMaps:SubscriptionKey"];
        }

        // Opens the incident view
        public IActionResult IncidentView()
        {
            ViewBag.AzureMapsKey = _azureMapsKey;
            return View("IncidentView");
        }

        // Opens the incident table
        public IActionResult IncidentTableView()
        {
            return View("IncidentTableView");
        }

        // Gets incident records from the external API
        [HttpGet]
        public async Task<IActionResult> GetIncidentList(
            int userId = 30,
            string stDate = "2026-10-22",
            string endDate = "2026-10-22")
        {
            try
            {
                // Read the token from configuration / User Secrets
                var token = "c0262e33492a4d389a8e20549eeebcd0";

                if (string.IsNullOrWhiteSpace(token))
                {
                    return Problem(
                        title: "Incident API token is not configured.",
                        statusCode: 500);
                }

                Console.WriteLine($"Start Date: {stDate}");
                Console.WriteLine($"End Date: {endDate}");
                Console.WriteLine($"User ID: {userId}");

                // Build the external API URL
                var apiUrl =
                    "https://mssiopscore.azurewebsites.net/api/CustomerPortal/GetSxpIncidentListV1" +
                    $"?userId={userId}" +
                    $"&stDate={Uri.EscapeDataString(stDate)}" +
                    $"&endDate={Uri.EscapeDataString(endDate)}";

                var client = _httpClientFactory.CreateClient();

                // Add the required authentication header
                using var request = new HttpRequestMessage(
                    HttpMethod.Get,
                    apiUrl);

                // Confirm that "Token" is the correct header name
                // required by the external API.
                request.Headers.TryAddWithoutValidation("Token", token);

                using var response = await client.SendAsync(request);

                var json = await response.Content.ReadAsStringAsync();

                // Return the external API's status and JSON response
                return new ContentResult
                {
                    StatusCode = (int)response.StatusCode,
                    Content = json,
                    ContentType = "application/json"
                };
            }
            catch (HttpRequestException)
            {
                return Problem(
                    title: "Could not connect to the external incident API.",
                    statusCode: 502);
            }
            catch (TaskCanceledException)
            {
                return Problem(
                    title: "The external incident API request timed out.",
                    statusCode: 504);
            }
        }
        public IActionResult IncidentDashboardView()
        {
            return View("IncidentDashboardView");
        }

        public IActionResult IncidentManagementView()
        {
            return View("IncidentManagementView");
        }
        private async Task<string?> ConvertImageToBase64(
    HttpClient client,
    string imageUrl)
        {
            try
            {
                if (!Uri.TryCreate(
                    imageUrl,
                    UriKind.Absolute,
                    out var imageUri))
                {
                    return null;
                }

                if (imageUri.Scheme != Uri.UriSchemeHttps ||
                    imageUri.Host != "mssiopsstore.blob.core.windows.net")
                {
                    return null;
                }

                using var response = await client.GetAsync(
                    imageUri,
                    HttpCompletionOption.ResponseHeadersRead
                );

                if (!response.IsSuccessStatusCode)
                    return null;

                var contentType =
                    response.Content.Headers.ContentType?.MediaType;

                if (contentType == null ||
                    !contentType.StartsWith(
                        "image/",
                        StringComparison.OrdinalIgnoreCase))
                {
                    return null;
                }

                // Limit each image to 10 MB
                if (response.Content.Headers.ContentLength > 10 * 1024 * 1024)
                    return null;

                var imageBytes =
                    await response.Content.ReadAsByteArrayAsync();

                if (imageBytes.Length > 10 * 1024 * 1024)
                    return null;

                var base64 = Convert.ToBase64String(imageBytes);

                return $"data:{contentType};base64,{base64}";
            }
            catch (HttpRequestException)
            {
                return null;
            }
        }

        public async Task<IActionResult> GetIncidents(int IncidentId)
        {
            try
            {
                var client = _httpClientFactory.CreateClient();

                // 1. Call the Incident Details API
                var incidentApiUrl =
                    "https://mssiopscore.azurewebsites.net/api/CustomerPortal/GetSxpIncidentdetails"
                    + $"?incidentId={IncidentId}";

                using var incidentResponse =
                    await client.GetAsync(incidentApiUrl);

                var incidentJson =
                    await incidentResponse.Content.ReadAsStringAsync();

                if (!incidentResponse.IsSuccessStatusCode)
                {
                    return new ContentResult
                    {
                        StatusCode = (int)incidentResponse.StatusCode,
                        Content = incidentJson,
                        ContentType = "application/json"
                    };
                }

                // Parse the incident response JSON
                var incidentRoot = JsonNode.Parse(incidentJson);

                if (incidentRoot?["data"] is not JsonObject incidentData)
                {
                    return new ContentResult
                    {
                        StatusCode = 502,
                        Content = """{"message":"Incident data was not found in the API response."}""",
                        ContentType = "application/json"
                    };
                }

                // 2. Get the SAS Token API URL from configuration
                var sasApiUrl = "https://mssiopscore.azurewebsites.net/api/CustomerPortal/GetSASToken_R";

                if (string.IsNullOrWhiteSpace(sasApiUrl))
                {
                    return Problem(
                        title: "The SAS Token API URL is not configured.",
                        statusCode: 500);
                }

                // 3. Call the SAS Token API
                //using var sasResponse = await client.GetAsync(sasApiUrl);
                //var sasJson = await sasResponse.Content.ReadAsStringAsync();
                //var token = _configuration["IncidentApi:Token"];
                var token = "c0262e33492a4d389a8e20549eeebcd0";

                using var sasRequest = new HttpRequestMessage(
                    HttpMethod.Get,
                    sasApiUrl);

                sasRequest.Headers.TryAddWithoutValidation("Token", token);

                using var sasResponse = await client.SendAsync(sasRequest);

                var sasJson = await sasResponse.Content.ReadAsStringAsync();

                if (!sasResponse.IsSuccessStatusCode)
                {
                    return Problem(
                        title: "Could not retrieve the SAS token.",
                        statusCode: 502);
                }

                var sasRoot = JsonNode.Parse(sasJson);

                var sasTokenUrl = sasRoot?["data"]?["sasToken"]?.GetValue<string>();

                if (string.IsNullOrWhiteSpace(sasTokenUrl) ||
                    !Uri.TryCreate(sasTokenUrl, UriKind.Absolute, out var sasUri))
                {
                    return Problem(
                        title: "The SAS Token API returned an invalid token URL.",
                        statusCode: 502);
                }

                // 4. Extract the SAS query parameters
                var sasQuery = sasUri.Query.TrimStart('?');

                if (string.IsNullOrWhiteSpace(sasQuery))
                {
                    return Problem(
                        title: "The SAS URL does not contain query parameters.",
                        statusCode: 502);
                }

                /// 5. Process Open Images
                var imageUri = incidentData["imageUri"]?.GetValue<string>();

                var securedImages = new List<string>();

                if (!string.IsNullOrWhiteSpace(imageUri))
                {
                    securedImages = imageUri
                        .Split(',', StringSplitOptions.RemoveEmptyEntries)
                        .Select(url => url.Trim())
                        .Where(url =>
                            Uri.TryCreate(url, UriKind.Absolute, out var uri) &&
                            uri.Scheme == Uri.UriSchemeHttps &&
                            uri.Host == "mssiopsstore.blob.core.windows.net")
                        .Select(url =>
                        {
                            var uri = new Uri(url);

                            var builder = new UriBuilder(uri)
                            {
                                Query = sasQuery,
                                Fragment = string.Empty
                            };

                            return builder.Uri.ToString();
                        })
                        .ToList();
                }
                var closedImageUri = incidentData["closeImgUri"]?.GetValue<string>();
                var securedClosedImages = new List<string>();
                if (!string.IsNullOrWhiteSpace(closedImageUri))
                {
                    securedClosedImages = closedImageUri
                        .Split(',', StringSplitOptions.RemoveEmptyEntries)
                        .Select(url => url.Trim())
                        .Where(url =>
                            Uri.TryCreate(url, UriKind.Absolute, out var uri) &&
                            uri.Scheme == Uri.UriSchemeHttps &&
                            uri.Host == "mssiopsstore.blob.core.windows.net")
                        .Select(url =>
                        {
                            var uri = new Uri(url);

                            var builder = new UriBuilder(uri)
                            {
                                Query = sasQuery,
                                Fragment = string.Empty
                            };

                            return builder.Uri.ToString();
                        })
                        .ToList();
                } 
                incidentData["openImageUrls"] = BuildImageArray(securedImages);
                incidentData["closedImageUrls"] = BuildImageArray(securedClosedImages);
                await AttachFormImagesAsync( incidentData, sasQuery);
                // Generate static map image for PDF
                var coordinates = incidentData["repotedLocation"]?.GetValue<string>();
                if (!string.IsNullOrWhiteSpace(coordinates))
                {
                    var parts = coordinates.Split(',');
                    if (parts.Length == 2 &&
                        double.TryParse(parts[0].Trim(),
                            System.Globalization.NumberStyles.Float,
                            System.Globalization.CultureInfo.InvariantCulture, out var longitude) &&
                        double.TryParse(parts[1].Trim(),
                            System.Globalization.NumberStyles.Float,
                            System.Globalization.CultureInfo.InvariantCulture, out var latitude))
                    {
                        var mapUrl =
                                "https://atlas.microsoft.com/map/static" +
                                "?api-version=2024-04-01" +
                                "&tilesetId=microsoft.base.road" +
                                "&zoom=15" +
                                $"&center={longitude.ToString(System.Globalization.CultureInfo.InvariantCulture)},{latitude.ToString(System.Globalization.CultureInfo.InvariantCulture)}" +
                                "&width=800&height=450" +
                                "&pins=" + Uri.EscapeDataString($"default||{longitude} {latitude}") +
                                "&view=IN" +
                                "&subscription-key=" + Uri.EscapeDataString(_azureMapsKey ?? "");
                        using var mapResponse = await client.GetAsync(mapUrl);
                        if (mapResponse.IsSuccessStatusCode)
                        {
                            var mapBytes = await mapResponse.Content.ReadAsByteArrayAsync();
                            incidentData["mapImageBase64"] =
                                "data:image/png;base64," + Convert.ToBase64String(mapBytes);
                        }
                    }
                }
               // 6. Return the modified incident JSON to Vue
                return new ContentResult
                {
                    StatusCode = (int)incidentResponse.StatusCode,
                    Content = incidentRoot.ToJsonString(),
                    ContentType = "application/json"
                };
            }
            catch (HttpRequestException)
            {
                return Problem(
                    title: "Could not connect to an external API.",
                    statusCode: 502);
            }
            catch (TaskCanceledException)
            {
                return Problem(
                    title: "An external API request timed out.",
                    statusCode: 504);
            }
            catch (JsonException)
            {
                return Problem(
                    title: "An external API returned invalid JSON.",
                    statusCode: 502);
            }
            catch (UriFormatException)
            {
                return Problem(
                    title: "An external API returned an invalid URL.",
                    statusCode: 502);
            }
        }
          private Task AttachFormImagesAsync(JsonObject incidentData, string sasQuery)
        {
            var formJson = incidentData["respoense"]?.GetValue<string>();
            if (string.IsNullOrWhiteSpace(formJson)) return Task.CompletedTask;

            JsonNode? root;
            try { root = JsonNode.Parse(formJson); }
            catch (JsonException) { return Task.CompletedTask; }
            if (root is not JsonArray sections) return Task.CompletedTask;

            var pictureControls = sections
                .OfType<JsonObject>()
                .SelectMany(s => s["Controls"] is JsonArray c
                    ? c.OfType<JsonObject>()
                    : Enumerable.Empty<JsonObject>())
                .Where(c => string.Equals(
                    c["contentType"]?.GetValue<string>(),
                    "PICTURE",
                    StringComparison.OrdinalIgnoreCase));

            foreach (var control in pictureControls)
            {
                var urls = control["Response"]?.GetValue<string>();
                var secured = string.IsNullOrWhiteSpace(urls)
                    ? new List<string>()
                    : urls
                        .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                        .Where(u => Uri.TryCreate(u, UriKind.Absolute, out var uri) &&
                                    uri.Scheme == Uri.UriSchemeHttps &&
                                    uri.Host == "mssiopsstore.blob.core.windows.net")
                        .Select(u => new UriBuilder(u)
                        {
                            Query = sasQuery,
                            Fragment = string.Empty
                        }.Uri.ToString())
                        .ToList();

                control["ResponseImageUrls"] = BuildImageArray(secured);
            }

            incidentData["respoense"] = root.ToJsonString();
            return Task.CompletedTask;
        }
          private static JsonArray BuildImageArray(IEnumerable<string> urls)
        {
            var arr = new JsonArray();
            foreach (var u in urls)
                arr.Add(new JsonObject { ["url"] = u });
            return arr;
        }
        [HttpGet]
        public IActionResult GetAzureMapsKey()
        {
            var key = _configuration["AzureMaps:SubscriptionKey"];

            return Json(new { key });
        }
        [HttpPost]
        public async Task<IActionResult> GetImagesBase64([FromBody] List<string> urls)
        {
            if (urls == null || urls.Count == 0) return Json(new List<string?>());
            if (urls.Count > 50) return BadRequest("Too many images.");

            var client = _httpClientFactory.CreateClient();
            var results = await Task.WhenAll(urls.Select(u => ConvertImageToBase64(client, u)));
            return Json(results);   // same order as the input
        }
    }
    }


