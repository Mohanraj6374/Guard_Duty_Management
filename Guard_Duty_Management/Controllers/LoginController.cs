using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using System.Security.Claims;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;

namespace Guard_Duty_Management.Controllers
{

    public class LoginController : Controller
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<LoginController> _logger;

        
        private const string VerifyUserDetailsUrl = "api/CustomerPortal/VerifyUserDetails";
        private const string SendOtpUrl = "api/CustomerPortal/SendUserOTP";
        private const string VerifyOtpUrl = "api/CustomerPortal/VerifyUserOtp";
        public LoginController(IHttpClientFactory httpClient, ILogger<LoginController> logger)
        {
            _httpClient = httpClient.CreateClient("GuardAPI");

            _httpClient.DefaultRequestHeaders.Add("Token", "997e3faeb3cb8cf58ae7330616f8e4d02b11361bc892b5de5e14a6d9e7e16390");            

            _logger = logger;
        }

        [HttpGet]
        public IActionResult Login()
        {
            if (User.Identity?.IsAuthenticated==true)
            {

                return RedirectToAction(
                    "DashboardView", "Dashboard");
            }
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
                //string baseUrl = _configuration["ApiSettings:BaseUrl"]!;
                //string checkPhoneApiUrl = _configuration["ApiSettings:VerifyUserDetails"]!;

                var apiUrl = $"{VerifyUserDetailsUrl}?mobileNo={Uri.EscapeDataString(mobileNo)}";

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
                    message = "Country Code and Phone Number are required"
                });
            }

            try
            {
                
                //string baseUrl = _configuration["ApiSettings:BaseUrl"]!;
                //string sendOtpUrl = _configuration["ApiSettings:SendOTP"]!;

                //var apiUrl = $"{sendOtpUrl}";

                var response = await _httpClient.PostAsJsonAsync(SendOtpUrl, new
                {
                    phoneNumber = request.PhoneNumber,
                    countryCode = request.CountryCode
                });

                var result = await response.Content.ReadAsStringAsync();

                _logger.LogError("========== SEND OTP DEBUG ==========");
                _logger.LogError("API URL: {Url}",
                    response.RequestMessage?.RequestUri);

                _logger.LogError("Status Code: {StatusCode}",
                    (int)response.StatusCode);

                _logger.LogError("API Response: {Response}",
                    result);

                _logger.LogError("========== END DEBUG ==========");

                return new ContentResult
                {
                    Content = result,
                    ContentType="application/json",
                    StatusCode = (int)response.StatusCode
                };

            }catch(Exception ex)
            {
                _logger.LogError(ex, "SendOTP API exception");
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
            if(request == null || string.IsNullOrWhiteSpace(request.CountryCode) || string.IsNullOrWhiteSpace(request.PhoneNumber) || string.IsNullOrWhiteSpace(request.Otp))
            {
                return BadRequest(new
                {
                    status = false,
                    message = "Country Code, Phone Number, and Otp are required"
                });
            }
            try
            {
                
                //string baseUrl = _configuration["ApiSettings:BaseUrl"]!;
                //string verifyOtpUrl = _configuration["ApiSettings:VerifyOTP"]!;
                //var apiUrl = $"{verifyOtpUrl}";

                var response = await _httpClient.PostAsJsonAsync(VerifyOtpUrl, new
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
                        message = "Otp verification service returned an error."
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


                var getUrl = "https://mssiopscore.azurewebsites.net/api/CustomerPortal/VerifyUserDetails?mobileNo=8310561649";
                //string verifyUrl = _configuration["ApiSettings:VerifyUserDetails"]!;

                //var getUrl = $"{verifyUrl}";
                var userResponse = await _httpClient.GetAsync(getUrl);
                Console.WriteLine("Details fetched");
                

                var userResult = await userResponse.Content.ReadAsStringAsync();

                if (!userResponse.IsSuccessStatusCode)
                {
                    return StatusCode(502, new
                    {
                        success = false,
                        message = "Unable to retrieve user details"
                    });
                }
                using var userDocument = JsonDocument.Parse(userResult);
                var userRoot = userDocument.RootElement;

                var userData = userRoot.GetProperty("data");

                var guardId = userData.GetProperty("id").ToString();
                var email = userData.GetProperty("emailId").GetString();

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
                    new Claim(ClaimTypes.Name, string.IsNullOrWhiteSpace(email)?request.PhoneNumber.Trim():email),                   
                    new Claim(ClaimTypes.MobilePhone, request.PhoneNumber)
                };

                if (!string.IsNullOrWhiteSpace(email))
                {
                    claims.Add(new Claim(ClaimTypes.Email, email));
                }

                var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);

                var principal = new ClaimsPrincipal(identity);

                var authProperties = new AuthenticationProperties
                {
                    IsPersistent=request.RememberMe,
                    AllowRefresh = true
                };
                if (request.RememberMe)
                {
                    authProperties.ExpiresUtc = DateTimeOffset.UtcNow.AddDays(2);
                }
                else
                {
                    authProperties.ExpiresUtc = DateTimeOffset.UtcNow.AddHours(4);
                }
                await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, principal, authProperties);

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
                    message = "An unexpected error occurred during OTP verification."
                });
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [Authorize] 
        public async Task<IActionResult> Logout()
        {
            try
            {
                await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
                return Ok(new
                {
                    success = true,
                    message = "Logged out successfully.",
                    redirectUrl = Url.Action("Login", "Login")
                });
            }catch(Exception ex)
            {
                Console.WriteLine(ex.Message);
                return BadRequest(new
                {
                    success = false,
                    message = "Unexpected error."
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
            public bool RememberMe { get; set; }
        }
    }
}
