using Microsoft.AspNetCore.Mvc;

namespace Guard_Duty_Management.Controllers
{
    public class IncidentController : Controller
    {
        public IActionResult IncidentView()
        {
            return View("IncidentView");
        }
    }
}
