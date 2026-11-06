var vm = new Vue({
    el: '#DashboardView',
    data() {
        return {
            guardId: window.GuardId,
            selectedDate: moment().format("YYYY-MM-DD"),

            clockLogs: [],
            clockInStatus: false,
            clockInSwitch: false,
            shiftActivityLogs: [],
            
            showClockInForm: false,
            showAddTaskForm: false,
            searchText: '',

            clockIn: {
                siteId: '',
                siteId: '',
                shiftId: '',
                guardPostId: ''
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

            
            taskRunning: false,
            taskCompleted: false,
            taskStartTime: null,
            taskEndTime: null,
            totalSeconds: 0,
            timerInterval: null,



        };
    },
    created() {
        this.loadDashboardData();
        this.loadClockInStatus();
        this.loadShiftActivityLogs();
    },
    computed: {
        //changing the order in task list which task is selected will be at top
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
        //search bar
        filteredTaskList() {
            if (!this.searchText) {
                return this.prioritizedTaskList;
            }
            const search = this.searchText.toLowerCase().trim();
            return this.prioritizedTaskList.filter(t => {
                return (t.siteName.toLowerCase().includes(search) || t.taskName.toLowerCase().includes(search));
            });
        },

        //formatting time for calculating and showing the task execution period
        formattedTotalTime() {
            const hours = Math.floor(this.totalSeconds / 3600);
            const minutes = Math.floor((this.totalSeconds % 3600) / 60);
            const seconds = this.totalSeconds % 60;
            return [
                String(hours).padStart(2, '0'),
                String(minutes).padStart(2, '0'),
                String(seconds).padStart(2, '0')
            ].join(':');
        }


    },

    methods: {
        //Format date time in activity log
        formatDateTime(date) {
            if (!date) {
                return "-";
            }
            return window.moment(date).local().format("hh:mm A, DD MMM YYYY");
        },

        //loading guard/shift/task
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

        //adding the task
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
            // console.log("Task Assigned");

            //reset form
            this.addTask = {
                siteId: '',
                taskId: '',
                date: '',
                startTime: '',
                endTime: ''
            }
            this.showAddTaskForm = false;
        },

        //storing the selected task from task list
        selectExecutionTask(task) {
            this.selectedExecutionTask = task;
        },

        // confirmClockIn  () {
        //     this.clockInStatus = true;
        //     this.clockInSwitch = true;

        //     this.showClockInForm = false;
        // },

        //updating the data if user is successfully clocked in
        async confirmClockIn() {
            try {
                if (!this.clockIn.siteId || !this.clockIn.shiftId || !this.clockIn.guardPostId) {
                    alert("Please fill all requred fields.")
                    return;
                }
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
                    clockedInSite = response.data.record;                    
                    this.showClockInForm = false;
                    await this.loadShiftActivityLogs();
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

        //Updating the data if the user is clocked out successfully
        async confirmClockOut() {

            try {

                const response = await axios.post('/ClockIn/ClockOut', {
                    guardId: window.GuardId
                });

                if (response.data.success) {

                    this.clockInStatus = false;
                    this.clockInSwitch = false;
                    this.clockLogs = [response.data.record];
                    await this.loadShiftActivityLogs();

                    alert("Clocked out successfully");
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
        //Closing clock In form with close or cross button
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




        //handling the behaviour of clock in toggle whether it should be turn off or turn on
        //Calling confirmClockIn which gives the status to update the switch and status
        handleClockInToggle() {

            if (this.clockInSwitch && !this.clockInStatus) {

                this.showClockInForm = true;

            }
            else if (!this.clockInSwitch && this.clockInStatus) {

                this.confirmClockOut();

            }
        },
        //Opening Add Task Form
        openAddTaskForm() {
            this.showAddTaskForm = true;

        },
        //Closing Add Task Form
        closeAddTaskForm() {
            this.showAddTaskForm = false;

        },

        //keep the dashboard updated of the status of guard if he is clocked in or clocked out
        async loadClockInStatus() {
            try {
                const response = await axios.get('/ClockIn/GetClockInStatus', {
                    params: {
                        guardId: window.GuardId
                    }
                });

                // console.log("Clock In Api response:", response.data);

                this.clockInStatus = response.data.isClockedIn;
                this.clockInSwitch = response.data.isClockedIn;
                

                // console.log("clockin status", this.clockInStatus);
                // console.log("clockin switch", this.clockInSwitch);

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


        //start task timer
        startTask() {
            if (this.taskRunning || this.taskCompleted) {
                return;
            }

            this.taskStartTime = performance.now();
            this.taskRunning = true;
            // console.log("Task running");

            this.timerInterval = setInterval(() => {
                this.totalSeconds = Math.floor(performance.now() - this.taskStartTime) / 1000
            }, 1000);

        },
        //end task timer
        endTask() {
            if (!this.taskRunning) return;

            this.taskEndTime = performance.now();

            clearInterval(this.timerInterval);
            this.timerInterval = null;

            this.totalSeconds = Math.floor((this.taskEndTime - this.taskStartTime) / 1000);

            // console.log("Task Completed");
            // console.log("Total", this.totalSeconds);
            this.taskRunning = false;
            this.taskCompleted = true;
        },
        //Activity Log Clock In/Clock Out
        async loadShiftActivityLogs() {
            try {
                // console.log("Guard ID from Vue:", this.guardId);
                const response = await axios.get('/ClockIn/GetShiftActivityLog', {
                    params: {
                        guardId: this.guardId
                    }
                });
                this.shiftActivityLogs = response.data.sort((a, b) => {
                    return new Date(b.clockInTime) - new Date(a.clockInTime);
                });

                // for (let i in this.shiftActivityLogs) {
                //     console.log(this.shiftActivityLogs[i]);
                // }
            } catch (error) {
                console.error("Error loading shift sctivity log", error);
            }    
        }
    }
    
});