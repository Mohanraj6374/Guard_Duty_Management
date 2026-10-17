using Microsoft.AspNetCore.Mvc;

namespace Guard_Duty_Management.Controllers
{
    public class LoginController : Controller
    {
        public IActionResult Login()
        {
            return View("Login");
        }
    }
}
