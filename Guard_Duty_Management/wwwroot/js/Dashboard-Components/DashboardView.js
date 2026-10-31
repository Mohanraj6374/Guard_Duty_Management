var vm = new Vue({
    el: '#DashboardView',
    data() {
        return{

            selectedDate: moment().format("YYYY-MM-DD"),
            
            clockLogs:[],
            clockInStatus: false,
            clockInSwitch: false,
            showClockInForm: false,
            showAddTaskForm: false,
            searchText: '',

            clockIn: {
                siteId:'',
                siteId: '',
                shiftId: '',
                guardPostId:''
            },

            addTask: {
                siteId: '',
                taskId: ''
            },

            siteOptions: [],

            taskOptions: [],

            shiftOptions: [],
            guardPostOptions: []

        };
    },
    created() {
        console.log("Today's date:", this.selectedDate);

        this.loadDashboardData();
    },
    
    methods: {
        async loadDashboardData() {

            try {

                const response = await axios.get('/data/dashboard-data.json');

                const data = await response.data;

                this.siteOptions = data.sites.map(site => ({
                    id: site.siteId,
                    text: site.siteName
                }));

                this.taskOptions = data.tasks.map(task => ({
                    id: task.taskId,
                    text: task.taskName
                }));

                this.shiftOptions = data.shifts.map(shift => ({
                    id: shift.shiftId,
                    text: shift.shiftTime
                }));
                this.guardPostOptions = data.guardposts.map(guardpost => ({
                    id: guardpost.guardpostId,
                    text: guardpost.guardpostName
                }));

            }
            catch (error) {
                console.error("Error loading dashboard data:", error);
            }

        },

        confirmClockIn  () {
            this.clockInStatus = true;
            this.clockInSwitch = true;

            this.showClockInForm = false;

            
        },

        closeClockInForm() {
                this.showClockInForm = false;
                this.clockInSwitch = false;
        },
        handleClockInToggle() {
            if (this.clockInSwitch && !this.clockInStatus) {
                this.showClockInForm = true;
                
            }
            else if (!this.clockInSwitch && this.clockInStatus) {
                this.clockInStatus = false;
                this.showClockInForm = false;
            }
        },

        openAddTaskForm() {
            this.showAddTaskForm = true;
            
        },
        closeAddTaskForm() {
            this.showAddTaskForm = false;

        }
    },
    mounted() {

        // $('.select2-dropdown').select2({
        //     placeholder: "Select an option",
        //     allowClear: true,
        //     width: '100%'
        // });

    }
});