
var vm = new Vue({

    el: '#IncidentApp',

    // =========================================
    // DATA
    // =========================================

    data: {

        incidents: [],

        loading: false,
        errorMessage: '',
        initialized: false,

       
        isDownloadingPdf: false,
        isDownloadingExcel: false,

        filters: {
            startDate: moment().format('YYYY-MM-DD'),
            endDate: moment().format('YYYY-MM-DD'),
            site: '',
            location: '',
            type: '',
            category: '',
            subCategory: ''
        },

        filterOptions: {
            sites: [],
            locations: [],
            types: [],
            categories: [],
            subCategories: []
        },

        showSearch: false,
        searchText: '',

        sortColumn: '',
        sortDirection: 'asc',

        currentPage: 1,
        pageSize: 10,

        incidentTypeChart: null,
        categoryChart: null,
        subCategoryChart: null,

        dateRangeText: ''

    },


    // =========================================
    // CREATED
    // Called before DOM mounting
    // =========================================

    created: function () {

        console.log('Incident Vue application created');

    },


    // =========================================
    // COMPUTED
    // =========================================
 computed: {

        // Filter incidents, search and sorting
        filteredIncidents: function () {

            var f = this.filters;

            var search = String(this.searchText || '')
                .trim()
                .toLowerCase();

            var result = this.incidents.filter((incident) => {

                var matchesSite =
                    !f.site ||
                    String(incident.site || '').toLowerCase() ===
                    String(f.site).toLowerCase();

                var matchesLocation =
                    !f.location ||
                    String(incident.location || '').toLowerCase()
                        .includes(String(f.location).toLowerCase());

                var matchesType =
                    !f.type ||
                    String(incident.type || '').toLowerCase() ===
                    String(f.type).toLowerCase();

                var matchesCategory =
                    !f.category ||
                    String(incident.category || '').toLowerCase() ===
                    String(f.category).toLowerCase();

                var matchesSubCategory =
                    !f.subCategory ||
                    String(incident.subCategory || '').toLowerCase() ===
                    String(f.subCategory).toLowerCase();

                // Existing Date range filtering - unchanged
                var incidentDate = moment(incident.reportedDate);

                var matchesDate = incidentDate.isValid() &&
                    incidentDate.isSameOrAfter(
                        moment(f.startDate, 'YYYY-MM-DD').startOf('day')
                    ) &&
                    incidentDate.isSameOrBefore(
                        moment(f.endDate, 'YYYY-MM-DD').endOf('day')
                    );

                // Search across all incident properties and date formats
                console.log("Search text:", search);
                console.log("Reported date:", incident.reportedDate);
                console.log("Date as string:", String(incident.reportedDate));
                var matchesSearch = true;

                if (search) {

                    var incidentDate = moment(incident.reportedDate);

                    // Date format
                    var formattedDate = incidentDate.isValid()
                        ? incidentDate.format('DD-MM-YYYY').toLowerCase()
                        : '';

                    // Date with time (same format as the table)
                    var formattedDateTime = incidentDate.isValid()
                        ? incidentDate.format('DD-MM-YYYY HH:mm').toLowerCase()
                        : '';

                    // API date format without milliseconds
                    var apiDateTime = incidentDate.isValid()
                        ? incidentDate.format('YYYY-MM-DD[T]HH:mm:ss').toLowerCase()
                        : '';

                    // Original API value
                    var originalDate = String(incident.reportedDate || '')
                        .toLowerCase();

                    matchesSearch =
                        Object.keys(incident).some((key) => {

                            return String(incident[key] || '')
                                .toLowerCase()
                                .includes(search);

                        }) ||
                        formattedDate.includes(search) ||
                        formattedDateTime.includes(search) ||
                        apiDateTime.includes(search) ||
                        originalDate.includes(search);

                }
                return matchesSite &&
                    matchesLocation &&
                    matchesType &&
                    matchesCategory &&
                    matchesSubCategory &&
                    matchesDate &&
                    matchesSearch;

            });
  // Sorting
            if (this.sortColumn) {

                var column = this.sortColumn;

                var direction =
                    this.sortDirection === 'asc' ? 1 : -1;

                result.sort((a, b) => {

                    var valueA = a[column];
                    var valueB = b[column];

                    if (column === 'incidentNo') {

                        var numberA = parseFloat(
                            String(valueA || '').replace(/[^\d.-]/g, '')
                        );

                        var numberB = parseFloat(
                            String(valueB || '').replace(/[^\d.-]/g, '')
                        );

                        numberA = isNaN(numberA) ? 0 : numberA;
                        numberB = isNaN(numberB) ? 0 : numberB;

                        return (numberA - numberB) * direction;

                    }

                    if (column === 'reportedDate') {

                        var dateA = moment(valueA).valueOf();
                        var dateB = moment(valueB).valueOf();

                        dateA = isNaN(dateA) ? 0 : dateA;
                        dateB = isNaN(dateB) ? 0 : dateB;

                        return (dateA - dateB) * direction;

                    }

                    return String(valueA || '').toLowerCase()
                        .localeCompare(
                            String(valueB || '').toLowerCase(),
                            undefined,
                            { numeric: true }
                        ) * direction;

                });

            }

            return result;

        },


        // Pagination
        paginatedIncidents: function () {

            var start = (this.currentPage - 1) * this.pageSize;

            return this.filteredIncidents.slice(
                start,
                start + this.pageSize
            );

        },
   // Total pages
        totalPages: function () {

            return Math.max(
                1,
                Math.ceil(this.filteredIncidents.length / this.pageSize)
            );

        },
        // First record
        startRecord: function () {

            if (this.filteredIncidents.length === 0) {
                return 0;
            }

            return (this.currentPage - 1) * this.pageSize + 1;

        },


        // Last record
        endRecord: function () {

            return Math.min(
                this.currentPage * this.pageSize,
                this.filteredIncidents.length
            );

        }

    },
    methods: {

        // =========================================
        // GET INCIDENTS API
        // =========================================

        getIncidents: function () {

            this.loading = true;
            this.errorMessage = '';
            axios.get('/Incident/GetIncidentList', {

                params: {
                    userId: 30,
                    stDate: this.filters.startDate,
                    endDate: this.filters.endDate
                }

            })

                .then((response) => {

                    console.log('Full API response:', response.data);

                    // Extract API response records.
                    var body = response.data;

                    if (Array.isArray(body)) {

                        // Response is directly an array.
                        var rows = body;

                    } else if (body && Array.isArray(body.data)) {

                        // Response format: { data: [...] }
                        var rows = body.data;

                    } else if (
                        body &&
                        body.data &&
                        Array.isArray(body.data.data)
                    ) {

                        // Response format: { data: { data: [...] } }
                        var rows = body.data.data;

                    } else {

                        var rows = [];

                    }

                    console.log('Extracted records:', rows.length);
                    console.log('First API record:', rows[0]);


                    // Map API properties to Vue properties.
                    this.incidents = rows.map((item, index) => {

                        return {

                            id: item.id || item.Id || index + 1,

                            incidentNo:
                                item.id ||
                                item.incidentNo ||
                                item.incidentNumber ||
                                "",

                            state:
                                item.regionName ||
                                item.state ||
                                "",

                            territory:
                                item.branchName ||
                                item.territory ||
                                "",

                            client:
                                item.customerName ||
                                item.client ||
                                "",

                            site:
                                item.siteName ||
                                item.site ||
                                "",

                            location:
                                item.dutyPostName ||
                                item.location ||
                                "",

                            guardPost:
                                item.guardPostName ||
                                item.dutyPostName ||
                                "",

                            type:
                                item.incidentType ||
                                item.type ||
                                "",

                            category:
                                item.category ||
                                "",

                            subCategory:
                                item.subCategory ||
                                "",

                            createdBy:
                                item.raisedByName ||
                                item.createdBy ||
                                "",

                            assignedTo:
                                item.assignedToName ||
                                item.assignedToNameNo ||
                                item.assignedTo ||
                                "",

                            closedBy:
                                item.closedByName || '',

                            status:
                                item.incidentStatus ||
                                item.status ||
                                "",

                            reportedDate:
                                item.date ||
                                item.reportedDate ||
                                item.incidentDate ||
                                item.createdDate ||
                                item.createdDateTime ||
                                ''

                        };

                    });


                    console.log('Mapped incidents:', this.incidents);

                    this.buildFilterOptions();

                    this.$nextTick(() => {

                        this.syncSelect2Options();

                        this.createCharts();

                        this.initialized = true;

                    });

                })

                .catch((error) => {

                    console.error('Unable to load incidents:', error);

                    if (error.response) {

                        console.error(
                            'HTTP status:',
                            error.response.status
                        );

                        console.error(
                            'Response body:',
                            error.response.data
                        );

                    }

                    this.errorMessage =
                        'Unable to load incidents. Check the API request and browser console.';

                    this.incidents = [];

                    this.buildFilterOptions();

                    this.updateCharts();

                })

                .finally(() => {

                    this.loading = false;

                });

        },


        // =========================================
        // BUILD FILTER OPTIONS
        // =========================================

        buildFilterOptions: function () {

            this.filterOptions.sites = [
                ...new Set(
                    this.incidents
                        .map(x => x.site)
                        .filter(x => x && x !== '-')
                )
            ].sort();

            this.filterOptions.locations = [
                ...new Set(
                    this.incidents
                        .map(x => x.location)
                        .filter(x => x && x !== '-')
                )
            ].sort();

            this.filterOptions.types = [
                ...new Set(
                    this.incidents
                        .map(x => x.type)
                        .filter(x => x && x !== '-')
                )
            ].sort();

            this.filterOptions.categories = [
                ...new Set(
                    this.incidents
                        .map(x => x.category)
                        .filter(x => x && x !== '-')
                )
            ].sort();

            this.filterOptions.subCategories = [
                ...new Set(
                    this.incidents
                        .map(x => x.subCategory)
                        .filter(x => x && x !== '-')
                )
            ].sort();

        },


        // =========================================
        // SELECT2 INITIALIZATION
        // =========================================

        initializeSelect2: function () {

            if (
                !window.jQuery ||
                !window.jQuery.fn ||
                !window.jQuery.fn.select2
            ) {

                console.warn('Select2 is not available');

                return;

            }

            var $ = window.jQuery;

            var selectorMap = [

                { selector: '#siteFilter', key: 'site' },

                { selector: '#locationFilter', key: 'location' },

                { selector: '#typeFilter', key: 'type' },

                { selector: '#categoryFilter', key: 'category' },

                { selector: '#subCategoryFilter', key: 'subCategory' }

            ];


            selectorMap.forEach((entry) => {

                var $element = $(entry.selector);

                if (!$element.length) {
                    return;
                }

                $element.select2({

                    width: '100%',
                    // placeholder: 'All',
                    allowClear: false

                });

                $element.off('change.incidentVue');

                $element.on('change.incidentVue', (event) => {

                    var value = $(event.currentTarget).val() || '';

                    this.filters[entry.key] = value;

                });

            });

        },


        // =========================================
        // UPDATE SELECT2 OPTIONS
        // =========================================

        syncSelect2Options: function () {

            if (
                !window.jQuery ||
                !window.jQuery.fn ||
                !window.jQuery.fn.select2
            ) {
                return;
            }

            var $ = window.jQuery;

            [
                '#siteFilter',
                '#locationFilter',
                '#typeFilter',
                '#categoryFilter',
                '#subCategoryFilter'

            ].forEach(function (selector) {

                var $element = $(selector);

                if ($element.length) {
                    $element.trigger('change.select2');
                }

            });

        },


        // =========================================
        // DATE RANGE PICKER
        // =========================================

        initializeDatePicker: function () {

            if (
                !window.jQuery ||
                !window.jQuery.fn ||
                !window.jQuery.fn.daterangepicker
            ) {

                console.warn('Date Range Picker is not available');

                return;

            }

            var $ = window.jQuery;

            var $input = $('#incidentDateRange');

            var start = moment().startOf('day');

            var end = moment().endOf('day');


            $input.daterangepicker({

                startDate: start,

                endDate: end,

                autoUpdateInput: true,

                showDropdowns: true,

                linkedCalendars: false,

                ranges: {

                    'Today': [
                        moment().startOf('day'),
                        moment().endOf('day')
                    ],

                    'Yesterday': [
                        moment().subtract(1, 'days').startOf('day'),
                        moment().subtract(1, 'days').endOf('day')
                    ],

                    'Last 7 Days': [
                        moment().subtract(6, 'days').startOf('day'),
                        moment().endOf('day')
                    ],

                    'Last 30 Days': [
                        moment().subtract(29, 'days').startOf('day'),
                        moment().endOf('day')
                    ],

                    'This Month': [
                        moment().startOf('month'),
                        moment().endOf('month')
                    ],

                    'Last Month': [
                        moment().subtract(1, 'month').startOf('month'),
                        moment().subtract(1, 'month').endOf('month')
                    ]

                },

                locale: {

                    format: 'DD MMM YYYY',

                    separator: ' - ',

                    applyLabel: 'Apply',

                    cancelLabel: 'Cancel',

                    customRangeLabel: 'Custom Range'

                }

            }, (startDate, endDate) => {

                this.filters.startDate =
                    startDate.format('YYYY-MM-DD');

                this.filters.endDate =
                    endDate.format('YYYY-MM-DD');

                this.dateRangeText =
                    startDate.format('DD MMM YYYY') +
                    ' - ' +
                    endDate.format('DD MMM YYYY');

            });


            this.filters.startDate = start.format('YYYY-MM-DD');

            this.filters.endDate = end.format('YYYY-MM-DD');


            $input.off('apply.daterangepicker.incidentVue');

            $input.on(
                'apply.daterangepicker.incidentVue',
                (event, picker) => {

                    this.filters.startDate =
                        picker.startDate.format('YYYY-MM-DD');

                    this.filters.endDate =
                        picker.endDate.format('YYYY-MM-DD');

                    this.currentPage = 1;

                    this.getIncidents();

                }
            );

        },


        // =========================================
        // CREATE CHARTS
        // =========================================

        createCharts: function () {

            if (typeof Chart === 'undefined') {
                console.error('Chart.js is not loaded');
                return;
            }

            this.destroyCharts();

            this.incidentTypeChart = this.createDoughnutChart(
                'incidentTypeChart',
                'Incident Type'
            );

            this.categoryChart = this.createDoughnutChart(
                'categoryChart',
                'Category'
            );

            this.subCategoryChart = this.createDoughnutChart(
                'subCategoryChart',
                'SubCategory'
            );

            // Populate all three charts immediately
            this.updateSingleChart(this.incidentTypeChart, 'type');

            this.updateSingleChart(this.categoryChart, 'category');

            this.updateSingleChart(this.subCategoryChart, 'subCategory');

        },


        // =========================================
        // CREATE DOUGHNUT CHART
        // =========================================

        createDoughnutChart: function (canvasId, title) {

            var canvas = document.getElementById(canvasId);

            if (!canvas) {

                console.warn('Chart canvas not found:', canvasId);

                return null;

            }

            return new Chart(canvas, {

                type: 'doughnut',

                data: {

                    labels: [],

                    datasets: [{

                        label: title,

                        data: [],

                        backgroundColor: [

                            '#dfb982',
                            '#609fa0',
                            '#8e7cc3',
                            '#e6a1a1',
                            '#83b692',
                            '#d5a6bd',
                            '#7fa6d8',
                            '#d8cc78',
                            '#bd8d6c',
                            '#91a3b0'

                        ],

                        borderColor: '#ffffff',

                        borderWidth: 2

                    }]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {

                            display: true,

                            position: 'right'

                        },

                        title: {

                            display: true,

                            text: title

                        },

                        tooltip: {

                            callbacks: {

                                label: function (context) {

                                    var label = context.label || '';

                                    var value = context.parsed || 0;

                                    return label + ': ' + value;

                                }

                            }

                        }

                    }

                }

            });

        },


        // =========================================
        // GET CHART DATA
        // =========================================

        getChartCounts: function (field) {

            var counts = {};

            this.filteredIncidents.forEach(function (incident) {

                var value = String(incident[field] || '').trim();

                if (!value || value === '-') {
                    value = 'Unknown';
                }

                counts[value] = (counts[value] || 0) + 1;

            });

            var labels = Object.keys(counts);

            return {

                labels: labels,

                values: labels.map(function (label) {

                    return counts[label];

                })

            };

        },


        // =========================================
        // UPDATE INDIVIDUAL CHART
        // =========================================

        updateSingleChart: function (chart, field) {

            if (!chart) {
                return;
            }

            var counts = {};

            this.filteredIncidents.forEach(function (incident) {

                var value = String(incident[field] || '').trim();

                if (!value || value === '-') {
                    value = 'Unknown';
                }

                counts[value] = (counts[value] || 0) + 1;

            });

            var labels = Object.keys(counts);

            var values = labels.map(function (label) {
                return counts[label];
            });

            chart.data.labels = labels;

            chart.data.datasets[0].data = values;

            chart.update();

        },


        // =========================================
        // UPDATE ALL CHARTS
        // =========================================

        updateCharts: function () {

            if (typeof Chart === 'undefined') {
                console.error('Chart.js is not loaded');
                return;
            }

            this.$nextTick(() => {

                var incidentCanvas =
                    document.getElementById('incidentTypeChart');

                var categoryCanvas =
                    document.getElementById('categoryChart');

                var subCategoryCanvas =
                    document.getElementById('subCategoryChart');

                if (
                    !incidentCanvas ||
                    !categoryCanvas ||
                    !subCategoryCanvas
                ) {
                    console.warn('Chart canvas elements are missing');
                    return;
                }

                // If chart instances do not exist, create them.
                if (
                    !this.incidentTypeChart ||
                    !this.categoryChart ||
                    !this.subCategoryChart
                ) {
                    this.createCharts();
                    return;
                }

                // Refresh chart data from the latest computed records.
                this.updateSingleChart(
                    this.incidentTypeChart,
                    'type'
                );

                this.updateSingleChart(
                    this.categoryChart,
                    'category'
                );

                this.updateSingleChart(
                    this.subCategoryChart,
                    'subCategory'
                );

                console.log(
                    'Charts refreshed. Filtered records:',
                    this.filteredIncidents.length
                );

            });

        },


        // =========================================
        // DESTROY CHARTS
        // =========================================

        destroyCharts: function () {

            [

                'incidentTypeChart',

                'categoryChart',

                'subCategoryChart'

            ].forEach((name) => {

                if (this[name]) {

                    this[name].destroy();

                    this[name] = null;

                }

            });

        },


        // =========================================
        // SEARCH
        // =========================================

        toggleSearch: function () {

            this.showSearch = !this.showSearch;

            if (this.showSearch) {

                this.$nextTick(() => {

                    if (this.$refs.searchInput) {

                        this.$refs.searchInput.focus();

                    }

                });

            } else {

                this.searchText = '';

            }

        },


        closeSearch: function () {

            this.showSearch = false;

            this.searchText = '';

        },


        clearSearch: function () {

            this.searchText = '';

            this.currentPage = 1;

            this.$nextTick(() => {

                if (this.$refs.searchInput) {

                    this.$refs.searchInput.focus();

                }

            });

        },


        // =========================================
        // SORTING
        // =========================================

        sortBy: function (column) {

            if (this.sortColumn === column) {

                this.sortDirection =
                    this.sortDirection === 'asc' ? 'desc' : 'asc';

            } else {

                this.sortColumn = column;

                this.sortDirection = 'asc';

            }

            this.currentPage = 1;

        },


        sortIndicator: function(column) {
            return 'fa-sort';
        },


        // =========================================
        // PAGINATION
        // =========================================

        goToFirstPage: function () {

            this.currentPage = 1;

        },


        goToPreviousPage: function () {

            if (this.currentPage > 1) {

                this.currentPage--;

            }

        },


        goToNextPage: function () {

            if (this.currentPage < this.totalPages) {

                this.currentPage++;

            }

        },


        goToLastPage: function () {

            this.currentPage = this.totalPages;

        },


        // =========================================
        // DATE FORMATTING
        // =========================================

        formatDate: function (value) {

            if (!value || value === '-') {

                return '-';

            }

            var parsed = moment(value);

            return parsed.isValid()

                ? parsed.format('DD-MM-YYYY HH:mm')

                : value;

        },


        // =========================================
        // PDF DOWNLOAD
        // =========================================



        downloadPdf: function () {

            if (
                typeof pdfMake === 'undefined' ||
                !pdfMake.createPdf
            ) {
                alert('PDFMake is not loaded.');
                return;
            }

            if (typeof Swal === 'undefined') {
                alert('SweetAlert2 is not loaded.');
                return;
            }

            // Start loader
            this.isDownloadingPdf = true;

            Swal.fire({
                title: 'Generating PDF...',
                text: 'Please wait while your report is being prepared.',
                allowOutsideClick: false,
                allowEscapeKey: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            try {

                var headers = [
                    'S.No',
                    'Incident No',
                    'State',
                    'Territory',
                    'Client',
                    'Site',
                    'Location',
                    'Guard Post',
                    'Type of Incident',
                    'Category',
                    'SubCategory',
                    'Created By',
                    'Assigned To',
                    'Closed By',
                    'Status',
                    'Reported Date'
                ];

                var body = [headers];

                this.filteredIncidents.forEach((incident, index) => {
                    body.push([
                        index + 1,
                        incident.incidentNo,
                        incident.state,
                        incident.territory,
                        incident.client,
                        incident.site,
                        incident.location,
                        incident.guardPost,
                        incident.type,
                        incident.category,
                        incident.subCategory,
                        incident.createdBy,
                        incident.assignedTo,
                        incident.closedBy,
                        incident.status,
                        this.formatDate(incident.reportedDate)
                    ]);
                });

                var documentDefinition = {
                    pageOrientation: 'landscape',
                    pageSize: 'A3',

                    content: [
                        {
                            text: 'Incident Management Report',
                            style: 'title',
                            margin: [0, 0, 0, 12]
                        },
                        {
                            text: 'Total Records: ' +
                                this.filteredIncidents.length,
                            margin: [0, 0, 0, 10]
                        },
                        {
                            table: {
                                headerRows: 1,
                                widths: Array(headers.length).fill('auto'),
                                body: body
                            },
                            layout: 'lightHorizontalLines'
                        }
                    ],

                    styles: {
                        title: {
                            fontSize: 18,
                            bold: true
                        }
                    },

                    defaultStyle: {
                        fontSize: 7
                    }
                };

                // Allow SweetAlert2 spinner to render before PDF generation
                setTimeout(() => {

                    try {

                        pdfMake.createPdf(documentDefinition).download(
                            'IncidentManagement.pdf',
                            () => {

                                // Stop loader after download callback
                                this.isDownloadingPdf = false;

                                // Close loading popup
                                Swal.close();

                            }
                        );

                    } catch (error) {

                        console.error('PDF download error:', error);

                        this.isDownloadingPdf = false;

                        Swal.close();

                        alert('Unable to generate PDF.');

                    }

                }, 100);

            } catch (error) {

                console.error('PDF download error:', error);

                this.isDownloadingPdf = false;

                Swal.close();

                alert('Unable to generate PDF.');

            }

        },



        // =========================================
        // EXCEL DOWNLOAD
        // =========================================


        downloadExcel: function () {

            if (
                typeof XLSX === 'undefined' ||
                !XLSX.utils
            ) {
                alert('SheetJS is not loaded.');
                return;
            }

            if (typeof Swal === 'undefined') {
                alert('SweetAlert2 is not loaded.');
                return;
            }

            this.isDownloadingExcel = true;

            // Show loading popup
            Swal.fire({
                title: 'Generating Excel...',
                text: 'Please wait while your Excel file is being generated.',
                allowOutsideClick: false,
                allowEscapeKey: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Allow the loading popup to render
            setTimeout(() => {

                try {

                    var rows = this.filteredIncidents.map((incident, index) => {

                        return {
                            'S.No': index + 1,
                            'Incident No': incident.incidentNo,
                            'State': incident.state,
                            'Territory': incident.territory,
                            'Client': incident.client,
                            'Site': incident.site,
                            'Location': incident.location,
                            'Guard Post': incident.guardPost,
                            'Type of Incident': incident.type,
                            'Category': incident.category,
                            'SubCategory': incident.subCategory,
                            'Created By': incident.createdBy,
                            'Assigned To': incident.assignedTo,
                            'Closed By': incident.closedBy,
                            'Status': incident.status,
                            'Reported Date': this.formatDate(incident.reportedDate)
                        };

                    });

                    var worksheet = XLSX.utils.json_to_sheet(rows);

                    var workbook = XLSX.utils.book_new();

                    XLSX.utils.book_append_sheet(
                        workbook,
                        worksheet,
                        'Incidents'
                    );

                    XLSX.writeFile(
                        workbook,
                        'IncidentManagement.xlsx'
                    );

                    // Close loader after generating the file
                    this.isDownloadingExcel = false;
                    Swal.close();

                }
                catch (error) {

                    console.error('Excel download error:', error);

                    this.isDownloadingExcel = false;
                    Swal.close();

                    Swal.fire({
                        icon: 'error',
                        title: 'Download Failed',
                        text: 'Unable to generate Excel file.'
                    });

                }

            }, 100);

        },



        // =========================================
        // FULLSCREEN
        // =========================================

        toggleFullscreen: function () {

            var element = document.getElementById('IncidentApp');

            if (!element) {
                return;
            }

            if (!document.fullscreenElement) {

                if (element.requestFullscreen) {

                    element.requestFullscreen().catch(function (error) {

                        console.error(
                            'Unable to enter fullscreen:',
                            error
                        );

                    });

                }

            } else if (document.exitFullscreen) {

                document.exitFullscreen();

            }

        },


        // =========================================
        // VIEW INCIDENT DETAILS
        // =========================================
        

        viewIncident: function(incident) {

            console.log("View button clicked");

            if (!incident || !incident.id) {
                alert('Incident ID is not available for this record.');
                return;
            }

            var incidentId = incident.id;

            // Encode parameter name
            var encodedKey = btoa("IncidentId");

            // Encode parameter value
            var encodedValue = btoa(incidentId.toString());

            console.log("Encoded Key:", encodedKey);
            console.log("Encoded Value:", encodedValue);

            // Open Incident View in new tab
            window.open(
                '/Incident/IncidentView?' +
                encodeURIComponent(encodedKey) + '=' +
                encodeURIComponent(encodedValue),
                '_blank'
            );
            console.log("Final URL:", finalUrl);
        },


        // =========================================
        // ADD INCIDENT
        // =========================================

        addIncident: function () {

            window.location.href = '/Incident/AddIncident';

        }

    },


    // =========================================
    // MOUNTED
    // Called after DOM mounting
    // =========================================

    // mounted: function () {

    //     console.log('Incident Vue application mounted');

    //     this.filters.startDate = '2026-09-01';
    //     this.filters.endDate = '2026-09-30';

    //     this.initializeDatePicker();

    //     this.initializeSelect2();

    //     this.getIncidents();

    // },

    mounted: function () {

        console.log('Incident Vue application mounted');

        this.initializeDatePicker();

        this.initializeSelect2();

        this.getIncidents();

    },


    // =========================================
    // WATCH
    // =========================================

    watch: {

        filters: {

            deep: true,

            handler: function () {

                this.currentPage = 1;

                this.updateCharts();

            }

        },


        searchText: function () {

            this.currentPage = 1;

            this.updateCharts();

        },


        pageSize: function () {

            this.currentPage = 1;

        },


        filteredIncidents: function () {

            if (this.currentPage > this.totalPages) {
                this.currentPage = this.totalPages;
            }

            // Refresh charts whenever filtered records change.
            this.updateCharts();

        }

    },


    // =========================================
    // BEFORE DESTROY
    // =========================================

    beforeDestroy: function () {

        this.destroyCharts();

        if (window.jQuery) {

            var $ = window.jQuery;

            $(
                '#siteFilter, #locationFilter, #typeFilter, ' +
                '#categoryFilter, #subCategoryFilter, #incidentDateRange'
            ).off('.incidentVue');

            if ($.fn && $.fn.select2) {

                $('.filter-group select').each(function () {

                    if ($(this).hasClass('select2-hidden-accessible')) {

                        $(this).select2('destroy');

                    }

                });

            }

        }

    }

});


// Global Vue instance reference
window.incidentManagementApp = vm;
