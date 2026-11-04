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
                taskId: '',
                date: '',
                startTime: '',
                endTime: ''                
            },

            siteOptions: [],

            taskOptions: [],

            shiftOptions: [],
            guardPostOptions: [],

            assignedTaskList: [],

            selectedExecutionTask: null,

           
        };
    },
    created() {
        console.log("Today's date:", this.selectedDate);

        this.loadDashboardData();
        this.loadClockInStatus();
    },
    computed: {
        prioritizedTaskList() {
            if (!this.selectedExecutionTask) {
                return this.assignedTaskList;
            }

            return [
                this.selectedExecutionTask,
                ...this.assignedTaskList.filter(
                    task => task.assignmentId !==
                        this.selectedExecutionTask.assignmentId
                )
            ];
        },
        filteredTaskList() {
            if (!this.searchText) {
                return this.prioritizedTaskList;
            }
            const search = this.searchText.toLowerCase().trim();
            return this.prioritizedTaskList.filter(t => {
                return (t.siteName.toLowerCase().includes(search) || t.taskName.toLowerCase().includes(search));
            });
        }


    },
    
    methods: {
        async loadDashboardData() {

            try {

                const response = await axios.get('/data/dashboard-data.json');

                const data = await response.data;

                this.siteOptions = data.sites.map(site => ({
                    id: site.siteId,
                    text: site.siteName,
                    address: site.siteAddress
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

        assignTask() {

            if (!this.addTask.siteId || !this.addTask.taskId || !this.addTask.date || !this.addTask.startTime || !this.addTask.endTime) {
                alert('Please fill all required fields.')
                return;
            }

            selectedSite = this.siteOptions.find(site => site.id == this.addTask.siteId);
            selectedTask = this.taskOptions.find(task => task.id == this.addTask.taskId);

            if (!selectedSite || !selectedTask) {
                alert('Invalid Site or Task selection.')
                return;
            }


            const task = {
                assignmentId: Date.now(),
                siteId: this.addTask.siteId,
                siteName: selectedSite.text,
                siteAddress: selectedSite.address,

                taskId: this.addTask.taskId,
                taskName: selectedTask.text,

                date: this.addTask.date,
                startTime: this.addTask.startTime,
                endTime: this.addTask.endTime,

                guardTaskStartTime: null,
                guardTaskEndTime: null,
                totalDuration: 0

            }
            this.assignedTaskList.push(task);
            console.log("Task Assigned");


            //reset form
            this.addTask = {
                siteId: '',
                taskId: '',
                date: '',
                startTime: '',
                endTime:''
            }

            this.showAddTaskForm = false;

        },

        selectExecutionTask(task) {
            this.selectedExecutionTask = task;
        },

        // confirmClockIn  () {
        //     this.clockInStatus = true;
        //     this.clockInSwitch = true;

        //     this.showClockInForm = false;
        // },
        async confirmClockIn() {

            try {

                const requestData = {
                    guardId: window.GuardId,
                    siteId: this.clockIn.siteId,
                    shiftId: this.clockIn.shiftId,
                    guardPostId: this.clockIn.guardPostId
                };

                const response = await axios.post(
                    '/ClockIn/ClockIn',
                    requestData
                );

                if (response.data.success) {

                    this.clockInStatus = true;
                    this.clockInSwitch = true;

                    this.clockLogs = [response.data.record];

                    this.showClockInForm = false;

                    console.log("Clocked in successfully.");

                }

            }
            catch (error) {

                console.error(
                    "Clock In failed:",
                    error.response?.data || error.message
                );

                alert(error.response?.data?.message || "Unable to clock in.");

            }
        },
        async confirmClockOut() {

            try {

                const response = await axios.post('/ClockIn/ClockOut', {
                    guardId: window.GuardId
                });

                if (response.data.success) {

                    this.clockInStatus = false;
                    this.clockInSwitch = false;

                    this.clockLogs = [response.data.record];

                    console.log("Clocked out successfully.");
                }

            }
            catch (error) {

                console.error(
                    "Clock Out failed:",
                    error.response?.data || error.message
                );

                // Restore the switch if the request fails
                this.clockInSwitch = true;

                alert(error.response?.data?.message || "Unable to clock out.");
            }
        },

        closeClockInForm() {
                this.showClockInForm = false;
                this.clockInSwitch = false;
        },
        // handleClockInToggle() {
        //     if (this.clockInSwitch && !this.clockInStatus) {
        //         this.showClockInForm = true;

        //     }
        //     else if (!this.clockInSwitch && this.clockInStatus) {
        //         this.clockInStatus = false;
        //         this.showClockInForm = false;
        //     }
        // },
        handleClockInToggle() {

            if (this.clockInSwitch && !this.clockInStatus) {

                this.showClockInForm = true;

            }
            else if (!this.clockInSwitch && this.clockInStatus) {

                this.confirmClockOut();

            }
        },

        openAddTaskForm() {
            this.showAddTaskForm = true;
            
        },
        closeAddTaskForm() {
            this.showAddTaskForm = false;

        },

        async loadClockInStatus() {
            try {
                const response = await axios.get('/ClockIn/GetClockInStatus', {
                    params: {
                        guardId: window.GuardId
                    }
                });

                this.clockInStatus = response.data.isClockedIn;
                this.clockInSwitch = response.data.isClockedIn;

                if (response.data.isClockedIn) {
                    this.clockIn = {
                        ...response.data.record
                    };
                }

            }
            catch (error) {
                console.error("Error loading clock-in status:", error);
            }
        },
    }
    
});