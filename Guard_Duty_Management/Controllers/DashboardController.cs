using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Headers;

namespace Guard_Duty_Management.Controllers
{
    public class DashboardController : Controller
    {
        private string GetSiteUrl = "api/Site/GetDesktopUserSites";
        private string GetShiftUrl = "api/Shift/GetSiteShift";
        private string GetGuardPostUrl = "api/Site/GetSiteGuardPosts";
        private string GetOpsPostUrl = "api/OpsPost/OpsPostDropdown";
        private readonly HttpClient _httpClient;
        public DashboardController(IHttpClientFactory httpClientFactory)
        {
            _httpClient = httpClientFactory.CreateClient("GuardAPI");
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "eyJhbGciOiJSUzI1NiIsImtpZCI6ImlOT1ctWko5QWJuNG84ZG5zWXAyVVEiLCJ0eXAiOiJhdCtqd3QifQ.eyJuYmYiOjE3OTQ0ODYwOTEsImV4cCI6MTc5NDQ4OTY5MSwiaXNzIjoiaHR0cHM6Ly9hbnppb3BzaWRlbnRpdHkuYXp1cmV3ZWJzaXRlcy5uZXQiLCJhdWQiOiJpT3BzMkFwaXMiLCJjbGllbnRfaWQiOiJBbnppT3BzUk9DQ1dlYkFwcCIsInN1YiI6IjEwMjc0IiwiYXV0aF90aW1lIjoxNzk0NDYwMzkzLCJpZHAiOiJsb2NhbCIsIkNvbnRhY3RObyI6IjEyNTQ0MzU0NjM2IiwiQnJhbmNoSWQiOiIyODIiLCJSYW5rSWQiOiIiLCJBcHBUeXBlSWQiOiIxIiwiRnVsbE5hbWUiOiJNb2hhbnJhaiIsIkNvbXBhbnlJZCI6IjMiLCJDb21wYW55TmFtZSI6Ik1TUyBTZWN1cml0eSIsIklzQ3VzdG9tZXJBZG1pbiI6Ik5vIiwiSXNDRUNDbGllbnRVc2VyIjoiTiIsImlPcHNST0NDV2ViQXBwIjoiQkgiLCJJc0Rlc2t0b3BHdWFyZFVzZXIiOiJZZXMiLCJMYW5ndWFnZUlkIjoiMSIsIkVtcGxveWVlTm8iOiJLRi1Nb2hhbnJhaiIsIkVtcGxveWVlSWQiOiIxODM3IiwiVXNlclR5cGUiOiJlbXBsb3llZSIsIkNsdXN0ZXJzIjoiMSwyIiwiQnJhbmNoZXMiOiIyODIiLCJSZWdpb24iOiIzMCIsIlpvbmUiOiI1IiwiZW1haWwiOiJtb2hhbnJhai5tQGtub3dsZWRnZWZsZXguY29tIiwiSXNTaXRlVXNlciI6Ik5vIiwibmFtZSI6Ik1vaGFucmFqIiwiVG9rZW5UeXBlIjoiSldUIiwiVG9rZW5JZCI6ImQ2OTI2NWQzNmQ3MTRkN2RiNjU3NzhkMDg3MjQzZWY5Iiwic2NvcGUiOlsicHJvZmlsZSIsIm9wZW5pZCIsImlPcHMyQXBpcyIsIm9mZmxpbmVfYWNjZXNzIl0sImFtciI6WyJwd2QiXX0.Smn0GTFQU8_cDM_uWc8A6YE8rwQKsgvEaJPxEcujgg8Bpz0upEHa8L6wAwMtF1JCMHE0PTZpSRvar46gra0W6IuEmhVMyYDq09DC0LfTe7HIoE7odV-1l-ru5LfMIr2vRN4jIcPPCDIADeC2rX7ePI2PekMajyNjRutbyiY1Sr9SjM_B5J4HvcQELBPmvmqvtdLJSbe-PIS3hsvTlEAg9vWaFMqRggXSwlIOW-XGfMlRel7d_W9Sk6j0zFbvXEdWT_RMhb14RWjKUYC0HH53Pbnlzy7p0d6AWuHp6Lk9bB1_6BlPTHPP3ugWyMuF7YbwS4sicCML-uSCav5FdQsR-A");
        }


        [Authorize]
        public IActionResult DashboardView()
        {
            return View("DashboardView");
        }

        [HttpGet]
        public async Task<IActionResult> GetSites()
        {
            return await GetApiResponse(GetSiteUrl);
        }
        [HttpGet]
        public async Task<IActionResult> GetShifts(int siteId)
        {
            return await GetApiResponse($"{GetShiftUrl}?siteId={siteId}");
        }
        [HttpGet]
        public async Task<IActionResult> GetGuardPosts(int siteId)
        {
            return await GetApiResponse($"{GetGuardPostUrl}?siteId={siteId}");
        }
        [HttpGet]
        public async Task<IActionResult> GetOpsPosts(int siteId, int guardPostId)
        {
            return await GetApiResponse($"{GetOpsPostUrl}?siteId={siteId}&guardPostId={guardPostId}");
        }


        private async Task<IActionResult> GetApiResponse(string endpoint)
        {
            try
            {                
                var response = await _httpClient.GetAsync(endpoint);
                var responseContent = await response.Content.ReadAsStringAsync();
                return new ContentResult
                {
                    Content = responseContent,
                    ContentType = "application/json",
                    StatusCode = (int)response.StatusCode
                };

            }
            catch (HttpRequestException ex)
            {
                Console.WriteLine("Unable to communicate with Server: ", ex.Message);
                return StatusCode(502, new
                {
                    status = false,
                    message = "Unable to communicate with server!"
                });
            }

        }

    }
}
