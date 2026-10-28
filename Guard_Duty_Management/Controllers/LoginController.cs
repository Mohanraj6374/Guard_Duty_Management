using Microsoft.AspNetCore.Mvc;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;

namespace Guard_Duty_Management.Controllers
{

    public class LoginController : Controller
    {
        private readonly HttpClient _httpClient;
        public LoginController(IHttpClientFactory httpClient)
        {
            _httpClient = httpClient.CreateClient();

            _httpClient.DefaultRequestHeaders.Add("Token", "997e3faeb3cb8cf58ae7330616f8e4d02b11361bc892b5de5e14a6d9e7e16390");

        }
        public IActionResult Login()
        {
            return View("Login");
        }

        [HttpGet]
        public async Task<IActionResult> CheckPhoneNumber(string mobileNo)
        {

            if (string.IsNullOrWhiteSpace(mobileNo))
            {
                return BadRequest(new
                {
                    status = false,
                    message = "Country Code and Mobile Number are rquired"
                });
            }
            try
            {
                var apiUrl = $"https://mssiopscore.azurewebsites.net/api/CustomerPortal/VerifyUserDetails?mobileNo=8310561649";

                var response = await _httpClient.GetAsync(apiUrl);
                var result = await response.Content.ReadAsStringAsync();

                return new ContentResult
                {
                    Content = result,
                    ContentType = "application/json",
                    StatusCode = (int)response.StatusCode
                };
            }catch(Exception ex)
            {
                Console.WriteLine(ex.Message);
                return StatusCode(502, new
                {
                    status = false,
                    message = "Unable to contact the verification API"
                });
            }
            
        }

        [HttpPost]
        public async Task<IActionResult> SendOptRequest([FromBody] SendOtpRequest request)
        {
            if(request==null || string.IsNullOrWhiteSpace(request.CountryCode) || string.IsNullOrWhiteSpace(request.PhoneNumber))
            {
                return BadRequest(new {
                    status = false,
                    message = "Country Code, Phone Number, Otp are required"
                });
            }

            try
            {

            }catch(Exception ex)
        }





        public class SendOtpRequest
        {
            public string CountryCode { get; set; } = string.Empty;
            public string PhoneNumber { get; set; } = string.Empty;
        }
        public class VerifyOtpRequest
        {
            public string CountryCode { get; set; } = string.Empty;
            public string PhoneNumber { get; set; } = string.Empty;
            public string Otp { get; set; } = string.Empty;
        }
    }



}
