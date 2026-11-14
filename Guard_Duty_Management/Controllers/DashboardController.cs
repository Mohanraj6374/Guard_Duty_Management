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
        private string GetTaskListUrl = "api/SiteTask/GetDesktopUserTask";
        private string GetTaskDetailsUrl = "api/SiteTask/GetDynamicTask";
        private string GetLocationUrl = "api/DutyPost/GetSitePost";
        private string AddTaskUrl = "api/SiteTask/AddSiteTask";
        private readonly HttpClient _httpClient;
        public DashboardController(IHttpClientFactory httpClientFactory)
        {
            _httpClient = httpClientFactory.CreateClient("GuardAPI");
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "eyJhbGciOiJSUzI1NiIsImtpZCI6ImlOT1ctWko5QWJuNG84ZG5zWXAyVVEiLCJ0eXAiOiJhdCtqd3QifQ.eyJuYmYiOjE3OTQ1NzA3NDgsImV4cCI6MTc5NDU3NDM0OCwiaXNzIjoiaHR0cHM6Ly9hbnppb3BzaWRlbnRpdHkuYXp1cmV3ZWJzaXRlcy5uZXQiLCJhdWQiOiJpT3BzMkFwaXMiLCJjbGllbnRfaWQiOiJBbnppT3BzUk9DQ1dlYkFwcCIsInN1YiI6IjEwMjc0IiwiYXV0aF90aW1lIjoxNzk0NTUzNDc3LCJpZHAiOiJsb2NhbCIsIkNvbnRhY3RObyI6IjEyNTQ0MzU0NjM2IiwiQnJhbmNoSWQiOiIyODIiLCJSYW5rSWQiOiIiLCJBcHBUeXBlSWQiOiIxIiwiRnVsbE5hbWUiOiJNb2hhbnJhaiIsIkNvbXBhbnlJZCI6IjMiLCJDb21wYW55TmFtZSI6Ik1TUyBTZWN1cml0eSIsIklzQ3VzdG9tZXJBZG1pbiI6Ik5vIiwiSXNDRUNDbGllbnRVc2VyIjoiTiIsImlPcHNST0NDV2ViQXBwIjoiQkgiLCJJc0Rlc2t0b3BHdWFyZFVzZXIiOiJZZXMiLCJMYW5ndWFnZUlkIjoiMSIsIkVtcGxveWVlTm8iOiJLRi1Nb2hhbnJhaiIsIkVtcGxveWVlSWQiOiIxODM3IiwiVXNlclR5cGUiOiJlbXBsb3llZSIsIkNsdXN0ZXJzIjoiMSwyIiwiQnJhbmNoZXMiOiIyODIiLCJSZWdpb24iOiIzMCIsIlpvbmUiOiI1IiwiZW1haWwiOiJtb2hhbnJhai5tQGtub3dsZWRnZWZsZXguY29tIiwiSXNTaXRlVXNlciI6Ik5vIiwibmFtZSI6Ik1vaGFucmFqIiwiVG9rZW5UeXBlIjoiSldUIiwiVG9rZW5JZCI6IjZlZjA4MWQzN2U3MDRmZTlhYWNjYjMzZGU0N2E2Yzc1Iiwic2NvcGUiOlsicHJvZmlsZSIsIm9wZW5pZCIsImlPcHMyQXBpcyIsIm9mZmxpbmVfYWNjZXNzIl0sImFtciI6WyJwd2QiXX0.bMiAESRUbkClXVJ3gLFakPg0WrGgsrOjTzalmkAhOt9frkle-iLIHjrbkP0wSsjrRFXvDEFrp4yStJleBJo7pKcTo2T-ilr4J-tEYnK8w0Re9TxzRBPtmQRTw1xonpS8JuFktBN0AD1XpfA9zQR9NNnsLhZN99aW1dYAtDNC4F2nyO7KVowkIdV9C7JknsOOH0QgRgPISZLbrhNExPDWFNfa4Jllbl081l4iHgSwDTfx0aG2MfGl2mMTuSph9cx_CvHmsfost2dtl4SkmZTjRzvZ4ug2fUlS4ABg2sIWlHjROWJSjFH-JefUFKJzVgw0nY8LRKroMtyIoIDspHqLng");
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
        [HttpGet]
        public async Task<IActionResult> GetTaskList(string date)
        {
            return await GetApiResponse($"{GetTaskListUrl}?date={date}");
        }
        [HttpGet]
        public async Task<IActionResult> GetTaskDetails(int taskId)
        {
            return await GetApiResponse($"{GetTaskDetailsUrl}?id={taskId}");
        }
        [HttpGet]
        public async Task<IActionResult> GetTaskLocation(int siteId)
        {
            return await GetApiResponse($"{GetLocationUrl}?siteId={siteId}");
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

        public async Task<IActionResult> AddTask([FromBody] TaskData taskData)
        {


            return new ContentResult
            {
                Content = "Task added successfully",
                ContentType = "application/json",
                StatusCode = 200
            };
        }




        public class TaskData{
            public long SelectedTaskId { get; set; }
            public long ServerId { get; set; }
            public int SiteId { get; set; }
            public Guid localId { get; set; } = Guid.NewGuid();
            public int TaskTypeId { get; set; }
            public int TaskStatus { get; set; }
            public DateTime EstimatedTaskExecutionStartDateTime { get; set; }
            public DateTime EstimatedTaskExecutionEndDateTime { get; set; }
            public DateTime ActualTaskExecutionStartDateTime { get; set; }
            public DateTime ActualTaskExecutionEndDateTime { get; set; }
            public int ReasonId { get; set; }
            public string? TaskLocation { get; set; }
            public string? TaskExecutionResult { get; set; }
        }
    }
}
