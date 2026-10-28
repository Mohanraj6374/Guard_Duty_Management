using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using System.Security.Claims;
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
        public async Task<IActionResult> SendOtp([FromBody] SendOtpRequest request)
        {
            if(request==null || string.IsNullOrWhiteSpace(request.CountryCode) || string.IsNullOrWhiteSpace(request.PhoneNumber))
            {
                return BadRequest(new {
                    status = false,
                    message = "Country Code, Phone Number are required"
                });
            }

            try
            {
                var apiUrl = $"https://mssiopscore.azurewebsites.net/api/CustomerPortal/SendUserOTP";

                var respnose = await _httpClient.PostAsJsonAsync(apiUrl, new
                {
                    phoneNumber = request.PhoneNumber,
                    countryCode = request.CountryCode
                });

                var result = await respnose.Content.ReadAsStringAsync();

                return new ContentResult
                {
                    Content = result,
                    ContentType="application/json",
                    StatusCode = (int)respnose.StatusCode
                };

            }catch(Exception ex)
            {
                Console.WriteLine(ex.Message);
                return StatusCode(502, new
                {
                    status = false,
                    message = "Unable to send otp, SendOtp API exception"
                });
            }
        }


        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest request)
        {
            if(request == null || String.IsNullOrWhiteSpace(request.CountryCode) || String.IsNullOrWhiteSpace(request.PhoneNumber) || String.IsNullOrWhiteSpace(request.Otp))
            {
                return BadRequest(new
                {
                    status = false,
                    message = "Country Code, Phone Number, Otp are required"
                });
            }
            try
            {
                var apiUrl = $"https://mssiopscore.azurewebsites.net/api/CustomerPortal/VerifyUserOtp";

                var response = await _httpClient.PostAsJsonAsync(apiUrl, new
                {
                    countryCode = request.CountryCode,
                    phoneNumber = request.PhoneNumber,
                    otp = request.Otp
                });


                if (!response.IsSuccessStatusCode)
                {
                    return StatusCode((int)response.StatusCode, new
                    {
                        status = false,
                        message = "Otp verification failed."
                    });
                }

                var result = await response.Content.ReadAsStringAsync();

                using var document = JsonDocument.Parse(result);
                var root = document.RootElement;
                var statusCode = root.GetProperty("statusCode").GetInt32();
                var statusMessage = root.GetProperty("statusMessage").GetString();

                if(statusCode != 200 || statusMessage != "Success")
                {
                    return BadRequest(new
                    {
                        status = false,
                        message = "Invalid or Expired OTP"
                    });
                }


                var getUrl = $"https://mssiopscore.azurewebsites.net/api/CustomerPortal/VerifyUserDetails?mobileNo=8310561649";
                var userData = await _httpClient.GetAsync(getUrl);

                userData.EnsureSuccessStatusCode();

                var userResult = await userData.Content.ReadAsStringAsync();
                using var userDocument = JsonDocument.Parse(userResult);
                var userRoot = userDocument.RootElement;

                var guardId = userRoot.GetProperty("id").GetString();
                var email = userRoot.GetProperty("email").GetString();

                if (string.IsNullOrWhiteSpace(guardId) || string.IsNullOrWhiteSpace(email))
                {
                    return BadRequest(new
                    {
                        status = false,
                        message = "User ID or email is missing."
                    });
                }

                var claims = new List<Claim>
                {
                    new Claim(ClaimTypes.NameIdentifier, guardId),
                    new Claim(ClaimTypes.Email, email),
                    new Claim(ClaimTypes.MobilePhone, request.PhoneNumber)
                };

                var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);

                var principal = new ClaimsPrincipal(identity);

                await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, principal);

                return Ok(new
                {
                    success = true,
                    message = "OTP verified successfully.",
                    redirectUrl = Url.Action("DashboardView","Dashboard")
                });
                
                    
            }catch(Exception ex)
            {
                Console.WriteLine(ex.Message);
                return StatusCode(502, new
                {
                    status = false,
                    message = "Unable to send otp, api exception found"
                });
            }
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
