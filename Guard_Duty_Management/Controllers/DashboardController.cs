using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Guard_Duty_Management.Controllers
{
    public class DashboardController : Controller
    {

        [Authorize]
        public IActionResult DashboardView()
        {
            return View("DashboardView");
        }
    }
}
