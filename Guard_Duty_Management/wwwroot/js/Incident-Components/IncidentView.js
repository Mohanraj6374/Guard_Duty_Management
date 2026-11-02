
var incidentDetailsApp = new Vue({

    el: "#IncidentDetailsApp",

    // ==========================================
    // 1. DATA
    // ==========================================

    data: function () {
        return {

            loading: false,
            errorMessage: "",

            incidentId: new URLSearchParams(
                window.location.search
            ).get("IncidentId"),

            incident: {

                // Report heading
                reportTitle: "Security (ST) Report",
                reportReference: "--",
                reportDate: "--",

                // Basic incident details
                id: "--",
                status: "--",

                // Customer details
                client: "--",
                region: "--",
                branch: "--",
                raisedBy: "--",

                employeeNo: "--",
                dateTime: "--",

                // Location details
                openGpsLocation: "--",
                siteName: "--",
                locationName: "--",

                // Incident classification
                type: "--",
                category: "--",
                subcategory: "--",

                conductedOn: "--",

                // Assignment details
                assignedTo: "--",
                role: "--",
                guardPost: "--",
                assignedManagers: "--",
                opsPost: "--",
                emails: "--",

                // Attendance
                attendees: [
                    { name: "Police", checked: false },
                    { name: "Ambulance", checked: false },
                    { name: "Fire Brigade", checked: false },
                    { name: "Not Applicable", checked: false }
                ],

                // Closing details
                closedGpsLocation: "--",
                closedDateTime: "--",
                closedBy: "--",

                // Remarks and narratives
                otherLocationRemarks: "--",
                openNarrative: "--",
                closedNarrative: "--",

                // Images
                openImages: [],
                closedImages: [],

                // Incident summary
                summary: {
                    who: "--",
                    what: "--",
                    when: "--",
                    where: "--",
                    why: "--"
                }
            }
        };
    },


    // ==========================================
    // 2. COMPUTED PROPERTIES
    // ==========================================

    computed: {

        // Generate OpenStreetMap URL
        mapUrl: function () {

            var coordinates = this.incident.openGpsLocation;

            if (!coordinates || coordinates === "--") {
                return "";
            }

            var parts = coordinates.split(",");

            if (parts.length !== 2) {
                return "";
            }

            // API coordinates are longitude,latitude
            var longitude = parseFloat(parts[0]);
            var latitude = parseFloat(parts[1]);

            if (
                !Number.isFinite(latitude) ||
                !Number.isFinite(longitude)
            ) {
                return "";
            }

            var bbox = [
                longitude - 0.015,
                latitude - 0.01,
                longitude + 0.015,
                latitude + 0.01
            ].join(",");

            return "https://www.openstreetmap.org/export/embed.html" +
                "?bbox=" + encodeURIComponent(bbox) +
                "&layer=mapnik" +
                "&marker=" + latitude + "," + longitude;
        },


        // Check whether incident data is available
        hasIncidentData: function () {

            return this.incident.id !== "--";
        }

    },


    // ==========================================
    // 3. LIFECYCLE HOOKS
    // ==========================================

    mounted: function () {

        console.log("Incident Details Vue instance mounted");

        console.log("Incident ID:", this.incidentId);

        this.getIncident();
    },


    // ==========================================
    // 4. METHODS
    // ==========================================

    methods: {

        // --------------------------------------
        // Get Incident Details API
        // --------------------------------------

        getIncident: function () {

            console.log("getIncident() called");

            if (!this.incidentId) {

                this.errorMessage = "Incident ID is missing.";

                return;
            }

            this.loading = true;
            this.errorMessage = "";

            axios.get("/Incident/GetIncidents", {

                params: {
                    IncidentId: this.incidentId
                }

            })

            .then((response) => {

                console.log("Complete API Response:", response.data);

                // Extract actual incident object
                var result =
                    response.data &&
                    response.data.data != null
                        ? response.data.data
                        : response.data;

                if (
                    !result ||
                    typeof result !== "object" ||
                    Array.isArray(result)
                ) {
                    throw new Error("No incident data returned.");
                }

                console.log("Incident Object:", result);

                // Call mapping method
                this.mapIncidentData(result);

                console.log(
                    "Mapped Incident:",
                    this.incident
                );

            })

            .catch((error) => {

                console.error(
                    "Failed to load incident details:",
                    error
                );

                if (error.response) {

                    this.errorMessage =
                        "Failed to load incident. HTTP Status: " +
                        error.response.status;

                } else {

                    this.errorMessage =
                        error.message ||
                        "Unable to load incident details.";
                }

            })

            .finally(() => {

                this.loading = false;

            });
        },


        // --------------------------------------
        // Map API Response to Vue Data
        // --------------------------------------

        mapIncidentData: function (result) {

            // Basic incident details

            this.incident.id =
                result.id != null
                    ? "#" + result.id
                    : "--";

            this.incident.status =
                result.incidentStatus || "--";


            // Customer details

            this.incident.client =
                result.customerName || "--";

            this.incident.region =
                result.regionName || "--";

            this.incident.branch =
                result.branchName || "--";

            this.incident.raisedBy =
                result.raisedByName || "--";

            this.incident.employeeNo =
                result.raisedBy != null
                    ? String(result.raisedBy)
                    : "--";


            // Date details

            this.incident.dateTime =
                this.formatDate(result.date);

            this.incident.conductedOn =
                this.incident.dateTime;


            // Site and location details

            this.incident.siteName =
                result.siteName || "--";

            this.incident.locationName =
                result.dutyPostName || "--";

            this.incident.openGpsLocation =
                result.repotedLocation || "--";

            this.incident.closedGpsLocation =
                result.closedLocation || "--";


            // Incident classification

            this.incident.type =
                result.incidentType || "--";

            this.incident.category =
                result.category || "--";

            this.incident.subcategory =
                result.subCategory || "--";


            // Assignment details

            this.incident.assignedTo =
                result.assignedToNameNo ||
                result.assignedToName ||
                "--";

            this.incident.role =
                result.role || "--";

            this.incident.guardPost =
                result.guardPostName || "--";

            this.incident.assignedManagers =
                result.assignedMangersName || "--";

            this.incident.opsPost =
                result.opsPostName || "--";

            this.incident.emails =
                result.toEmailIds || "--";


            // Closing details

            this.incident.closedDateTime =
                this.formatDate(result.closedDateTime);

            this.incident.closedBy =
                result.closedByName || "--";


            // Remarks

            this.incident.otherLocationRemarks =
                result.dutyPostRemarks || "--";


            // Narratives

            this.incident.openNarrative =
                result.description || "--";

            this.incident.closedNarrative =
                result.resolutionComments || "--";


            // Images
            console.log("Open Image URL:", result.imageUri);
console.log("Closed Image URL:", result.closeImgUri);
            this.incident.openImages =
                this.splitImageUrls(result.imageUri);


            this.incident.closedImages =
                this.splitImageUrls(result.closeImgUri);

console.log("Open Image URL:", result.imageUri);
console.log("Closed Image URL:", result.closeImgUri);
            // Attendance

            var attendeeName =
                result.attendName || "Not Applicable";

            this.incident.attendees.forEach(function (attendee) {

                attendee.checked =
                    attendee.name === attendeeName;

            });


            // Report heading

            this.incident.reportTitle =
                "Security (ST) Report";

            this.incident.reportReference =
                "Incident_" + result.id +
                "_" + (result.siteName || "");

            this.incident.reportDate =
                this.formatDate(result.date);


            // Incident summary

            this.incident.summary.who =
                result.raisedByName || "--";

            this.incident.summary.what =
                result.description || "--";

            this.incident.summary.when =
                this.incident.dateTime;

            this.incident.summary.where =
                result.siteName || "--";

            this.incident.summary.why =
                result.dutyPostRemarks || "--";

        },


        // --------------------------------------
        // Format Date
        // --------------------------------------

        formatDate: function (dateValue) {

            if (
                !dateValue ||
                dateValue.startsWith("0001-01-01")
            ) {
                return "--";
            }

            var date = new Date(dateValue);

            if (isNaN(date.getTime())) {
                return "--";
            }

            return date.toLocaleString();
        },

        formatNarrative: function (value) {
           if (!value || value === "--") { return "--"; }

         return value
        .replace(/<\/?p[^>]*>/gi, "\n")
        .trim();

        },

        // --------------------------------------
        // Split Image URLs
        // --------------------------------------

        splitImageUrls: function (imageUrls) {

            if (!imageUrls) {
                return [];
            }

            return imageUrls
                .split(",")
                .map(function (url) {
                    return url.trim();
                })
                .filter(function (url) {
                    return url !== "";
                });

        },


        // --------------------------------------
        // Retry API Request
        // --------------------------------------

        reloadIncident: function () {

            this.getIncident();

        }

    }

});
