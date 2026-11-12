import Enumerable from '../../lib/linq-js/linq.js4.0.3.js';
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
            isLoadingActivityLogs: false,

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
            selectedTask: '',
            selectedSite:'',

            // clockedInSite:'',
            taskRunning: false,
            taskCompleted: false,
            taskStartTime: null,
            taskEndTime: null,
            totalSeconds: 0,
            timerInterval: null,

            isAddingTask: false,
            isClockingIn: false,
            isClockingOut: false,
            isDashboardLoading: true
        };
    },
    async created() {
        try {
            await Promise.all([
                this.loadDashboardData(),
                this.loadClockInStatus(),
                this.loadShiftActivityLogs()
            ]);
        } finally {
            this.isDashboardLoading = false;
        }
    },
    computed: {        
        //changing the order in task list which task is selected will be at top
        prioritizedTaskList() {
            if (!this.selectedExecutionTask) {
                return this.assignedTaskList;
            }

            return [
                // this.selectedExecutionTask,
                // ...this.assignedTaskList.filter(
                //     task => task.assignmentId !==
                //         this.selectedExecutionTask.assignmentId
                // )
                this.selectedExecutionTask,
                ...Enumerable.from(this.assignedTaskList).where(task => task.assignmentId !== this.selectedExecutionTask.assignmentId).toArray()
            ];
        },
        //search bar
        filteredTaskList() {
            if (!this.searchText) {
                return this.prioritizedTaskList;
            }
            const search = this.searchText.toLowerCase().trim();
            // return this.prioritizedTaskList.filter(t => {
            //     return (t.siteName.toLowerCase().includes(search) || t.taskName.toLowerCase().includes(search));
            // });
            return Enumerable.from(this.prioritizedTaskList).where(t =>
                t.siteName.toLowerCase().includes(search) || t.taskName.toLowerCase().includes(search)
            ).toArray();
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

                // this.siteOptions = data.sites.map(site => ({
                //     id: site.siteId,
                //     text: site.siteName,
                //     address: site.siteAddress
                // }));
                this.siteOptions = Enumerable.from(data.sites).select(site => ({
                    id: site.siteId,
                    text: site.siteName,
                    address: site.siteAddress
                })).toArray();

                // this.taskOptions = data.tasks.map(task => ({
                //     id: task.taskId,
                //     text: task.taskName
                // }));
                this.taskOptions = Enumerable.from(data.tasks).select(task => ({
                    id: task.taskId,
                    text: task.taskName
                })).toArray();

                // this.shiftOptions = data.shifts.map(shift => ({
                //     id: shift.shiftId,
                //     text: shift.shiftTime
                // }));
                this.shiftOptions = Enumerable.from(data.shifts).select(shift => ({
                    id: shift.shiftId,
                    text: shift.shiftTime
                })).toArray();
                // this.guardPostOptions = data.guardposts.map(guardpost => ({
                //     id: guardpost.guardpostId,
                //     text: guardpost.guardpostName
                // }));
                this.guardPostOptions = Enumerable.from(data.guardposts).select(guard => ({
                    id: guard.guardpostId,
                    text: guard.guardpostName
                })).toArray();
            }
            catch (error) {
                console.error("Error loading dashboard data:", error);
                ToastService.error("Error: Something went wrong.Please try again.");
            }
        },

        //adding the task
        assignTask() {
            if (!this.addTask.siteId || !this.addTask.taskId || !this.addTask.date || !this.addTask.startTime || !this.addTask.endTime) {
                ToastService.warning('Warning: Please fill all required fields.')
                return;
            }
            // this.selectedSite = this.siteOptions.find(site => site.id == this.addTask.siteId);
            // this.selectedTask = this.taskOptions.find(task => task.id == this.addTask.taskId);
            this.selectedSite = Enumerable.from(this.siteOptions).firstOrDefault(site => site.id == this.addTask.siteId);
            this.selectedTask = Enumerable.from(this.taskOptions).firstOrDefault(task => task.id == this.addTask.taskId);

            if (!this.selectedSite || !this.selectedTask) {
                ToastService.warning('Warning: Invalid Site or Task selection.');
                return;
            }
            this.isAddingTask = true;
            // console.log("this.isAddingTask = true");
            try {
                const task = {
                    assignmentId: Date.now(),
                    siteId: this.addTask.siteId,
                    siteName: this.selectedSite.text,
                    siteAddress: this.selectedSite.address,

                    taskId: this.addTask.taskId,
                    taskName:this.selectedTask.text,

                    date: window.moment(this.addTask.date).format("DD-MM-YYYY"),
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
                ToastService.success('Task Successfully Added');
            }catch (error) {
                ToastService.error('Error: Task Not Added');
            }
            finally {
                this.isAddingTask = false;
            }
        },

        //storing the selected task from task list
        selectExecutionTask(task) {
            this.selectedExecutionTask = task;
        },

        //updating the data if user is successfully clocked in
        async confirmClockIn() {
            if (!this.clockIn.siteId || !this.clockIn.shiftId || !this.clockIn.guardPostId) {
                ToastService.warning("Please fill all requred fields.")
                return;
            }
            this.isClockingIn= true;
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
                    // this.clockedInSite = response.data.record.siteId;                    
                    this.showClockInForm = false;
                    await this.loadShiftActivityLogs();
                    ToastService.success('Success: Clocked in successfully');
                }              
                else {
                    ToastService.error(
                        response.data.message || 'Unable to clock in.'
                    );
                }
            }
            catch (error) {
                console.error(
                    "Clock In failed:",
                    error.response?.data || error.message
                );
                ToastService.error(error.response?.data?.message || "Unable to clock in.");
            } finally {
                this.isClockingIn = false;
            }
        },

        //Updating the data if the user is clocked out successfully
        async confirmClockOut() {
            this.isClockingOut = true;

            try {

                const response = await axios.post('/ClockIn/ClockOut', {
                    guardId: window.GuardId
                });

                if (response.data.success) {

                    this.clockInStatus = false;
                    this.clockInSwitch = false;
                    this.clockLogs = [response.data.record];
                    await this.loadShiftActivityLogs();
                    ToastService.success('Success: Clocked Out Successfully');
                }
                else {
                    ToastService.error(
                        response.data.message || 'Unable to clock out.'
                    );
                }
            }
            catch (error) {
                console.error(
                    "Clock Out failed:",
                    error.response?.data || error.message
                );
                // Restore the switch if the request fails
                this.clockInSwitch = true;
                ToastService.error(error.response?.data?.message || "Unable to clock out.");
            } finally {
                this.isClockingOut = false;
            }
        },
        //Closing clock In form with close or cross button
        closeClockInForm() {
            this.showClockInForm = false;
            this.clockInSwitch = false;
        },
        
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
                ToastService.error("Error: Something went wrong.");
            }
        },

        //start task timer
        startTask() {
            if (this.taskRunning || this.taskCompleted) {
                return;
            }
            this.taskStartTime = performance.now();
            this.taskRunning = true;
            this.timerInterval = setInterval(() => {
                this.totalSeconds = Math.floor(performance.now() - this.taskStartTime) / 1000
            }, 1000);
            ToastService.info("Info: Task Started");
        },
        //end task timer
        endTask() {
            if (!this.taskRunning) return;

            this.taskEndTime = performance.now();

            clearInterval(this.timerInterval);
            this.timerInterval = null;
            this.totalSeconds = Math.floor((this.taskEndTime - this.taskStartTime) / 1000);
            this.taskRunning = false;
            this.taskCompleted = true;
            ToastService.success("Success: Task Completed");
        },
        //Activity Log Clock In/Clock Out
        async loadShiftActivityLogs() {
            this.isLoadingActivityLogs = true;
            try {
                const response = await axios.get('/ClockIn/GetShiftActivityLog', {
                    params: {
                        guardId: this.guardId
                    }
                });
                this.shiftActivityLogs = response.data.sort((a, b) => {
                    return new Date(b.clockInTime) - new Date(a.clockInTime);
                });
            } catch (error) {
                console.error("Error loading shift sctivity log", error);
                ToastService.error("Error: Something went wrong.");
            }
            finally {
                this.isLoadingActivityLogs = false;
            }
        }
    }
    
});