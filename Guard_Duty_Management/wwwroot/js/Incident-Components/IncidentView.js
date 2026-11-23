var incidentDetailsApp = new Vue({

    el: "#IncidentDetailsApp",

    data: function () {
        return {
            errorMessage: "",
            isGeneratingPdf: false,
            incidentId: null,
            formControls: [],
            azure_map_api_url:"/Incident/GetAzureMapsKey",
            get_incident_api_url: "/Incident/GetIncidents",
            image_base64_api_url: "/Incident/GetImagesBase64",
            // dynamic form parsed from the "respoense" JSON
            incident: {
                // Report heading
                reportTitle: "",
                reportReference: "--",
                reportDate: "--",
                // Basic details
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
                locationCoordinates: "",   // "latitude,longitude" shown under the map
                locationCapturedOn: "--",
                mapImageBase64: "",
                siteName: "--",
                locationName: "--",
                // Classification
                type: "--",
                category: "--",
                subcategory: "--",
                conductedOn: "--",
                // Assignment
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
                // Summary
                summary: { who: "--", what: "--", when: "--", where: "--", why: "--" }   
            }
        };
    },
    created: function () {
        // Non-reactive: the Azure map object must NOT be inside Vue data
        this._azureMap = null;
        var encodedId = new URLSearchParams(window.location.search).get(btoa("IncidentId"));
        if (!encodedId) {
            this.errorMessage = "Incident ID is missing.";
            return;
        }
        try {
            // "+" in base64 becomes a space in query strings, so restore it
            this.incidentId = atob(encodedId.replace(/ /g, "+"));
        } catch (error) {
            console.error("Incident ID decode failed:", error);
            this.errorMessage = "Invalid Incident ID.";
            return;
        }
        this.getIncident();
    },

    beforeDestroy: function () {
        if (this._azureMap) {
            this._azureMap.dispose();
            this._azureMap = null;
        }
    },
    methods: {      
        // API
        getIncident: async function () {
            if (!this.incidentId) {
                this.errorMessage = "Incident ID is missing.";
                return;
            }
            this.errorMessage = "";
            this.showLoader("Loading Incident Details...", "Please wait while the incident information is loading.");
            try {
                await this.waitForPaint();
                var response = await axios.get(this.get_incident_api_url, {
                    params: { IncidentId: this.incidentId }
                });
                var result = response.data && response.data.data != null
                    ? response.data.data
                    : response.data;

                if (!result || typeof result !== "object" || Array.isArray(result)) {
                    throw new Error("No incident data returned.");
                }
                this.mapIncidentData(result);
            }
            catch (error) {
                console.error("Failed to load incident details:", error);
                this.errorMessage = error.response
                    ? "Failed to load incident. HTTP Status: " + error.response.status
                    : (error.message || "Unable to load incident details.");
            }
            finally {
                this.hideLoader(); 
            }
        },
        normalizeImages: function (list) {
            return (Array.isArray(list) ? list : [])
                .map(function (item) {
                    var url = typeof item === "string" ? item : (item && item.url);
                    return url ? { url: url, base64: "" } : null;
                })
                .filter(Boolean);
        },

        imgSrc: function (image) {
            return this.isGeneratingPdf && image.base64 ? image.base64 : image.url;
        },

        getAllImages: function () {
            var all = [].concat(this.incident.openImages, this.incident.closedImages);
            this.formControls.forEach(function (c) {
                if (c.images && c.images.length) all = all.concat(c.images);
            });
            return all;
        },

        loadImagesAsBase64: async function () {
            var images = this.getAllImages();
            if (!images.length) return;
            var response = await axios.post(this.image_base64_api_url,
                images.map(function (i) { return i.url; }));
            var results = response.data || [];
            images.forEach(function (img, idx) { img.base64 = results[idx] || ""; });
        },

        clearImagesBase64: function () {
            this.getAllImages().forEach(function (img) { img.base64 = ""; });
        },
        // API response -> view model     
        mapIncidentData: function (result) {
            
            var inc = this.incident;
            var dash = function (value) {
                return value === null || value === undefined || value === "" ? "--" : value;
            };
            // Basic
            inc.reportTitle = result.incidentType || "";
            inc.id = result.id != null ? "#" + result.id : "--";
            inc.status = dash(result.incidentStatus);
            // Customer
            inc.client = dash(result.customerName);
            inc.region = dash(result.regionName);
            inc.branch = dash(result.branchName);
            inc.raisedBy = dash(result.raisedByName);
            inc.employeeNo = result.raisedBy != null ? String(result.raisedBy) : "--";
            // Dates
            inc.dateTime = this.formatDate(result.date);
            inc.conductedOn = inc.dateTime;
            // Location
            inc.siteName = dash(result.siteName);
            inc.locationName = dash(result.dutyPostName);
            inc.openGpsLocation = dash(result.repotedLocation);
            inc.closedGpsLocation = dash(result.closedLocation);
            inc.mapImageBase64 = result.mapImageBase64 || "";
            inc.locationCapturedOn = this.formatCapturedOn(result.raisedOn || result.date);
            inc.locationCoordinates = this.toLatLng(inc.openGpsLocation);
            // Classification
            inc.type = dash(result.incidentType);
            inc.category = dash(result.category);
            inc.subcategory = dash(result.subCategory);
            // Assignment
            inc.assignedTo = dash(result.assignedToNameNo || result.assignedToName);
            inc.role = dash(result.role);
            inc.guardPost = dash(result.guardPostName);
            inc.assignedManagers = dash(result.assignedMangersName);
            inc.opsPost = dash(result.opsPostName);
            inc.emails = dash(result.toEmailIds);
            // Closing
            inc.closedDateTime = this.formatDate(result.closedDateTime);
            inc.closedBy = dash(result.closedByName);
            // Remarks and narratives
            inc.otherLocationRemarks = dash(result.dutyPostRemarks);
            inc.openNarrative = dash(result.description);
            inc.closedNarrative = dash(result.resolutionComments);
            // Images (Base64 from controller)
            // inc.openImages = Array.isArray(result.openImagesBase64) ? result.openImagesBase64.filter(function (img) { return img && img.src; }) : [];
            // inc.closedImages = Array.isArray(result.closedImagesBase64) ? result.closedImagesBase64.filter(function (img) { return img && img.src; }) : [];
            inc.openImages = this.normalizeImages(result.openImageUrls);
            inc.closedImages = this.normalizeImages(result.closedImageUrls);
         // Attendance
            var attendeeName = result.attendName || "Not Applicable";
            inc.attendees.forEach(function (attendee) {
                attendee.checked = attendee.name === attendeeName;
            });
            // Heading
            inc.reportReference = "Incident_" + result.id + "_" + (result.siteName || "");
            inc.reportDate = inc.dateTime;
            // Summary
            inc.summary.who = inc.raisedBy;
            inc.summary.what = inc.openNarrative;
            inc.summary.when = inc.dateTime;
            inc.summary.where = inc.siteName;
            inc.summary.why = inc.otherLocationRemarks;
            // Dynamic form (the API property is spelled "respoense")
            this.formControls = this.parseFormControls(result.respoense || result.response);
            // Run after the DOM has rendered the new data
            this.$nextTick(function () {
                this.initializeAzureMap();
                this.initializeImageMagnify();
            }.bind(this));
        },      
        // Dynamic form
        // JSON string -> flat list of render-ready controls
        // Dynamic form
        // JSON string -> flat list of render-ready controls
        parseFormControls: function (json) {
            if (!json) {
                return [];
            }
            var sections;
            try {
                sections = typeof json === "string" ? JSON.parse(json) : json;
            }
            catch (error) {
                console.error("Invalid form response JSON:", error);
                return [];
            }
            if (!Array.isArray(sections)) {
                return [];
            }
            var self = this;
            return Enumerable.asEnumerable(sections)
                .SelectMany(function (section) {
                    return section.Controls || [];
                })
                .Select(function (control, index) {
                    return self.normalizeControl(control, index);
                })
                .ToArray();
        },
        // One raw control -> { key, type, title, response, options, images, html }
        normalizeControl: function (control, index) {
            var data = control.data || {};
            var type = String(control.contentType || "").toUpperCase();
            var response = control.Response == null ? "" : String(control.Response).trim();
            var item = {
                key: "ctrl-" + index,
                type: type,
                title: String(data.title || "").trim(),
                response: "",
                options: [],
                images: [],
                html: ""
            };
            switch (type) {
                case "LABEL":
                    break;
                case "PARAGRAPH":
                    item.html = this.sanitizeHtml(data.placeholder);
                    break;
                case "PICTURE":
                    // The controller adds ResponseImageUrls: [{ url: SAS URL }]
                    item.images = this.normalizeImages(control.ResponseImageUrls);
                    break;
                case "STATICSPINNER":
                    item.options = Enumerable.from(data.datavalue || [])
                        .select(function (option) {
                            var label = String(option).trim();

                            return {
                                label: label,
                                checked: label.toLowerCase() === response.toLowerCase()
                            };
                        })
                        .toArray();
                    break;
                case "DATETIMEPICKER":
                    item.response = this.formatFormDate(response);
                    break;
                default: // TEXT and any other type
                    item.response = response || "--";
            }
            return item;
        },
        // dd-MM-yyyy HH:mm
        formatFormDate: function (value) {
            if (!value) {
                return "--";
            }
            var date = moment(value);
            if (!date.isValid()) {
                return value || "--";
            }
            return date.format("DD-MM-YYYY HH:mm");
        },
        // "20th Nov 2026 08:05 pm"
        formatCapturedOn: function (value) {
            if (!value || String(value).startsWith("0001-01-01")) {
                return "--";
            }
            var date = moment(value);
            if (!date.isValid()) {
                return "--";
            }
            return date.format("Do MMM YYYY hh:mm a");
        },
        // API gives "longitude,latitude"; the report shows "latitude,longitude"
        toLatLng: function (gps) {
            var parts = String(gps || "").split(",");
            if (parts.length !== 2 || !Number.isFinite(parseFloat(parts[0])) || !Number.isFinite(parseFloat(parts[1]))) {
                return "";
            }
            return parts[1].trim() + "," + parts[0].trim();
        },
        // Allow-list sanitizer for admin-defined HTML (used with v-html)
        sanitizeHtml: function (html) {
            if (!html) {
                return "";
            }
            var allowed = ["P", "BR", "STRONG", "B", "EM", "I", "U", "UL", "OL", "LI", "SPAN", "DIV"];
            var dropped = ["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED"];
            var doc = new DOMParser().parseFromString(String(html), "text/html");
            (function clean(parent) {
                Array.from(parent.childNodes).forEach(function (node) {
                    if (node.nodeType === 3) {
                        return; // text
                    }
                    if (node.nodeType !== 1 || dropped.indexOf(node.tagName) !== -1) {
                        parent.removeChild(node);
                        return;
                    }
                    clean(node);
                    if (allowed.indexOf(node.tagName) === -1) {
                        node.replaceWith.apply(node, Array.from(node.childNodes)); // unwrap
                    } else {
                        Array.from(node.attributes).forEach(function (attr) {
                            node.removeAttribute(attr.name);
                        });
                    }
                });
            })(doc.body);
            return doc.body.innerHTML;
        },
        // Azure Map
        escapeHtml: function (value) {
            if (value === null || value === undefined || value === "") {
                return "--";
            }
            return String(value)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#39;");
        },
        buildPopupContent
            : function () {
            var inc = this.incident;
            var e = this.escapeHtml;
            var rows = [
                ["Type of Incident:", inc.type],
                ["Category:", inc.category],
                ["Subcategory:", inc.subcategory],
                ["Created By:", inc.raisedBy],
                ["Reported Date:", inc.dateTime],
                ["Location:", inc.openGpsLocation]
            ].map(function (row) {
                return '<div class="incident-map-popup-row"><span>' + row[0] +
                    "</span><span>" + e(row[1]) + "</span></div>";
            }).join("");
            return '<div class="incident-map-popup">' +
                '<div class="incident-map-popup-header"><strong>' + e(inc.siteName) + "</strong>" +
                '<span class="incident-map-popup-id">' + e(inc.id) + "</span></div>" +
                '<div class="incident-map-popup-body">' + rows + "</div></div>";
        },
        getAzureMapsKey: function () {
            return axios.get(this.azure_map_api_url)
                .then(function (response) {
                    return response.data.key;
                });
        },
        initializeAzureMap: async function () {
            var coordinates = this.incident.openGpsLocation;
            if (!coordinates || coordinates === "--") {
                return;
            }
            // API coordinates are "longitude,latitude"
            var parts = coordinates.split(",");
            var longitude = parseFloat(parts[0]);
            var latitude = parseFloat(parts[1]);
            if (parts.length !== 2 || !Number.isFinite(longitude) || !Number.isFinite(latitude)) {
                console.warn("Invalid GPS coordinates:", coordinates);
                return;
            }
            if (this._azureMap) {
                this._azureMap.dispose();
                this._azureMap = null;
            }
            var key = await this.getAzureMapsKey();
            var map = new atlas.Map("azureIncidentMap", {
                center: [longitude, latitude],
            zoom: 15,
                authOptions: {
                    authType: "subscriptionKey",
                    subscriptionKey: key
                }
            });
            this._azureMap = map;
            var self = this;
            var position = [longitude, latitude];
            map.events.add("ready", function () {
                var marker = new atlas.HtmlMarker({ position: position, text: "I", color: "red" });
                map.markers.add(marker);
                var popup = new atlas.Popup({
                    position: position,
                    pixelOffset: [0, -35],
                    closeButton: true,
                    maxWidth: "340px"
                });
                map.events.add("click", marker, function () {
                    popup.setOptions({
                        content: self.buildPopupContent(),
                        position: position,
                        pixelOffset: [0, -35]
                    });
                    popup.open(map);
                    // Shift the map so the popup fits above the marker
                    map.setCamera({
                        center: position,
                        centerOffset: [0, 120],
                        type: "ease",
                        duration: 300
                    });
                });
                setTimeout(function () { map.resize(); }, 500);
            });
        },

  // Formatting       
        formatDate: function (dateValue) {
            if (!dateValue || String(dateValue).startsWith("0001-01-01")) {
                return "--";
            }
            var date = moment(dateValue);
            return date.isValid() ? date.format("DD-MM-YYYY HH:mm:ss") : "--";
        }, 
        // HTML -> plain text (entities decoded). Render with {{ }} and white-space: pre-line.
        formatNarrative: function (value) {
            if (!value || value === "--") {
                return "--";
            }
            var html = String(value)
                .replace(/<br\s*\/?>/gi, "\n")
                .replace(/<\/p>/gi, "\n");
            var text = new DOMParser().parseFromString(html, "text/html").body.textContent;
            return text.trim() || "--";
        },    
        // Image zoom (all images tagged data-magnify="gallery")   
        initializeImageMagnify: function () {
            $('[data-magnify="gallery"]').magnify({
                draggable: true,
                resizable: true,
                movable: true,
                keyboard: true,
                title: true,
                initEvent: "click",
                initMaximized: false,
                fixedModalSize: true,
                fixedModalPos: true,
                modalWidth: 800,
                modalHeight: 600,
                headerToolbar: ["maximize", "close"],
                footerToolbar: ["zoomIn", "zoomOut", "prev", "next", "fullscreen", "actualSize"] 
            });
        },     
        // PDF        
        downloadPdf: async function () {
            var element = document.getElementById("incidentPdfContent");
            if (!element) { alert("Incident report content not found."); return; }

            this.isGeneratingPdf = true;
            this.showLoader("Generating PDF...", "Please wait while your incident report is being generated.");
            try {
                await this.waitForPaint();
                await this.loadImagesAsBase64();
                element.classList.add("pdf-export-mode");
                await this.$nextTick();
                await this.waitForImages(element);

                var options = {
                    margin: 4,
                    filename: "Incident_Report_" + this.incident.id + ".pdf",
                    image: { type: "jpeg", quality: 0.98 },
                    enableLinks: true,
                    html2canvas: { scale: 2, useCORS: true, allowTaint: false, backgroundColor: "#ffffff" },
                    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
                    pagebreak: {
                        mode: ["css", "legacy"],
                        avoid: [".incident-grid-row", ".pdf-keep", ".section-heading", ".form-section-header", ".form-control-block"]
                    }
                };
                await html2pdf().set(options).from(element).save();
            }
            catch (error) {
                console.error("PDF generation failed:", error);
                alert("Unable to generate PDF: " + error.message);
            }
            finally {
                element.classList.remove("pdf-export-mode");
                this.isGeneratingPdf = false;
                this.clearImagesBase64();
                this.hideLoader();
            }
        },
        wrapImagesWithLinks: function (container) {
            var wrapped = [];
            var images = container.querySelectorAll("img");
            images.forEach(function (img) {
                var src = img.currentSrc || img.src;
                // data:/blob: URLs can't be opened from a PDF, so skip them
                if (!src || src.indexOf("data:") === 0 || src.indexOf("blob:") === 0) return;
                // already inside a link
                if (img.closest("a")) return;
                var a = document.createElement("a");
                a.href = new URL(src, window.location.href).href; // must be absolute
                a.target = "_blank";
                a.rel = "noopener noreferrer";
                a.style.display = "inline-block";
                a.style.textDecoration = "none";
                img.parentNode.insertBefore(a, img);
                a.appendChild(img);
                wrapped.push({ anchor: a, img: img });
            });
            return wrapped;
        },
        unwrapImageLinks: function (wrapped) {
            (wrapped || []).forEach(function (item) {
                if (item.anchor.parentNode) {
                    item.anchor.parentNode.insertBefore(item.img, item.anchor);
                    item.anchor.parentNode.removeChild(item.anchor);
                }
            });
        },
        waitForImages: function (container) {
            return Promise.all(Array.from(container.querySelectorAll("img")).map(function (img) {
                if (img.complete) {
                    return Promise.resolve();
                }
                return new Promise(function (resolve) {
                    img.onload = resolve;
                    img.onerror = resolve; // one broken image should not block the PDF
                });
            }));
        },
        // Helpers
        showLoader: function (title, text) {
            if (typeof Swal === "undefined") {
                return;
            }
            Swal.fire({
                title: title,
                text: text,
                allowOutsideClick: false,
                allowEscapeKey: false,
                showConfirmButton: false,
                didOpen: function () { Swal.showLoading(); }
            });
        },
        hideLoader: function () {
            if (typeof Swal !== "undefined") {
                Swal.close();
            }
        },
        // Lets the browser paint the loader before heavy work starts
        waitForPaint: function () {
            return new Promise(function (resolve) {
                requestAnimationFrame(function () {
                    requestAnimationFrame(resolve);
                });
            });
        }
    }
});