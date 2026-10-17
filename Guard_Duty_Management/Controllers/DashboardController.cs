using Microsoft.AspNetCore.Mvc;

namespace Guard_Duty_Management.Controllers
{
    public class DashboardController : Controller
    {
        public IActionResult DashboardView()
        {
            return View("DashboardView");
        }
    }
}
