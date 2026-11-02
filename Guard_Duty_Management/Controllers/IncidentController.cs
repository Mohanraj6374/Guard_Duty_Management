
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System;
using System.Net.Http;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading.Tasks;


namespace Guard_Duty_Management.Controllers
{
    public class IncidentController : Controller
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;

        public IncidentController(
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration)
        {
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
        }

        // Opens the incident view
        public IActionResult IncidentView()
        {
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

        /*public async Task<IActionResult> GetIncidents(int IncidentId)
        {
            try
            {
                var apiUrl = "https://mssiopscore.azurewebsites.net/api/CustomerPortal/GetSxpIncidentdetails" + $"?incidentId={IncidentId}";
                var client = _httpClientFactory.CreateClient();
                using var response = await client.GetAsync(apiUrl);
                var json = await response.Content.ReadAsStringAsync();
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

        }*/
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

                // 5. Secure the comma-separated image URLs
                var imageUri = incidentData["imageUri"]?.GetValue<string>();

                if (!string.IsNullOrWhiteSpace(imageUri))
                {
                    var securedImages = imageUri
                        .Split(',', StringSplitOptions.RemoveEmptyEntries)
                        .Select(url => url.Trim())
                        .Where(url => Uri.TryCreate(
                            url, UriKind.Absolute, out _))
                        .Select(url =>
                        {
                            // Remove an existing query string before
                            // appending the current SAS parameters.
                            var uri = new Uri(url);
                            var builder = new UriBuilder(uri)
                            {
                                Query = sasQuery,
                                Fragment = string.Empty
                            };

                            return builder.Uri.ToString();
                        })
                        .ToArray();

                    // Return the secured image URLs as a comma-separated string
                    incidentData["imageUri"] =
                        string.Join(",", securedImages);
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
    }


}


