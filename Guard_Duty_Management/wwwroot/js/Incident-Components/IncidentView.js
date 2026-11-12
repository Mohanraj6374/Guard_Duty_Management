var incidentDetailsApp = new Vue({

    el: "#IncidentDetailsApp",

    // ==========================================
    // 1. DATA
    // ==========================================

    data: function () {
        return {

            loading: false,
            errorMessage: "",

            isGeneratingPdf: false,

            // Corrected Incident ID parameter
            encodedId: new URLSearchParams(window.location.search).get(btoa("IncidentId")),
            incidentId: null,

            // Azure Maps properties
            azureMap: null,
            azureMapsKey: window.azureMapsKey,

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
                mapImageBase64: "",
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
    // 2. CREATED
    // ==========================================

    created: function () {

        try {

            if (!this.encodedId) {
                this.errorMessage = "Incident ID is missing.";
                return;
            }

            // Decode Base64 ID
            this.incidentId = atob(this.encodedId);

            console.log("Encoded ID:", this.encodedId);
            console.log("Decoded Incident ID:", this.incidentId);

            // Call API once
            this.getIncident();

        } catch (error) {

            this.errorMessage = "Invalid Incident ID.";
            console.error(error);

        }

    },

    // ==========================================
    // 3. COMPUTED PROPERTIES
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
    // 4. LIFECYCLE HOOKS
    // ==========================================

    mounted: function () {

        console.log("Incident Details Vue instance mounted");

        console.log("Incident ID:", this.incidentId);

        // this.getIncident();
    },

    // ==========================================
    // 5. METHODS
    // ==========================================

    methods: {

        initializeAzureMap: function () {

            // Get GPS coordinates from incident data
            var coordinates = this.incident.openGpsLocation;

            if (!coordinates || coordinates === "--") {
                console.log("GPS coordinates not available.");
                return;
            }

            // Split longitude and latitude
            var parts = coordinates.split(",");

            if (parts.length !== 2) {
                console.log("Invalid GPS coordinates.");
                return;
            }

            var longitude = parseFloat(parts[0]);
            var latitude = parseFloat(parts[1]);

            if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
                console.log("Invalid latitude or longitude.");
                return;
            }

            // Dispose previous map instance if one exists
            if (this.azureMap) {
                this.azureMap.dispose();
                this.azureMap = null;
            }

            // Create Azure Map
            this.azureMap = new atlas.Map("azureIncidentMap", {
                center: [longitude, latitude],
                zoom: 15,

                authOptions: {
                    authType: "subscriptionKey",
                    subscriptionKey: this.azureMapsKey
                }
            });

            // Add incident location marker after map loads
            this.azureMap.events.add("ready", () => {

                var marker = new atlas.HtmlMarker({
                    position: [longitude, latitude],
                    text: "I",
                    color: "red"
                });

                this.azureMap.markers.add(marker);

            });

        },

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

        // getLocalImageUrl: function (azureUrl) {

        //     return "/Incident/GetIncidentImage?url=" +
        //         encodeURIComponent(azureUrl);

        // },

        // --------------------------------------
        // Map API Response to Vue Data
        // --------------------------------------

        mapIncidentData: function (result) {

            console.log("API Result:", result);
            console.log("Mapped Incident Data:", this.incident);

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

            this.incident.siteName = result.siteName || "--";
            this.incident.locationName = result.dutyPostName || "--";
            this.incident.openGpsLocation = result.repotedLocation || "--";
            this.incident.closedGpsLocation = result.closedLocation || "--";
            this.incident.mapImageBase64 = result.mapImageBase64 || "";

            console.log("Static Map Image:", result.mapImageBase64);
            console.log("Map Image Available:", !!result.mapImageBase64);

            console.log(
                "Map Image Length:",
                result.mapImageBase64 ? result.mapImageBase64.length : 0
            );

            this.$nextTick(() => {
                this.initializeAzureMap();
            });

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

            // Images - receive Base64 images from the controller

            console.log("Open Base64 Images:", result.openImagesBase64);
            console.log("Closed Base64 Images:", result.closedImagesBase64);

            this.incident.openImages =
                Array.isArray(result.openImagesBase64)
                    ? result.openImagesBase64.filter(Boolean)
                    : [];

            this.incident.closedImages =
                Array.isArray(result.closedImagesBase64)
                    ? result.closedImagesBase64.filter(Boolean)
                    : [];

            this.$nextTick(() => {
                this.initializeImageMagnify();
            });

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

            if (!value || value === "--") {
                return "--";
            }

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

        initializeImageMagnify: function () {

            this.$nextTick(() => {

                $('[data-magnify="gallery"]').magnify({
                    draggable: true,
                    resizable: true,
                    movable: true,
                    keyboard: true,
                    title: true,

                    initEvent: 'click',
                    initMaximized: false,

                    fixedModalSize: true,
                    fixedModalPos: true,

                    modalWidth: 800,
                    modalHeight: 600,

                    headerToolbar: ['close', 'maximize'],

                    footerToolbar: [
                        'zoomIn',
                        'zoomOut',
                        'prev',
                        'next',
                        'fullscreen',
                        'actualSize'
                    ]
                });

            });
        },

        // --------------------------------------
        // Download PDF
        // --------------------------------------

        downloadPdf: async function () {

            var element = document.getElementById("incidentPdfContent");

            if (!element) {
                alert("Incident report content not found.");
                return;
            }
            if (typeof Swal === "undefined") {
                alert("SweetAlert2 is not loaded.");
                return;
            }

            this.isGeneratingPdf = true;

            // Show loading spinner
            Swal.fire({
                title: "Generating PDF...",
                text: "Please wait while your incident report is being generated.",
                allowOutsideClick: false,
                allowEscapeKey: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
            // Allow the browser to render the loading popup
            await new Promise(resolve => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(resolve);
                });
            });
            try {

                // Enable PDF export mode
                element.classList.add("pdf-export-mode");

                // Wait for Vue updates
                await this.$nextTick();

                // Get the static map image generated by the controller
                var mapImage = element.querySelector(".pdf-map-image");

                if (!mapImage || !mapImage.src) {
                    throw new Error("Static map image not found. Check the .pdf-map-image element.");
                }

                // Make the static map visible in the original page
                mapImage.style.display = "block";
                mapImage.style.visibility = "visible";

                // Wait until the static map image is fully loaded
                if (typeof mapImage.decode === "function") {

                    await mapImage.decode();

                } else if (!mapImage.complete) {

                    await new Promise(function (resolve, reject) {

                        mapImage.onload = resolve;

                        mapImage.onerror = function () {
                            reject(new Error("Static map image failed to load."));
                        };

                    });
                }

                if (!mapImage.complete || mapImage.naturalWidth === 0) {
                    throw new Error("Static map image failed to load.");
                }

                console.log(
                    "Map ready for PDF:",
                    mapImage.naturalWidth,
                    mapImage.naturalHeight
                );

                // Wait for all report images to finish loading
                var images = Array.from(element.querySelectorAll("img"));

                await Promise.all(
                    images.map(function (img) {

                        if (img.complete && img.naturalWidth > 0) {
                            return Promise.resolve();
                        }

                        return new Promise(function (resolve, reject) {

                            img.onload = resolve;

                            img.onerror = function () {
                                reject(new Error("Report image failed to load."));
                            };

                        });
                    })
                );

                // PDF configuration
                var options = {

                    margin: 8,

                    filename: "Incident_Report_" +
                        this.incident.id + ".pdf",

                    image: {
                        type: "jpeg",
                        quality: 0.98
                    },

                    html2canvas: {

                        scale: 2,
                        useCORS: true,
                        allowTaint: false,
                        logging: true,
                        backgroundColor: "#ffffff",

                        onclone: function (clonedDocument) {

                            // Find the interactive Azure map in the cloned page
                            var clonedAzureMap =
                                clonedDocument.getElementById("azureIncidentMap");

                            // Find the static PNG map in the cloned page
                            var clonedStaticMap =
                                clonedDocument.querySelector(".pdf-map-image");

                            // Replace the interactive WebGL map with the static image
                            if (clonedAzureMap) {

                                var pdfMapImage = clonedDocument.createElement("img");

                                pdfMapImage.src = mapImage.src;
                                pdfMapImage.alt = "Incident Location Map";

                                pdfMapImage.style.display = "block";
                                pdfMapImage.style.visibility = "visible";
                                pdfMapImage.style.width = "100%";
                                pdfMapImage.style.height = "350px";
                                pdfMapImage.style.maxWidth = "100%";
                                pdfMapImage.style.objectFit = "contain";

                                clonedAzureMap.parentNode.replaceChild(
                                    pdfMapImage,
                                    clonedAzureMap
                                );

                            } else if (clonedStaticMap) {

                                // Fallback if the interactive map element is not present
                                clonedStaticMap.src = mapImage.src;
                                clonedStaticMap.style.display = "block";
                                clonedStaticMap.style.visibility = "visible";
                                clonedStaticMap.style.width = "100%";
                                clonedStaticMap.style.height = "350px";
                                clonedStaticMap.style.maxWidth = "100%";
                                clonedStaticMap.style.objectFit = "contain";

                            }

                            console.log(
                                "Static map inserted into PDF:",
                                !!(clonedAzureMap || clonedStaticMap)
                            );

                        }

                    },

                    jsPDF: {
                        unit: "mm",
                        format: "a4",
                        orientation: "portrait"
                    },

                    pagebreak: {
                        mode: ["css", "legacy"]
                    }

                };

                // Generate and download PDF
                await html2pdf()
                    .set(options)
                    .from(element)
                    .save();

                console.log("PDF downloaded successfully");

            }
            catch (error) {

                console.error("PDF generation error:", error);

                alert("Unable to generate PDF: " + error.message);

            }
            finally {

                // Restore original page
                element.classList.remove("pdf-export-mode");

                this.isGeneratingPdf = false;

                // Close loading spinner
                Swal.close();

            }

        },

        // --------------------------------------
        // Retry API Request
        // --------------------------------------

        reloadIncident: function () {

            this.getIncident();

        }

    }

});