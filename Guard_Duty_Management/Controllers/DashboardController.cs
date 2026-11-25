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
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "eyJhbGciOiJSUzI1NiIsImtpZCI6ImlOT1ctWko5QWJuNG84ZG5zWXAyVVEiLCJ0eXAiOiJhdCtqd3QifQ.eyJuYmYiOjE3OTU1ODUyMjAsImV4cCI6MTc5NTU4ODgyMCwiaXNzIjoiaHR0cHM6Ly9hbnppb3BzaWRlbnRpdHkuYXp1cmV3ZWJzaXRlcy5uZXQiLCJhdWQiOiJpT3BzMkFwaXMiLCJjbGllbnRfaWQiOiJBbnppT3BzUk9DQ1dlYkFwcCIsInN1YiI6IjEwMjc0IiwiYXV0aF90aW1lIjoxNzk1NTg1MjAwLCJpZHAiOiJsb2NhbCIsIkNvbnRhY3RObyI6IjEyNTQ0MzU0NjM2IiwiQnJhbmNoSWQiOiIyODIiLCJSYW5rSWQiOiIiLCJBcHBUeXBlSWQiOiIxIiwiRnVsbE5hbWUiOiJNb2hhbnJhaiIsIkNvbXBhbnlJZCI6IjMiLCJDb21wYW55TmFtZSI6Ik1TUyBTZWN1cml0eSIsIklzQ3VzdG9tZXJBZG1pbiI6Ik5vIiwiSXNDRUNDbGllbnRVc2VyIjoiTiIsImlPcHNST0NDV2ViQXBwIjoiQkgiLCJJc0Rlc2t0b3BHdWFyZFVzZXIiOiJZZXMiLCJMYW5ndWFnZUlkIjoiMSIsIkVtcGxveWVlTm8iOiJLRi1Nb2hhbnJhaiIsIkVtcGxveWVlSWQiOiIxODM3IiwiVXNlclR5cGUiOiJlbXBsb3llZSIsIkNsdXN0ZXJzIjoiMSwyIiwiQnJhbmNoZXMiOiIyODIiLCJSZWdpb24iOiIzMCIsIlpvbmUiOiI1IiwiZW1haWwiOiJtb2hhbnJhai5tQGtub3dsZWRnZWZsZXguY29tIiwiSXNTaXRlVXNlciI6Ik5vIiwibmFtZSI6Ik1vaGFucmFqIiwiVG9rZW5UeXBlIjoiSldUIiwiVG9rZW5JZCI6ImQ4NTU1MWUzMDY1YzQwZWE4ZGNhOTFmZTNhOTBkZDA2Iiwic2NvcGUiOlsicHJvZmlsZSIsIm9wZW5pZCIsImlPcHMyQXBpcyIsIm9mZmxpbmVfYWNjZXNzIl0sImFtciI6WyJwd2QiXX0.eOCtrh8bXmJfaZ3EstPvhcMwazHWEEYA1XoJusod_nQ1Yu9ZiYGH5hcnMJCjHsC1OhFLlWtnGLkWhrSGs7YLI9KP2ebgyuDh9hMPHk1geOfBm7ZLtda1F8dSGbS80qDajZjHzSq7YBTQk2T4khslK6CkmhRxIp0nkAjYpvc4s44Ah7RU8TbJfkAMfl_jftZGLuR65kAZlFTpa_hQjSoaKq_o4vK5U3Pw3TD-Zly5q35Y4Q2x7teOQHva2yDANuqfdJcEkCgmqBmaTYPHNbK1acaqJktoAmijhqpzr5e2Xj1--K0ludcNQPj9AoA9D4xBegOOB8Zdbxr5SlXV6ca8lw");
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

            try
            {
                if (taskData == null)
                {
                    return BadRequest(new
                    {
                        status = false,
                        message="Invalid Task Data"
                    });
                }
                var response = await _httpClient.PostAsJsonAsync(AddTaskUrl, taskData);
                var result = await response.Content.ReadAsStringAsync();

                return new ContentResult
                {
                    Content = result,
                    ContentType = "application/json",
                    StatusCode = (int)response.StatusCode
                };
            }catch(HttpRequestException ex)
            {
                Console.WriteLine("Server communication failed", ex.Message);
                return StatusCode(502, new
                {
                    status = false,
                    message = "Server Communcation failed"
                });
            }
        }

        public class TaskData{
            public long Id { get; set; }
            public long ServerId { get; set; }
            public int SiteId { get; set; }
            public Guid LocalId { get; set; } = Guid.NewGuid();
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
